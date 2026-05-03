import { useNavigate } from 'react-router-dom';
import '../css/LastStudy.css';

function LastStudy({ deck }) {
    const navigate = useNavigate();

    if (!deck) return null;

    return (
        <div className="last-study-card glass" onClick={() => navigate(`/decks/${deck.id}`)}>
            <h3>Last Reviewed Deck</h3>
            <div className="last-deck">
                <img
                    src={deck.imgURL}
                    alt={deck.deckName}
                    className="last-deck-img"
                />
                <div className="last-deck-info">
                    <div className="last-deck-name">{deck.deckName}</div>
                    <div className="last-deck-meta">{deck.cards?.length ?? deck.numCards} cards · {deck.progress}% complete</div>
                    <div className="progress-wrap">
                        <div
                            className="progress-fill"
                            style={{ width: `${deck.progress}%`, background: deck.color }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LastStudy;