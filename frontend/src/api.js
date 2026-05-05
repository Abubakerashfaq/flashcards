// all backend api calls go here so we dont repeat fetch options everywhere
// backend runs on 5001 by default, change this if needed
const BASE_URL = '';

// generic fetch wrapper - throws an error if the response isnt ok
export async function apiFetch(path, options = {}) {
    const res = await fetch(BASE_URL + path, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // needed so the session cookie gets sent with every request
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
}

// ── auth ──────────────────────────────────────────────────────────────────────

export const apiRegister = (username, email, password) =>
    apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    });

export const apiLogin = (email, password) =>
    apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

export const apiLogout = () =>
    apiFetch('/api/logout', { method: 'POST' });

// check if the user is already logged in (called on app load)
export const apiMe = () => apiFetch('/api/me');

// ── decks ─────────────────────────────────────────────────────────────────────

export const apiGetDecks = () => apiFetch('/api/decks');

export const apiGetDeck = (deckId) => apiFetch(`/api/decks/${deckId}`);

export const apiCreateDeck = (deck) =>
    apiFetch('/api/decks', {
        method: 'POST',
        body: JSON.stringify(deck),
    });

export const apiUpdateDeck = (deckId, deck) =>
    apiFetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        body: JSON.stringify(deck),
    });

export const apiDeleteDeck = (deckId) =>
    apiFetch(`/api/decks/${deckId}`, { method: 'DELETE' });

// ── cards ─────────────────────────────────────────────────────────────────────

export const apiGetCards = (deckId) => apiFetch(`/api/decks/${deckId}/cards`);

export const apiCreateCard = (deckId, card) =>
    apiFetch(`/api/decks/${deckId}/cards`, {
        method: 'POST',
        body: JSON.stringify(card),
    });

export const apiUpdateCard = (cardId, card) =>
    apiFetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(card),
    });

export const apiDeleteCard = (cardId) =>
    apiFetch(`/api/cards/${cardId}`, { method: 'DELETE' });

// ── classes ───────────────────────────────────────────────────────────────────

export const apiGetClasses = () => apiFetch('/api/classes');

export const apiCreateClass = (cls) =>
    apiFetch('/api/classes', { method: 'POST', body: JSON.stringify(cls) });

export const apiUpdateClass = (classId, cls) =>
    apiFetch(`/api/classes/${classId}`, { method: 'PUT', body: JSON.stringify(cls) });

export const apiDeleteClass = (classId) =>
    apiFetch(`/api/classes/${classId}`, { method: 'DELETE' });

export const apiGetClassDecks = (classId) => apiFetch(`/api/classes/${classId}/decks`);

// ── upload ────────────────────────────────────────────────────────────────────

export const apiUploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(BASE_URL + '/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
};

// ── schedule ──────────────────────────────────────────────────────────────────

export const apiGetSchedule = () => apiFetch('/api/schedule');

export const apiCreateSchedule = (deck_id, date) =>
    apiFetch('/api/schedule', {
        method: 'POST',
        body: JSON.stringify({ deck_id, date }),
    });

export const apiDeleteSchedule = (scheduleId) =>
    apiFetch(`/api/schedule/${scheduleId}`, { method: 'DELETE' });

// ── AI generation ────────────────────────────────────────────────────────────

export const apiGenerateCards = (deckId, topic, count) =>
    apiFetch(`/api/decks/${deckId}/generate`, {
        method: 'POST',
        body: JSON.stringify({ topic, count }),
    });

// ── spaced repetition ─────────────────────────────────────────────────────────

export const apiReviewCard = (cardId, result) =>
    apiFetch(`/api/cards/${cardId}/review`, {
        method: 'POST',
        body: JSON.stringify({ result }),
    });