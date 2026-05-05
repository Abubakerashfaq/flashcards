from flask import Flask, request, jsonify, session, send_from_directory
# Flask = creates the web server, request = read incoming data from frontend
# jsonify = convert python dict to JSON, session = remember who is logged in
# send_from_directory = send files (html, images) to the browser

from flask_cors import CORS
# react runs on port 3000, flask on port 5001, browser blocks this by default
# CORS removes that block so they can talk to each other

from werkzeug.security import generate_password_hash, check_password_hash
# hash the password before saving, never store plain text passwords

from werkzeug.utils import secure_filename
from functools import wraps
# wraps: keeps the original function name when writing decorators

import sqlite3  # to talk to the database
import os       # for file paths and folder operations
import uuid     # to generate random unique names for uploaded images
import json
from datetime import date, timedelta
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# full path of the folder this file is in, used to find other files

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'static'))
# create the flask app, react build files live in the static folder

app.secret_key = os.environ.get('SECRET_KEY', 'flashcard_demo_key_2025')
# used to encrypt session cookies, read from environment or use fallback

CORS(app, supports_credentials=True)
# supports_credentials=True is required otherwise session cookies wont be sent

DB_PATH = os.path.join(BASE_DIR, 'flashcards.db')
# full path to our sqlite database file

UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
# only allow image files, we dont want users uploading .exe or .py files

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# create uploads folder if it doesnt exist, dont raise error if it already does


def allowed_file(filename):
    # check if the file extension is in our allowed list
    # rsplit('.', 1) → "photo.jpg" → ["photo", "jpg"], [1] gets the extension
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── database helpers ──────────────────────────────────────────────────────────

def get_db():
    # open a connection to the sqlite database and return it
    # every function calls this at the start and conn.close() at the end
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # row_factory lets us access columns by name instead of index
    # without it: row[0], row[1]  →  with it: row['deck_id'], row['deck_name']
    conn.execute('PRAGMA foreign_keys = ON')
    # without this, cascade (auto-delete cards when deck is deleted) wont work
    return conn


def init_db():
    # runs once when app starts, reads schema.sql and creates tables if they dont exist
    conn = get_db()
    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'schema.sql')
    with open(schema_path, 'r') as f:
        conn.executescript(f.read())  # run multiple SQL statements at once

    # migrations for existing databases — safely ignored if columns already exist
    migrations = [
        "ALTER TABLE flashcard ADD COLUMN due_date TEXT DEFAULT NULL",
        "ALTER TABLE flashcard ADD COLUMN interval_days INTEGER DEFAULT 1",
        "ALTER TABLE flashcard ADD COLUMN ease_factor REAL DEFAULT 2.5",
        "ALTER TABLE flashcard ADD COLUMN repetitions INTEGER DEFAULT 0",
        "ALTER TABLE flashcard ADD COLUMN mastery INTEGER DEFAULT 0",
        "ALTER TABLE user ADD COLUMN streak_days INTEGER DEFAULT 0",
        "ALTER TABLE user ADD COLUMN last_studied_date TEXT DEFAULT NULL",
        "ALTER TABLE deck ADD COLUMN progress INTEGER DEFAULT 0",
    ]
    for m in migrations:
        try:
            conn.execute(m)
        except sqlite3.OperationalError:
            pass

    conn.commit()
    conn.close()


# ── auth decorator ────────────────────────────────────────────────────────────

def login_required(f):
    # put @login_required above any route that needs the user to be logged in
    # if user_id is not in session, return 401, otherwise run the actual function
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Please log in first'}), 401
        return f(*args, **kwargs)
    return wrapper


# ── serve frontend ────────────────────────────────────────────────────────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    # send the react app for any non-api route
    # if its a real file (js, css) send it directly, otherwise send index.html
    # react router handles the actual page navigation on the frontend side
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    static_file = os.path.join(app.static_folder, path)
    if path and os.path.exists(static_file):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


