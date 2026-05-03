import { useState } from 'react';
import '../css/EditDeckModal.css';
import Deck from './Deck';

function EditDeckModal({ deck, onClose, onSave }) {
  const [name, setName] = useState(deck.deckName);
  const [imgUrl, setImgUrl] = useState(deck.imgURL || '');
  const [previewUrl, setPreviewUrl] = useState(deck.imgURL || '');
  const [imgError, setImgError] = useState(false);
  const [color, setColor] = useState(deck.color || '#378ADD');
  const [tags, setTags] = useState(deck.tags || []);
  const [tagInput, setTagInput] = useState('');

  const handleLoad = () => {
    setImgError(false);
    setPreviewUrl(imgUrl);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags(prev => [...prev, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAddTag();
  };

  const handleSave = () => {
    onSave({ ...deck, deckName: name, imgURL: previewUrl, color, tags });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>{deck.id ? 'Edit Deck' : 'Create Deck'}</h2>

        <label>Deck name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Cover image URL</label>
        <div className="img-url-row">
          <input
            type="text"
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <button className="btn-load" onClick={handleLoad}>Load</button>
        </div>

        {previewUrl ? (
          <img
            src={previewUrl}
            className="img-preview"
            onError={() => setImgError(true)}
            alt="preview"
          />
        ) : (
          <div className="img-placeholder">Image preview</div>
        )}

        {imgError && <p className="img-error">Could not load image — check the URL.</p>}

        <label>Tags</label>
        <div className="tags-input-row">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a tag..."
          />
          <button className="btn-add-tag" onClick={handleAddTag}>Add</button>
        </div>

        <div className="tags-list">
          {tags.map((tag, i) => (
            <span className="tag-pill" key={i}>
              {tag}
              <button className="tag-remove" onClick={() => handleRemoveTag(tag)}>✕</button>
            </span>
          ))}
          {tags.length === 0 && <span style={{ fontSize: '12px', color: Deck.color }}>No tags yet</span>}
        </div>

        <label>Accent color</label>
        <div className="color-row">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <span className="color-value">{deck.color}</span>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>
            {deck.id ? 'Save changes' : 'Create deck'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditDeckModal;