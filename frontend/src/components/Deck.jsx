import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import '../css/Deck.css';

function Deck({ id, deckName, numCards, imgURL, progress, color, tags = [], onEdit }) {
  const navigate = useNavigate();

  const handleClick = () => navigate(`/decks/${id}`);

  return (
    <div className="deck-wrapper" style={{ '--deck-color': color }}>
      <div className="deck-back" />
      <div className="deckCard" onClick={handleClick}>
        <img className="card-image" src={imgURL} alt={deckName} />
        <div className="card-overlay" />

        <div className="card-top">
          <button className="card-menu" onClick={(e) => {
            e.stopPropagation();
            onEdit({ id, deckName, numCards, imgURL, progress, color, tags });
          }}>
            &#8943;
          </button>
        </div>

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