# ── auth routes ───────────────────────────────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def register():
    # register a new user
    # we hash the password before saving, plain text is never stored
    # if email/username already exists sqlite raises IntegrityError → we return 409
    data     = request.json
    username = (data.get('username') or '').strip()
    email    = (data.get('email')    or '').strip()
    password = (data.get('password') or '')

    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400

    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400

    hashed = generate_password_hash(password)

    try:
        conn = get_db()
        conn.execute(
            'INSERT INTO user (username, email, password) VALUES (?, ?, ?)',
            (username, email, hashed)
            # using ? placeholders instead of f-strings to prevent SQL injection
        )
        conn.commit()  # save the change permanently to disk
        conn.close()
        return jsonify({'message': 'Account created! You can now log in.'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email is already taken'}), 409


@app.route('/api/login', methods=['POST'])
def login():
    # find the user by email, then compare the password with the stored hash
    # we return the same error for both wrong email and wrong password
    # saying which one is wrong would help attackers figure out registered emails
    data     = request.json
    email    = (data.get('email')    or '').strip()
    password = (data.get('password') or '')

    conn = get_db()
    user = conn.execute(
        'SELECT * FROM user WHERE email = ?', (email,)
    ).fetchone()  # returns one row or None if not found
    conn.close()

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Wrong email or password'}), 401

    # login successful, write user info to session
    # session is an encrypted cookie stored in the browser
    session['user_id']  = user['user_id']
    session['username'] = user['username']
    session['email']    = user['email']
    return jsonify({'message': 'Logged in', 'username': user['username']})


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()  # remove everything from session, user is now logged out
    return jsonify({'message': 'Logged out'})


@app.route('/api/me')
def me():
    # react calls this on page refresh to check if the user is still logged in
    # session persists through cookies so login survives a page refresh
    if 'user_id' not in session:
        return jsonify({'logged_in': False})
    conn = get_db()
    user = conn.execute('SELECT streak_days FROM user WHERE user_id = ?',
                        (session['user_id'],)).fetchone()
    conn.close()
    return jsonify({
        'logged_in':   True,
        'username':    session['username'],
        'email':       session.get('email', ''),
        'streak_days': user['streak_days'] or 0,
    })


# ── upload routes ─────────────────────────────────────────────────────────────

@app.route('/api/upload', methods=['POST'])
@login_required
def upload_image():
    # handle image upload
    # we dont use the original filename for security
    # we generate a random uuid name and only keep the extension
    if 'file' not in request.files:
        return jsonify({'error': 'No file sent'}), 400
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file'}), 400
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"  # example: "a3f9b2c1...jpg"
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return jsonify({'url': f'/api/uploads/{filename}'}), 201


@app.route('/api/uploads/<filename>')
def serve_upload(filename):
    # serve uploaded image files to the browser
    return send_from_directory(UPLOAD_FOLDER, filename)


# ── deck routes ───────────────────────────────────────────────────────────────

@app.route('/api/decks', methods=['GET'])
@login_required
def get_decks():
    # return all decks belonging to the logged in user
    # also count how many cards are inside each deck
    conn  = get_db()
    decks = conn.execute(
        'SELECT * FROM deck WHERE user_id = ? ORDER BY created_at DESC',
        (session['user_id'],)
    ).fetchall()  # returns all matching rows as a list

    today  = date.today().isoformat()
    result = []
    for d in decks:
        count = conn.execute(
            'SELECT COUNT(*) as cnt FROM flashcard WHERE deck_id = ?',
            (d['deck_id'],)
        ).fetchone()['cnt']
        due_count = conn.execute(
            'SELECT COUNT(*) as cnt FROM flashcard WHERE deck_id = ? AND (due_date IS NULL OR due_date <= ?)',
            (d['deck_id'], today)
        ).fetchone()['cnt']
        avg_mastery = conn.execute(
            'SELECT COALESCE(AVG(CAST(mastery AS FLOAT)), 0) as avg FROM flashcard WHERE deck_id = ?',
            (d['deck_id'],)
        ).fetchone()['avg']
        result.append({
            'id':          d['deck_id'],
            'name':        d['deck_name'],
            'description': d['description'] or '',
            'color':       d['color'] or '#2563eb',
            'img_url':     d['img_url'] if 'img_url' in d.keys() else '',
            'card_count':  count,
            'due_count':   due_count,
            'avg_mastery': round(avg_mastery, 1),
            'progress':    d['progress'] or 0,
            'tags':        []
        })
    conn.close()
    return jsonify(result)


@app.route('/api/decks/<int:deck_id>', methods=['GET'])
@login_required
def get_deck(deck_id):
    # return a single deck
    # we check both deck_id and user_id in WHERE so users cant access each others decks
    # we return 404 instead of 403 so we dont reveal whether the deck exists at all
    conn = get_db()
    deck = conn.execute(
        'SELECT * FROM deck WHERE deck_id = ? AND user_id = ?',
        (deck_id, session['user_id'])
    ).fetchone()

    if not deck:
        conn.close()
        return jsonify({'error': 'Deck not found'}), 404

    today       = date.today().isoformat()
    count       = conn.execute('SELECT COUNT(*) as cnt FROM flashcard WHERE deck_id = ?', (deck_id,)).fetchone()['cnt']
    due_count   = conn.execute('SELECT COUNT(*) as cnt FROM flashcard WHERE deck_id = ? AND (due_date IS NULL OR due_date <= ?)', (deck_id, today)).fetchone()['cnt']
    avg_mastery = conn.execute('SELECT COALESCE(AVG(CAST(mastery AS FLOAT)), 0) as avg FROM flashcard WHERE deck_id = ?', (deck_id,)).fetchone()['avg']
    conn.close()

    return jsonify({
        'id':          deck['deck_id'],
        'name':        deck['deck_name'],
        'description': deck['description'] or '',
        'color':       deck['color'] or '#2563eb',
        'img_url':     deck['img_url'] if 'img_url' in deck.keys() else '',
        'card_count':  count,
        'due_count':   due_count,
        'avg_mastery': round(avg_mastery, 1),
        'progress':    deck['progress'] or 0,
        'tags':        []
    })


@app.route('/api/decks', methods=['POST'])
@login_required
def create_deck():
    # create a new deck, only name is required
    data = request.json
    name = (data.get('name') or '').strip()

    if not name:
        return jsonify({'error': 'Deck name is required'}), 400

    conn = get_db()
    cur = conn.execute(
        'INSERT INTO deck (user_id, deck_name, description, color, img_url) VALUES (?, ?, ?, ?, ?)',
        (session['user_id'], name, data.get('description', ''), data.get('color', '#2563eb'), data.get('img_url', ''))
    )
    conn.commit()
    new_id = cur.lastrowid  # auto-generated ID of the row we just inserted
    conn.close()

    return jsonify({
        'id':          new_id,
        'name':        name,
        'card_count':  0,
        'tags':        [],
        'img_url':     '',
        'description': data.get('description', ''),
        'color':       data.get('color', '#2563eb')
    }), 201


@app.route('/api/decks/<int:deck_id>', methods=['PUT'])
@login_required
def update_deck(deck_id):
    # update deck info
    # for fields not sent by react, keep the current value from the database
    conn = get_db()
    deck = conn.execute(
        'SELECT * FROM deck WHERE deck_id = ? AND user_id = ?',
        (deck_id, session['user_id'])
    ).fetchone()

    if not deck:
        conn.close()
        return jsonify({'error': 'Deck not found'}), 404

    data = request.json
    conn.execute(
    'UPDATE deck SET deck_name=?, description=?, color=?, img_url=?, progress=? WHERE deck_id=?',
    (data.get('name', deck['deck_name']),
     data.get('description', deck['description']),
     data.get('color', deck['color']),
     data.get('img_url', deck['img_url'] if 'img_url' in deck.keys() else ''),
     data.get('progress', deck['progress'] or 0),
     deck_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deck updated'})


@app.route('/api/decks/<int:deck_id>', methods=['DELETE'])
@login_required
def delete_deck(deck_id):
    # delete a deck, its cards are automatically deleted via foreign key cascade
    conn = get_db()
    deck = conn.execute(
        'SELECT * FROM deck WHERE deck_id = ? AND user_id = ?',
        (deck_id, session['user_id'])
    ).fetchone()

    if not deck:
        conn.close()
        return jsonify({'error': 'Deck not found'}), 404

    conn.execute('DELETE FROM deck WHERE deck_id = ?', (deck_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deck deleted'})


# ── card routes ───────────────────────────────────────────────────────────────

@app.route('/api/decks/<int:deck_id>/cards', methods=['GET'])
@login_required
def get_cards(deck_id):
    # return all cards inside a deck
    # first check the deck belongs to this user, then fetch the cards
    conn = get_db()
    deck = conn.execute(
        'SELECT * FROM deck WHERE deck_id = ? AND user_id = ?',
        (deck_id, session['user_id'])
    ).fetchone()

    if not deck:
        conn.close()
        return jsonify({'error': 'Deck not found'}), 404

    cards = conn.execute(
        'SELECT * FROM flashcard WHERE deck_id = ? ORDER BY created_at',
        (deck_id,)
    ).fetchall()
    conn.close()

    return jsonify([{
        'id':          c['flashcard_id'],
        'front':       c['front_text'],
        'back':        c['back_text'],
        'hint':        c['hint'] or '',
        'mastery':     c['mastery'] or 0,
        'due_date':    c['due_date'],
        'repetitions': c['repetitions'] or 0,
    } for c in cards])


@app.route('/api/decks/<int:deck_id>/cards', methods=['POST'])
@login_required
def create_card(deck_id):
    # add a new card to a deck, front and back are required, hint is optional
    conn = get_db()
    deck = conn.execute(
        'SELECT * FROM deck WHERE deck_id = ? AND user_id = ?',
        (deck_id, session['user_id'])
    ).fetchone()

    if not deck:
        conn.close()
        return jsonify({'error': 'Deck not found'}), 404

    data  = request.json
    front = (data.get('front') or '').strip()
    back  = (data.get('back')  or '').strip()

    if not front or not back:
        return jsonify({'error': 'Front and back text are required'}), 400

    cur = conn.execute(
        'INSERT INTO flashcard (deck_id, front_text, back_text, hint) VALUES (?, ?, ?, ?)',
        (deck_id, front, back, data.get('hint', ''))
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()

    return jsonify({'id': new_id, 'front': front, 'back': back,
                    'hint': data.get('hint', '')}), 201


@app.route('/api/cards/<int:card_id>', methods=['PUT'])
@login_required
def update_card(card_id):
    # update a card
    # flashcard table has no user_id, ownership chain is: card → deck → user
    # we use JOIN to check "does this card belong to this users deck"
    conn = get_db()
    card = conn.execute('''
        SELECT f.* FROM flashcard f
        JOIN deck d ON f.deck_id = d.deck_id
        WHERE f.flashcard_id = ? AND d.user_id = ?
    ''', (card_id, session['user_id'])).fetchone()

    if not card:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404

    data = request.json
    conn.execute(
        'UPDATE flashcard SET front_text=?, back_text=?, hint=? WHERE flashcard_id=?',
        (data.get('front', card['front_text']),
         data.get('back',  card['back_text']),
         data.get('hint',  card['hint']),
         card_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Card updated'})


@app.route('/api/cards/<int:card_id>', methods=['DELETE'])
@login_required
def delete_card(card_id):
    # delete a card, same JOIN ownership check as update_card
    conn = get_db()
    card = conn.execute('''
        SELECT f.* FROM flashcard f
        JOIN deck d ON f.deck_id = d.deck_id
        WHERE f.flashcard_id = ? AND d.user_id = ?
    ''', (card_id, session['user_id'])).fetchone()

    if not card:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404

    conn.execute('DELETE FROM flashcard WHERE flashcard_id = ?', (card_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Card deleted'})


# ── review route (SRS + streak) ───────────────────────────────────────────────

@app.route('/api/cards/<int:card_id>/review', methods=['POST'])
@login_required
def review_card(card_id):
    conn = get_db()
    card = conn.execute('''
        SELECT f.* FROM flashcard f
        JOIN deck d ON f.deck_id = d.deck_id
        WHERE f.flashcard_id = ? AND d.user_id = ?
    ''', (card_id, session['user_id'])).fetchone()

    if not card:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404

    result   = (request.json or {}).get('result', 'incorrect')
    reps     = card['repetitions'] or 0
    ef       = card['ease_factor'] or 2.5
    interval = card['interval_days'] or 1

    if result == 'correct':
        new_interval = 1 if reps == 0 else (6 if reps == 1 else max(1, round(interval * ef)))
        new_ef   = max(1.3, ef + 0.1)
        new_reps = reps + 1
    else:
        new_interval = 1
        new_ef   = max(1.3, ef - 0.2)
        new_reps = 0

    new_mastery  = min(5, new_reps)
    new_due_date = (date.today() + timedelta(days=new_interval)).isoformat()

    conn.execute(
        'UPDATE flashcard SET repetitions=?, ease_factor=?, interval_days=?, mastery=?, due_date=? WHERE flashcard_id=?',
        (new_reps, new_ef, new_interval, new_mastery, new_due_date, card_id)
    )

    # update streak
    today     = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    user      = conn.execute('SELECT streak_days, last_studied_date FROM user WHERE user_id = ?',
                             (session['user_id'],)).fetchone()
    last   = user['last_studied_date']
    streak = user['streak_days'] or 0
    if last != today:
        streak = streak + 1 if last == yesterday else 1
        conn.execute('UPDATE user SET streak_days=?, last_studied_date=? WHERE user_id=?',
                     (streak, today, session['user_id']))

    conn.commit()
    conn.close()
    return jsonify({'mastery': new_mastery, 'due_date': new_due_date, 'streak_days': streak})


# ── AI generation ────────────────────────────────────────────────────────────

@app.route('/api/decks/<int:deck_id>/generate', methods=['POST'])
@login_required
def generate_cards(deck_id):
    conn = get_db()
    deck = conn.execute(
        'SELECT * FROM deck WHERE deck_id = ? AND user_id = ?',
        (deck_id, session['user_id'])
    ).fetchone()
    conn.close()

    if not deck:
        return jsonify({'error': 'Deck not found'}), 404

    if not os.environ.get('ANTHROPIC_API_KEY'):
        return jsonify({'error': 'AI not configured'}), 503

    data  = request.json or {}
    topic = (data.get('topic') or '').strip()
    count = min(int(data.get('count', 5)), 20)

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    prompt = (
        f'Generate {count} flashcards about "{topic}". '
        f'Return ONLY a raw JSON array with no markdown, no code fences, no extra text. '
        f'Each item must have exactly two keys: "front" (the question) and "back" (the answer). '
        f'Example format: [{{"front":"What is X?","back":"X is Y."}}]'
    )

    try:
        client  = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        message = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=1024,
            messages=[{'role': 'user', 'content': prompt}]
        )
        text = message.content[0].text.strip()

        # find the JSON array even if Claude adds surrounding text
        start = text.find('[')
        end   = text.rfind(']')
        if start == -1 or end == -1:
            return jsonify({'error': f'Unexpected AI response: {text[:300]}'}), 500
        text = text[start:end + 1]

        cards = json.loads(text)
        if not isinstance(cards, list):
            raise ValueError('Response is not a list')
        cards = [{'front': str(c['front']), 'back': str(c['back'])} for c in cards]
    except json.JSONDecodeError as e:
        return jsonify({'error': f'Could not parse AI response as JSON: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'AI generation failed: {str(e)}'}), 500

    return jsonify(cards)


# ── class routes ──────────────────────────────────────────────────────────────

@app.route('/api/classes', methods=['GET'])
@login_required
def get_classes():
    # return all classes for the user
    # class_deck is a junction table, one class can have many decks
    conn = get_db()
    classes = conn.execute(
        'SELECT * FROM class WHERE user_id = ? ORDER BY created_at DESC',
        (session['user_id'],)
    ).fetchall()
    result = []
    for c in classes:
        deck_ids = [row['deck_id'] for row in conn.execute(
            'SELECT deck_id FROM class_deck WHERE class_id = ?', (c['class_id'],)
        ).fetchall()]
        result.append({
            'id':        c['class_id'],
            'className': c['class_name'],
            'color':     c['color'] or '#4cacaf',
            'deckIds':   deck_ids,
        })
    conn.close()
    return jsonify(result)


@app.route('/api/classes', methods=['POST'])
@login_required
def create_class():
    # create a new class
    data = request.json
    name = (data.get('className') or '').strip()
    if not name:
        return jsonify({'error': 'Class name is required'}), 400
    conn = get_db()
    cur = conn.execute(
        'INSERT INTO class (user_id, class_name, color) VALUES (?, ?, ?)',
        (session['user_id'], name, data.get('color', '#4cacaf'))
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({'id': new_id, 'className': name, 'color': data.get('color', '#4cacaf'), 'deckIds': []}), 201


@app.route('/api/classes/<int:class_id>', methods=['PUT'])
@login_required
def update_class(class_id):
    # update class info and its linked decks
    # cls instead of class because "class" is a reserved keyword in python
    conn = get_db()
    cls = conn.execute(
        'SELECT * FROM class WHERE class_id = ? AND user_id = ?',
        (class_id, session['user_id'])
    ).fetchone()
    if not cls:
        conn.close()
        return jsonify({'error': 'Class not found'}), 404
    data = request.json
    conn.execute(
        'UPDATE class SET class_name=?, color=? WHERE class_id=?',
        (data.get('className', cls['class_name']), data.get('color', cls['color']), class_id)
    )
    if 'deckIds' in data:
        # full replace: delete old connections then insert the new ones
        conn.execute('DELETE FROM class_deck WHERE class_id = ?', (class_id,))
        for deck_id in data['deckIds']:
            conn.execute('INSERT OR IGNORE INTO class_deck (class_id, deck_id) VALUES (?, ?)', (class_id, deck_id))
            # INSERT OR IGNORE: if this connection already exists, skip silently
    conn.commit()
    conn.close()
    return jsonify({'message': 'Class updated'})


@app.route('/api/classes/<int:class_id>', methods=['DELETE'])
@login_required
def delete_class(class_id):
    # delete a class, class_deck rows are removed automatically via cascade
    conn = get_db()
    cls = conn.execute(
        'SELECT * FROM class WHERE class_id = ? AND user_id = ?',
        (class_id, session['user_id'])
    ).fetchone()
    if not cls:
        conn.close()
        return jsonify({'error': 'Class not found'}), 404
    conn.execute('DELETE FROM class WHERE class_id = ?', (class_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Class deleted'})


@app.route('/api/classes/<int:class_id>/decks', methods=['GET'])
@login_required
def get_class_decks(class_id):
    # return all decks linked to a class
    # JOIN goes through the class_deck junction table to reach deck info
    conn = get_db()
    cls = conn.execute(
        'SELECT * FROM class WHERE class_id = ? AND user_id = ?',
        (class_id, session['user_id'])
    ).fetchone()
    if not cls:
        conn.close()
        return jsonify({'error': 'Class not found'}), 404
    decks = conn.execute('''
        SELECT d.* FROM deck d
        JOIN class_deck cd ON d.deck_id = cd.deck_id
        WHERE cd.class_id = ?
    ''', (class_id,)).fetchall()
    result = []
    for d in decks:
        count = conn.execute(
            'SELECT COUNT(*) as cnt FROM flashcard WHERE deck_id = ?', (d['deck_id'],)
        ).fetchone()['cnt']
        result.append({
            'id': d['deck_id'], 'name': d['deck_name'],
            'color': d['color'] or '#378ADD',
            'card_count': count, 'img_url': d['img_url'] if 'img_url' in d.keys() else '', 'tags': []
        })
    conn.close()
    return jsonify(result)


# ── scheduled session routes ──────────────────────────────────────────────────

@app.route('/api/schedule', methods=['GET'])
@login_required
def get_schedule():
    # return all planned study sessions for the user
    # JOIN with deck table so we also get deck name and color in the same query
    conn = get_db()
    rows = conn.execute('''
        SELECT s.schedule_id, s.date, d.deck_name, d.color, d.deck_id
        FROM scheduled_session s
        JOIN deck d ON s.deck_id = d.deck_id
        WHERE s.user_id = ?
        ORDER BY s.date
    ''', (session['user_id'],)).fetchall()
    conn.close()
    return jsonify([{
        'id':       r['schedule_id'],
        'date':     r['date'],
        'title':    r['deck_name'],
        'color':    r['color'],
        'deck_id':  r['deck_id'],
    } for r in rows])


@app.route('/api/schedule', methods=['POST'])
@login_required
def create_schedule():
    # schedule a study session for a specific deck on a specific date
    data    = request.json
    deck_id = data.get('deck_id')
    date    = data.get('date')
    if not deck_id or not date:
        return jsonify({'error': 'deck_id and date required'}), 400
    conn = get_db()
    cur = conn.execute(
        'INSERT INTO scheduled_session (user_id, deck_id, date) VALUES (?, ?, ?)',
        (session['user_id'], deck_id, date)
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({'id': new_id, 'date': date, 'deck_id': deck_id}), 201


@app.route('/api/schedule/<int:schedule_id>', methods=['DELETE'])
@login_required
def delete_schedule(schedule_id):
    # cancel a scheduled session, user_id check prevents deleting someone elses session
    conn = get_db()
    conn.execute(
        'DELETE FROM scheduled_session WHERE schedule_id = ? AND user_id = ?',
        (schedule_id, session['user_id'])
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deleted'})


@app.route('/api/change-password', methods=['POST'])
@login_required
def change_password():
    # change password, first verify the old one then save the new one hashed
    data = request.json
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if len(new_password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400

    conn = get_db()
    user = conn.execute(
        'SELECT * FROM user WHERE user_id = ?', (session['user_id'],)
    ).fetchone()

    if not check_password_hash(user['password'], old_password):
        conn.close()
        return jsonify({'error': 'Current password is wrong'}), 401

    conn.execute(
        'UPDATE user SET password = ? WHERE user_id = ?',
        (generate_password_hash(new_password), session['user_id'])
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Password changed'})


# ── start ─────────────────────────────────────────────────────────────────────

init_db()  # create tables when app starts

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f'\n  Flashcard app running → http://localhost:{port}\n')
    app.run(debug=True, port=port)
    # debug=True: auto restarts when code changes, should be False in production