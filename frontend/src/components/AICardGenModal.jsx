import { useState } from 'react';
import { apiGenerateCards } from '../api';

function AICardGenModal({ deckId, onClose, onAddCards }) {
    const [topic, setTopic]     = useState('');
    const [count, setCount]     = useState(5);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError]     = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setError('');
        setPreview(null);
        try {
            const cards = await apiGenerateCards(deckId, topic, count);
            setPreview(cards);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                background: 'white', borderRadius: '16px', padding: '28px',
                width: '480px', maxWidth: '90vw', maxHeight: '80vh',
                display: 'flex', flexDirection: 'column', gap: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>✦ AI Generate Cards</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7a99' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Topic</label>
                    <input
                        type="text"
                        placeholder="e.g. Photosynthesis, World War 2, Python basics..."
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                        style={{
                            padding: '10px 12px', borderRadius: '8px',
                            border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Number of cards: {count}</label>
                    <input
                        type="range" min="3" max="20" value={count}
                        onChange={e => setCount(Number(e.target.value))}
                    />
                </div>

                {error && (
                    <div style={{ color: '#ef4444', fontSize: '13px', background: '#fef2f2', padding: '10px', borderRadius: '8px' }}>
                        {error}
                    </div>
                )}

                {preview && (
                    <div style={{ overflowY: 'auto', maxHeight: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7a99', fontWeight: '600' }}>{preview.length} cards generated — preview:</div>
                        {preview.map((card, i) => (
                            <div key={i} style={{
                                background: '#f9fafb', borderRadius: '8px',
                                padding: '10px 12px', fontSize: '13px',
                            }}>
                                <div style={{ fontWeight: '600', color: '#111827' }}>Q: {card.front}</div>
                                <div style={{ color: '#6b7a99', marginTop: '4px' }}>A: {card.back}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    {!preview ? (
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !topic.trim()}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                background: loading ? '#e5e7eb' : '#6366f1', color: 'white',
                                fontWeight: '600', fontSize: '14px', cursor: loading ? 'default' : 'pointer',
                            }}
                        >
                            {loading ? 'Generating...' : '✦ Generate'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setPreview(null)}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px',
                                    border: '1px solid #e5e7eb', background: 'white',
                                    fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                                }}
                            >
                                Regenerate
                            </button>
                            <button
                                onClick={() => onAddCards(preview)}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                    background: '#22c55e', color: 'white',
                                    fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                                }}
                            >
                                Add {preview.length} cards
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AICardGenModal;
