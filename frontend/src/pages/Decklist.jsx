import React, { useState, useEffect } from 'react';
import Deck from '../components/Deck';
import EditDeckModal from '../components/EditDeckModal';
import '../css/Decklist.css';
import { apiGetDecks, apiCreateDeck, apiUpdateDeck } from '../api';
import '../css/EmptyState.css';

// fallback image for decks that dont have a cover set
// TODO: let users upload their own images later
const DEFAULT_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg';

// the backend returns a different shape than what the Deck component expects
// this function converts it
function mapDeck(d) {
    return {
        id:       d.id,
        deckName: d.name,
        numCards: d.card_count,
        imgURL:   d.img_url || DEFAULT_IMG,
        progress: 0,
        color:    d.color || '#378ADD',
        tags:     d.tags || [],
        classId:  null,
        cards:    [],
    };
}

// kept for compatibility - DeckPage and StudySession used to import from here
// now they fetch from the API directly, but leaving this so nothing breaks
export const initialDecks = [];

function Decklist() {
    const [decks, setDecks] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingDeck, setEditingDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // fetch decks from the backend when the page loads
    useEffect(() => {
        loadDecks();
    }, []);

    const loadDecks = async () => {
        try {
            setLoading(true);
            const data = await apiGetDecks();
            setDecks(data.map(mapDeck));
        } catch (err) {
            setError('Could not load decks. Make sure you are logged in.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const allTags = ['All', ...new Set(decks.flatMap(d => d.tags))];

    const filtered = decks
        .filter(d => d.deckName.toLowerCase().includes(search.toLowerCase()))
        .filter(d => activeTag === 'All' || d.tags.includes(activeTag));

    const handleCreate = () => {
        setEditingDeck({ deckName: '', imgURL: '', color: '#378ADD', numCards: 0, tags: [], progress: 0, classId: null, cards: [] });
        setShowModal(true);
    };

    const handleSave = async (updatedDeck) => {
    try {
        if (updatedDeck.id) {
            await apiUpdateDeck(updatedDeck.id, {
                name:        updatedDeck.deckName,
                color:       updatedDeck.color,
                description: '',
                img_url:     updatedDeck.imgURL || '',
            });
            setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));
        } else {
            const created = await apiCreateDeck({
                name:        updatedDeck.deckName,
                color:       updatedDeck.color,
                description: '',
                img_url:     updatedDeck.imgURL || '',
            });
            setDecks(prev => [...prev, { ...mapDeck(created), imgURL: updatedDeck.imgURL || DEFAULT_IMG }]);
        }
        setShowModal(false);
    } catch (err) {
        console.error('could not save deck:', err);
        alert(err.message);
    }
};

    if (loading) return <div style={{ padding: '2rem' }}>Loading decks...</div>;
    if (error)   return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    return (
        <div className="decklist-page">
            <div className="decklist-header">
                <div>
                    <h1 className="decklist-title">My Decks</h1>
                    <p className="decklist-subtitle">{filtered.length} decks</p>
                </div>
                <div className="header-right">
                    <button className="btn-create" onClick={handleCreate}>
                        + New Deck
                    </button>
                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="decklist-search"
                            placeholder="Search decks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="decklist-tags">
                {allTags.map(tag => (
                    <button
                        key={tag}
                        className={`tag-filter ${activeTag === tag ? 'active' : ''}`}
                        onClick={() => setActiveTag(tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            <div className="decklist-grid">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-state-title">
                            {decks.length === 0 ? 'No decks yet' : 'No decks match your search'}
                        </p>
                        <p className="empty-state-text">
                            {decks.length === 0
                                ? 'Create your first deck to start studying.'
                                : 'Try a different search or tag filter.'}
                        </p>
                        {decks.length === 0 && (
                            <button className="btn-create" onClick={handleCreate}>
                                + New Deck
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(deck => (
                        <Deck
                            key={deck.id}
                            {...deck}
                            onEdit={(deck) => { setEditingDeck(deck); setShowModal(true); }}
                        />
                    ))
                )}
            </div>

            {showModal && (
                <EditDeckModal
                    deck={editingDeck}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

export default Decklist;
