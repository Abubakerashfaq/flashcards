import { useState } from 'react';
import '../css/FlashCard.css';

function FlashCard({ front, back, color }) {
    const [flipped, setFlipped] = useState(false);

    return (
        <div className="flip-container" onClick={() => setFlipped(p => !p)}>
            <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
                <div className="flip-front">
                    <span className="card-side-label">Question</span>
                    <p className="card-text">{front}</p>
                    <span className="card-hint">Click to reveal answer</span>
                </div>
                <div
                    className="flip-back"
                    style={{
                        background: `color-mix(in srgb, ${color} 10%, white)`,
                        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`
                    }}
                >
                    <span className="card-side-label">Answer</span>
                    <p className="card-text">{back}</p>
                </div>
            </div>
        </div>
    );
}

export default FlashCard;