import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Deck from '../components/Deck';
import EditDeckModal from '../components/EditDeckModal';
import EditClassModal from '../components/EditClassModal';
import PageBanner from '../components/PageBanner';
import '../css/ClassPage.css';
import '../css/EmptyState.css';
import {
    apiGetClasses, apiGetClassDecks, apiGetDecks,
    apiCreateDeck, apiUpdateDeck, apiUpdateClass
} from '../api';

function ClassPage() {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [currentClass, setCurrentClass] = useState(null);
    const [decks, setDecks] = useState([]);
    const [allDecks, setAllDecks] = useState([]);
    const [search, setSearch] = useState('');
    const [showDeckModal, setShowDeckModal] = useState(false);
    const [showClassModal, setShowClassModal] = useState(false);
    const [editingDeck, setEditingDeck] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        loadData();
    }, [classId]);

    const loadData = async () => {
        try {
            const [classes, classDecks, allDecksData] = await Promise.all([
                apiGetClasses(),
                apiGetClassDecks(classId),
                apiGetDecks(),
            ]);
            const cls = classes.find(c => c.id === parseInt(classId));
            setCurrentClass(cls);
            setDecks(classDecks.map(d => ({
                id: d.id, deckName: d.name, numCards: d.card_count,
                imgURL: d.img_url || '',
                progress: 0, color: d.color, tags: [], cards: []
            })));
            setAllDecks(allDecksData.map(d => ({ ...d, deckName: d.name })));
        } catch (err) {
            console.error(err);
        }
    };

    if (!currentClass) return <div style={{ padding: '2rem' }}>Loading...</div>;

    const filtered = decks.filter(d =>
        d.deckName.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateDeck = () => {
        setEditingDeck({ deckName: '', imgURL: '', color: currentClass.color, numCards: 0, tags: [], progress: 0, cards: [] });
        setShowDeckModal(true);
    };

    const handleSaveDeck = async (updatedDeck) => {
        try {
            if (updatedDeck.id) {
                await apiUpdateDeck(updatedDeck.id, { name: updatedDeck.deckName, color: updatedDeck.color });
                setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));
            } else {
                const created = await apiCreateDeck({ name: updatedDeck.deckName, color: updatedDeck.color });
                // add to class
                const newDeckIds = [...currentClass.deckIds, created.id];
                await apiUpdateClass(currentClass.id, { ...currentClass, deckIds: newDeckIds });
                setCurrentClass(prev => ({ ...prev, deckIds: newDeckIds }));
                setDecks(prev => [...prev, {
                    id: created.id, deckName: created.name, numCards: 0,
                    imgURL: '', progress: 0, color: created.color, tags: [], cards: []
                }]);
            }
            setShowDeckModal(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleClassSave = async (updated) => {
        try {
            await apiUpdateClass(currentClass.id, updated);
            setCurrentClass(updated);
            // reload decks since class deck association changed
            const classDecks = await apiGetClassDecks(classId);
            setDecks(classDecks.map(d => ({
                id: d.id, deckName: d.name, numCards: d.card_count,
                imgURL: d.img_url || '',
                progress: 0, color: d.color, tags: [], cards: []
            })));
            setShowClassModal(false);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="class-page">
            <PageBanner
                color={currentClass.color}
                title={currentClass.className}
                meta={`${filtered.length} decks`}
                actions={
                    <>
                        <input
                            type="text"
                            className="banner-search"
                            placeholder="Search decks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button className="banner-btn" onClick={handleCreateDeck}>+ New Deck</button>
                        <div className="dropdown">
                            <button className="three-dots-btn" onClick={() => setShowMenu(p => !p)}>···</button>
                            {showMenu && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-item" onClick={() => { setShowClassModal(true); setShowMenu(false); }}>
                                        Edit Class
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                }
            />

            <div className="class-content">
                <div className="section-header">
                    <span className="section-title">Decks</span>
                    <span className="section-count">{filtered.length} decks</span>
                </div>
               <div className="decklist-grid">
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <p className="empty-state-title">
                                {decks.length === 0 ? 'No decks in this class yet' : 'No decks match your search'}
                            </p>
                            <p className="empty-state-text">
                                {decks.length === 0
                                    ? 'Add a deck to get started.'
                                    : 'Try a different search term.'}
                            </p>
                            {decks.length === 0 && (
                                <button className="banner-btn" onClick={handleCreateDeck}>
                                    + New Deck
                                </button>
                            )}
                        </div>
                    ) : (
                        filtered.map(deck => (
                            <Deck key={deck.id} {...deck} onEdit={(d) => { setEditingDeck(d); setShowDeckModal(true); }} />
                        ))
                    )}
                </div>
            </div>

            {showDeckModal && (
                <EditDeckModal
                    deck={editingDeck}
                    onClose={() => setShowDeckModal(false)}
                    onSave={handleSaveDeck}
                />
            )}

            {showClassModal && (
                <EditClassModal
                    classData={currentClass}
                    allDecks={allDecks}
                    onClose={() => setShowClassModal(false)}
                    onSave={handleClassSave}
                />
            )}
        </div>
    );
}

export default ClassPage;