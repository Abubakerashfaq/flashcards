# Flashcards Project

## Project Structure

```
flashcards-project/
├── backend/       ← Flask + SQLite (Python)
└── frontend/      ← React + Vite (JavaScript)
```

---

## How to run

You need **two terminals open at the same time**.

### Terminal 1 — Backend (Flask)

```bash
cd backend

# first time only: install dependencies
pip install -r requirements.txt

# run the server
python app.py
```

Backend runs on http://localhost:5001

### Terminal 2 — Frontend (React)

```bash
cd frontend

# first time only: install dependencies
npm install

# run the dev server
npm run dev
```

Frontend runs on http://localhost:5173 — open this in your browser.

---

## Notes

- The database file (`flashcards.db`) is created automatically on first run of `app.py`
- Make sure the backend is running before you open the frontend, otherwise API calls will fail
- If you get a CORS error, make sure you're opening the frontend at `localhost:5173` not by opening the HTML file directly
