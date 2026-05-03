import '../css/Summary.css';

function StudySummary({ deck, correct, incorrect, skipped, missedCards, onRetry, onExit }) {
    const total = correct + incorrect + skipped;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const getMessage = () => {
        if (score >= 80) return "Great job!";
        if (score >= 50) return "Keep it up!";
        return "Keep studying!";
    };

    return (
        <div className="summary-card">
            <div className="summary-banner">
                <img src={deck.imgURL} alt={deck.deckName} className="summary-img" />
                <div className="summary-banner-overlay">
                    <div className="summary-score">{score}%</div>
                    <div className="summary-message">{getMessage()}</div>
                </div>
            </div>

            <div className="summary-title">Session Complete</div>
            <div className="summary-subtitle">{deck.deckName} · {total} cards reviewed</div>

            <div className="summary-stats">
                <div className="stat-box correct">
                    <span className="stat-number correct">{correct}</span>
                    <span className="stat-label">Correct</span>
                </div>
                <div className="stat-box incorrect">
                    <span className="stat-number incorrect">{incorrect}</span>
                    <span className="stat-label">Incorrect</span>
                </div>
                <div className="stat-box skipped">
                    <span className="stat-number skipped">{skipped}</span>
                    <span className="stat-label">Skipped</span>
                </div>
            </div>

            {missedCards.length > 0 && (
                <>
                    <div className="summary-divider" />
                    <div className="missed-list">
                        <span className="missed-label">Missed cards</span>
                        {missedCards.map((card, i) => (
                            <div key={i} className="missed-card">
                                <div className="missed-question">{card.front}</div>
                                <div className="missed-answer">{card.back}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="summary-actions">
                {missedCards.length > 0 && (
                    <button className="btn-retry" onClick={onRetry}>↺ Retry missed</button>
                )}
                <button className="btn-exit" onClick={onExit}>Back to deck</button>
            </div>
        </div>
    );
}

export default StudySummary;