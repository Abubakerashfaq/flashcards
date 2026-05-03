import { useState } from 'react';
import '../css/EditClassModal.css';

function EditClassModal({ classData, allDecks, onClose, onSave }) {
    const [name, setName] = useState(classData.className);
    const [color, setColor] = useState(classData.color);
    const [deckIds, setDeckIds] = useState(
        (classData.deckIds || []).map(id => parseInt(id))
    );
    const [selectedDeck, setSelectedDeck] = useState('');

    const classDecks = allDecks.filter(d => deckIds.includes(parseInt(d.id)));
    const availableDecks = allDecks.filter(d => !deckIds.includes(parseInt(d.id)));

    const handleAddDeck = () => {
        if (!selectedDeck) return;
        setDeckIds(prev => [...prev, parseInt(selectedDeck)]);
        setSelectedDeck('');
    };

    const handleRemoveDeck = (id) => {
        setDeckIds(prev => prev.filter(d => d !== parseInt(id)));
    };

    const handleSave = () => {
        onSave({ ...classData, className: name, color, deckIds, numDecks: deckIds.length });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                <h2>{classData.id ? 'Edit Class' : 'Create Class'}</h2>

                <div className="modal-divider" />

                <label>Class name</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />

                <label>Accent color</label>
                <div className="color-row">
                    <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                    />
                    <span className="color-value">{color}</span>
                </div>

                <label>Decks in this class</label>
                <div className="decks-list">
                    {classDecks.length === 0 && (
                        <p className="no-decks">No decks added yet</p>
                    )}
                    {classDecks.map(deck => (
                        <div key={deck.id} className="deck-row-item">
                            <div className="deck-dot" style={{ background: deck.color }} />
                            <span className="deck-row-name">{deck.deckName}</span>
                            <span className="deck-row-count">{deck.cards?.length ?? deck.numCards} cards</span>
                            <button className="deck-row-del" onClick={() => handleRemoveDeck(deck.id)}>✕</button>
                        </div>
                    ))}
                </div>

                <label>Add deck to class</label>
                <div className="add-deck-row">
                    <select
                        value={selectedDeck}
                        onChange={e => setSelectedDeck(e.target.value)}
                    >
                        <option value="">Select a deck...</option>
                        {availableDecks.map(d => (
                            <option key={d.id} value={d.id}>{d.deckName}</option>
                        ))}
                    </select>
                    <button className="btn-add-deck" onClick={handleAddDeck}>Add</button>
                </div>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-save" onClick={handleSave}>
                        {classData.id ? 'Save changes' : 'Create class'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditClassModal;