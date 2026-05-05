import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import EditDeckModal from '../components/EditDeckModal';
import CardEditor from '../components/CardEditor';
import CardGrid from '../components/CardGrid';
import PageBanner from '../components/PageBanner';
import ProgressBar from '../components/ProgressBar';
import AICardGenModal from '../components/AICardGenModal';
import '../css/DeckPage.css';
import '../css/EmptyState.css';
import {
    apiGetDeck,
    apiGetCards,
    apiUpdateDeck,
    apiDeleteDeck,
    apiCreateCard,
    apiUpdateCard,
    apiDeleteCard,
} from '../api';

const DEFAULT_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg';

function DeckPage() {
    const { deckId } = useParams();
    const navigate = useNavigate();

    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadDeck();
    }, [deckId]);

    const loadDeck = async () => {
        try {
            setLoading(true);
            const [deckData, cardData] = await Promise.all([
                apiGetDeck(deckId),
                apiGetCards(deckId),
            ]);
            setDeck({
                id:       deckData.id,
                deckName: deckData.name,
                color:    deckData.color || '#378ADD',
                imgURL:   DEFAULT_IMG,
                progress: 0,
                tags:     deckData.tags || [],
            });
            setCards(cardData);
        } catch (err) {
            console.error('could not load deck:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeckSave = async (updated) => {
        try {
            await apiUpdateDeck(deck.id, {
                name:        updated.deckName,
                color:       updated.color,
                description: '',
            });
            setDeck(prev => ({ ...prev, deckName: updated.deckName, color: updated.color }));
            setShowEditModal(false);
        } catch (err) {
            alert('Could not save deck: ' + err.message);
        }
    };

    const handleDeleteDeck = async () => {
        if (!window.confirm('Delete this deck and all its cards?')) return;
        try {
            await apiDeleteDeck(deck.id);
            navigate('/decks');
        } catch (err) {
            alert('Could not delete deck: ' + err.message);
        }
    };

    const handleCardsSave = async (editedCards) => {
        try {
            const originalIds = new Set(cards.map(c => c.id));
            const toDelete = cards.filter(c => !editedCards.find(e => e.id === c.id));
            const toUpdate = editedCards.filter(c => originalIds.has(c.id));
            const toCreate = editedCards.filter(c => !originalIds.has(c.id));

            await Promise.all([
                ...toDelete.map(c => apiDeleteCard(c.id)),
                ...toUpdate.map(c => apiUpdateCard(c.id, { front: c.front, back: c.back })),
                ...toCreate.map(c => apiCreateCard(deck.id, { front: c.front, back: c.back })),
            ]);

            const fresh = await apiGetCards(deck.id);
            setCards(fresh);
            setIsEditing(false);
        } catch (err) {
            alert('Could not save cards: ' + err.message);
        }
    };

    const handleAICards = async (generatedCards) => {
        try {
            await Promise.all(
                generatedCards.map(c => apiCreateCard(deck.id, { front: c.front, back: c.back }))
            );
            const fresh = await apiGetCards(deck.id);
            setCards(fresh);
            setShowAIModal(false);
        } catch (err) {
            alert('Could not save AI cards: ' + err.message);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
    if (!deck)   return <div style={{ padding: '2rem' }}>Deck not found</div>;

    return (
        <div
            className="deck-page"
            style={{ background: `linear-gradient(to bottom, color-mix(in srgb, ${deck.color} 15%, #ffffff) 0%, #ffffff 40%)` }}
        >
            <PageBanner
                imgURL={null}
                color={deck.color}
                title={deck.deckName}
                meta={`${cards.length} cards`}
                tags={deck.tags}
                actions={
                    <>
                        <button className="banner-btn" onClick={() => setIsEditing(true)}>
                            Edit Cards
                        </button>
                        <button
                            className="banner-btn"
                            onClick={() => setShowAIModal(true)}
                        >
                            ✦ AI Generate
                        </button>
                        <button
                            className="banner-btn primary"
                            style={{ '--banner-color': deck.color }}
                            onClick={() => navigate(`/decks/${deck.id}/study`)}
                        >
                            Study now →
                        </button>
                        <div className="dropdown">
                            <button className="three-dots-btn" onClick={() => setShowMenu(p => !p)}>···</button>
                            {showMenu && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-item" onClick={() => { setShowEditModal(true); setShowMenu(false); }}>
                                        Edit deck
                                    </div>
                                    <div className="dropdown-divider" />
                                    <div className="dropdown-item danger" onClick={handleDeleteDeck}>
                                        Delete deck
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                }
            />

            <div className="progress-section">
                <div className="progress-row">
                    <ProgressBar completed={deck.progress} bgcolor={deck.color} />
                    <span className="progress-label">{deck.progress}% complete</span>
                </div>
            </div>

            {isEditing ? (
                <CardEditor
                    cards={cards}
                    color={deck.color}
                    onSave={handleCardsSave}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <CardGrid
                    cards={cards}
                    color={deck.color}
                    onAddCard={() => setIsEditing(true)}
                />
            )}

            {showEditModal && (
                <EditDeckModal
                    deck={{ ...deck, id: deck.id }}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleDeckSave}
                />
            )}

            {showAIModal && createPortal(
                <AICardGenModal
                    deckId={deck.id}
                    onClose={() => setShowAIModal(false)}
                    onAddCards={handleAICards}
                />,
                document.body
            )}
        </div>
    );
}

export default DeckPage;