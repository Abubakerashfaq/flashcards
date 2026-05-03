import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Folder from '../components/Folder';
import EditClassModal from '../components/EditClassModal';
import '../css/Classes.css';
import '../css/EmptyState.css';
import { apiGetClasses, apiCreateClass, apiUpdateClass, apiDeleteClass, apiGetDecks } from '../api';

function Classes() {
    const [classes, setClasses] = useState([]);
    const [allDecks, setAllDecks] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [cls, decks] = await Promise.all([apiGetClasses(), apiGetDecks()]);
            setClasses(cls);
            setAllDecks(decks.map(d => ({ ...d, deckName: d.name })));
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = classes.filter(c =>
        c.className.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = () => {
        setEditingClass({ className: '', color: '#4cacaf', deckIds: [] });
        setShowModal(true);
    };

    const handleSave = async (updated) => {
        try {
            if (updated.id) {
                await apiUpdateClass(updated.id, updated);
                setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
            } else {
                const created = await apiCreateClass(updated);
                setClasses(prev => [...prev, created]);
            }
            setShowModal(false);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="decklist-page">
            <div className="decklist-header">
                <div>
                    <h1 className="decklist-title">My Classes</h1>
                    <p className="decklist-subtitle">{filtered.length} classes</p>
                </div>
                <div className="header-right">
                    <button className="btn-create" onClick={handleCreate}>+ New Class</button>
                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="decklist-search"
                            placeholder="Search classes..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="classes-grid">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-state-title">
                            {classes.length === 0 ? 'No classes yet' : 'No classes match your search'}
                        </p>
                        <p className="empty-state-text">
                            {classes.length === 0
                                ? 'Create a class to organize your decks.'
                                : 'Try a different search term.'}
                        </p>
                        {classes.length === 0 && (
                            <button className="btn-create" onClick={handleCreate}>
                                + New Class
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(c => (
                        <div className="class-item" key={c.id}>
                            <Folder
                                color={c.color}
                                size={1.4}
                                onClick={() => navigate(`/classes/${c.id}`)}
                            />
                            <div className="class-info">
                                <span className="class-name">{c.className}</span>
                                <span className="class-meta">{c.deckIds.length} decks</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <EditClassModal
                    classData={editingClass}
                    allDecks={allDecks}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

export default Classes;