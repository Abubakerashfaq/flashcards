-- SQLite schema for Flashcard App
-- All tables use IF NOT EXISTS so this script is safe to re-run on startup.
-- Deleting a user cascades through all their data (decks, cards, sessions, etc).

-- ── users ─────────────────────────────────────────────────────────────────────
-- One row per registered account. Passwords are stored as Werkzeug hashes,
-- never plain text.

CREATE TABLE IF NOT EXISTS user (
    user_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT NOT NULL UNIQUE,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,           -- bcrypt/pbkdf2 hash via Werkzeug
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── decks ─────────────────────────────────────────────────────────────────────
-- A deck belongs to one user and holds a collection of flashcards.
-- color is a hex string used for UI theming (#rrggbb).

CREATE TABLE IF NOT EXISTS deck (
    deck_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    deck_name   TEXT NOT NULL,
    description TEXT,
    color       TEXT DEFAULT '#2563eb',  -- hex theme color shown on deck card
    img_url     TEXT DEFAULT '',         -- cover image (uploaded or external URL)
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- ── flashcards ────────────────────────────────────────────────────────────────
-- Each card has a front (question) and back (answer), plus an optional hint.

CREATE TABLE IF NOT EXISTS flashcard (
    flashcard_id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id      INTEGER NOT NULL,
    front_text   TEXT NOT NULL,
    back_text    TEXT NOT NULL,
    hint         TEXT,                  -- optional hint shown before flipping
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES deck(deck_id) ON DELETE CASCADE
);

-- ── tags ──────────────────────────────────────────────────────────────────────
-- Global tag list. Tags are linked to individual cards via flashcard_tag.
-- tag names are unique across the whole app (not per user).

CREATE TABLE IF NOT EXISTS tag (
    tag_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many: one card can have multiple tags, one tag can appear on many cards.
CREATE TABLE IF NOT EXISTS flashcard_tag (
    flashcard_id INTEGER NOT NULL,
    tag_id       INTEGER NOT NULL,
    PRIMARY KEY (flashcard_id, tag_id),
    FOREIGN KEY (flashcard_id) REFERENCES flashcard(flashcard_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)       REFERENCES tag(tag_id)             ON DELETE CASCADE
);

-- ── study sessions ────────────────────────────────────────────────────────────
-- One row per completed study session. score is 0-100 (percentage correct).
-- cards_studied is the count of cards the user actually reviewed that session.

CREATE TABLE IF NOT EXISTS study_session (
    session_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    deck_id       INTEGER NOT NULL,
    session_date  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score         INTEGER DEFAULT 0,    -- 0–100, percentage correct
    cards_studied INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (deck_id) REFERENCES deck(deck_id) ON DELETE CASCADE,
    CHECK (score BETWEEN 0 AND 100),
    CHECK (cards_studied >= 0)
);

-- Per-card log within a session. result is one of: correct / incorrect / skipped.
-- response_time_ms is how long the user took to answer (nullable if not tracked).
-- session_id is nullable so orphaned logs survive if a session row is deleted.

CREATE TABLE IF NOT EXISTS study_log (
    log_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id       INTEGER,            -- nullable: SET NULL if session deleted
    user_id          INTEGER NOT NULL,
    flashcard_id     INTEGER NOT NULL,
    studied_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result           TEXT NOT NULL CHECK (result IN ('correct', 'incorrect', 'skipped')),
    response_time_ms INTEGER,            -- null if not measured
    FOREIGN KEY (session_id)   REFERENCES study_session(session_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id)      REFERENCES user(user_id)             ON DELETE CASCADE,
    FOREIGN KEY (flashcard_id) REFERENCES flashcard(flashcard_id)   ON DELETE CASCADE,
    CHECK (response_time_ms IS NULL OR response_time_ms >= 0)
);

-- ── classes ───────────────────────────────────────────────────────────────────
-- A class groups multiple decks together (e.g. "Biology 101").
-- class_deck is the join table for the many-to-many relationship.

CREATE TABLE IF NOT EXISTS class (
    class_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    class_name TEXT NOT NULL,
    color      TEXT DEFAULT '#4cacaf',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_deck (
    class_id INTEGER NOT NULL,
    deck_id  INTEGER NOT NULL,
    PRIMARY KEY (class_id, deck_id),
    FOREIGN KEY (class_id) REFERENCES class(class_id) ON DELETE CASCADE,
    FOREIGN KEY (deck_id)  REFERENCES deck(deck_id)   ON DELETE CASCADE
);

-- ── scheduled sessions ────────────────────────────────────────────────────────
-- User-created calendar entries linking a deck to a study date (ISO string).

CREATE TABLE IF NOT EXISTS scheduled_session (
    schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    deck_id     INTEGER NOT NULL,
    date        TEXT NOT NULL,          -- ISO date string: YYYY-MM-DD
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (deck_id) REFERENCES deck(deck_id) ON DELETE CASCADE
);

-- ── indexes ───────────────────────────────────────────────────────────────────
-- Covering the most common query patterns: fetching by owner, by deck, by date.

CREATE INDEX IF NOT EXISTS idx_deck_user             ON deck(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_deck        ON flashcard(deck_id);
CREATE INDEX IF NOT EXISTS idx_class_user            ON class(user_id);
CREATE INDEX IF NOT EXISTS idx_classdeck_class       ON class_deck(class_id);
CREATE INDEX IF NOT EXISTS idx_session_user_deck     ON study_session(user_id, deck_id);
CREATE INDEX IF NOT EXISTS idx_session_date          ON study_session(session_date);
CREATE INDEX IF NOT EXISTS idx_tag_name              ON tag(name);
CREATE INDEX IF NOT EXISTS idx_flashcardtag_tag      ON flashcard_tag(tag_id);
CREATE INDEX IF NOT EXISTS idx_studylog_user_card_time ON study_log(user_id, flashcard_id, studied_at);
CREATE INDEX IF NOT EXISTS idx_studylog_session      ON study_log(session_id);
