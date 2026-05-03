import '../css/CardGrid.css';

function CardGrid({ cards, color, onAddCard }) {
    return (
        <div className="cards-section">
            <div className="section-header">
                <span className="section-title">Cards</span>
                <button
                    className="btn-add-card"
                    style={{ background: color }}
                    onClick={onAddCard}
                >
                    + Add Card
                </button>
            </div>
            <div
                className="tinted-backdrop"
                style={{ background: `color-mix(in srgb, ${color} 8%, transparent)` }}
            >
                <div className="cards-grid">
                    {cards.length === 0 ? (
                        <div className="no-cards">No cards yet — add one or generate from a PDF!</div>
                    ) : (
                        cards.map((card, i) => (
                            <div key={card.id} className="flash-card">
                                <span className="card-number">#{i + 1}</span>
                                <span className="flash-card-label">Question</span>
                                <span className="flash-card-text">{card.front}</span>
                                <div
                                    className="flash-card-divider"
                                    style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
                                />
                                <span className="flash-card-answer">{card.back}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default CardGrid;