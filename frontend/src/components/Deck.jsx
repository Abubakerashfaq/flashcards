import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import '../css/Deck.css';

function Deck({ id, deckName, numCards, imgURL, progress, color, tags = [], dueCount = 0, avgMastery = 0, onEdit }) {
  const navigate = useNavigate();

  const handleClick = () => navigate(`/decks/${id}`);

  return (
    <div className="deck-wrapper" style={{ '--deck-color': color }}>
      <div className="deck-back" />
      <div className="deckCard" onClick={handleClick}>
        <img className="card-image" src={imgURL} alt={deckName} />
        <div className="card-overlay" />

        <div className="card-top">
          {dueCount > 0 && (
            <span style={{
              background: '#ef4444', color: 'white', borderRadius: '12px',
              padding: '2px 8px', fontSize: '11px', fontWeight: '700'
            }}>
              {dueCount} due
            </span>
          )}
          <button className="card-menu" onClick={(e) => {
            e.stopPropagation();
            onEdit({ id, deckName, numCards, imgURL, progress, color, tags });
          }}>
            &#8943;
          </button>
        </div>
        {numCards > 0 && (
          <div style={{
            position: 'absolute', bottom: '48px', right: '12px',
            display: 'flex', gap: '3px'
          }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i <= Math.round(avgMastery) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)'
              }} />
            ))}
          </div>
        )}

        <div className="card-right">
          <h2 className="card-title">{deckName}</h2>
          <span className="card-subtitle">{numCards} cards</span>
        </div>

        <div className="card-left-bottom">
          <div className="card-tags">
            {tags.map((tag, i) => (
              <span className="card-tag" key={i}>{tag}</span>
            ))}
          </div>
          <ProgressBar completed={progress} bgcolor={color} />
          <span className="card-percent">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

export default Deck;