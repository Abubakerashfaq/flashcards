import { useState } from 'react';
import '../css/CardEditor.css';

function CardEditor({ cards, color, onSave, onCancel }) {
    const [editedCards, setEditedCards] = useState(
        cards.map(c => ({ ...c }))
    );
    const [dragIndex, setDragIndex] = useState(null);

    const updateCard = (index, field, value) => {
        setEditedCards(prev => prev.map((c, i) =>
            i === index ? { ...c, [field]: value } : c
        ));
    };

    const deleteCard = (index) => {
        setEditedCards(prev => prev.filter((_, i) => i !== index));
    };

    const addCard = () => {
        setEditedCards(prev => [...prev, {
            id: Date.now(),
            front: '',
            back: ''
        }]);
    };

    const handleDragStart = (index) => setDragIndex(index);

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        const newCards = [...editedCards];
        const dragged = newCards.splice(dragIndex, 1)[0];
        newCards.splice(index, 0, dragged);
        setEditedCards(newCards);
        setDragIndex(index);
    };

    const handleDragEnd = () => setDragIndex(null);

    return (
        <div className="editor-view">
            <div className="editor-header">
                <span className="editor-title">Editing Cards</span>
            </div>

            <div className="cards-list">
                {editedCards.map((card, i) => (
                    <div
                        key={card.id}
                        className={`card-row ${dragIndex === i ? 'dragging' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="drag-handle">
                            <div className="drag-line" />
                            <div className="drag-line" />
                            <div className="drag-line" />
                            <span className="card-num">#{i + 1}</span>
                        </div>
                        <div className="card-fields">
                            <div className="card-field">
                                <span className="field-label">Question</span>
                                <textarea
                                    className="field-input"
                                    rows={2}
                                    value={card.front}
                                    onChange={e => updateCard(i, 'front', e.target.value)}
                                    placeholder="Enter question..."
                                />
                            </div>
                            <div className="card-field">
                                <span className="field-label">Answer</span>
                                <textarea
                                    className="field-input"
                                    rows={2}
                                    value={card.back}
                                    onChange={e => updateCard(i, 'back', e.target.value)}
                                    placeholder="Enter answer..."
                                />
                            </div>
                        </div>
                        <button className="card-del" onClick={() => deleteCard(i)}>✕</button>
                    </div>
                ))}
            </div>

            <div className="editor-footer">
                <button className="btn-add-card" onClick={addCard}>+ Add card</button>
                <div className="editor-actions">
                    <button className="btn-cancel" onClick={onCancel}>Cancel</button>
                    <button
                        className="btn-save"
                        style={{ background: color }}
                        onClick={() => onSave(editedCards)}
                    >
                        Save changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CardEditor;