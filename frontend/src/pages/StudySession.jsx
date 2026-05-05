import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FlashCard from '../components/FlashCard';
import StudySummary from '../components/Summary';
import '../css/StudySessions.css';
import { apiGetDeck, apiGetCards, apiUpdateDeck, apiReviewCard } from '../api';

// placeholder - same as DeckPage
const DEFAULT_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg';

function StudySession() {
    const { deckId } = useParams();
    const navigate = useNavigate();

    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    // study state
    const [current, setCurrent] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [incorrect, setIncorrect] = useState(0);
    const [skipped, setSkipped] = useState(0);
    const [missedCards, setMissedCards] = useState([]);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [deckData, cardData] = await Promise.all([
                    apiGetDeck(deckId),
                    apiGetCards(deckId),
                ]);
                setDeck({
                    id:       deckData.id,
                    deckName: deckData.name,
                    color:    deckData.color || '#378ADD',
                    imgURL: deckData.img_url || DEFAULT_IMG,
                    progress: deckData.progress || 0,
                    tags:     deckData.tags || [],
                });
                setCards(cardData);
            } catch (err) {
                console.error('could not load deck:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [deckId]);

    const handleMark = async (result) => {
        let newCorrect = correct;

        // fire SRS review — don't await, keeps UI snappy
        apiReviewCard(cards[current].id, result).catch(() => {});

        if (result === 'correct') {
            newCorrect = correct + 1;
            setCorrect(newCorrect);
        }
        if (result === 'incorrect') {
            setIncorrect(p => p + 1);
            setMissedCards(p => [...p, cards[current]]);
        }
        if (result === 'skipped') {
            setSkipped(p => p + 1);
            setMissedCards(p => [...p, cards[current]]);
        }

        if (current + 1 >= cards.length) {
            // session finished — compute progress and save
            const total = cards.length;
            const progressPct = Math.round((newCorrect / total) * 100);

            try {
                await apiUpdateDeck(deck.id, {
                    name:        deck.deckName,
                    color:       deck.color,
                    description: '',
                    progress:    progressPct,
                });
                setDeck(prev => ({ ...prev, progress: progressPct }));
            } catch (err) {
                console.error('could not save progress:', err);
            }

            setDone(true);
        } else {
            setCurrent(p => p + 1);
        }
    };

    const handleRetry = () => {
        // retry only the cards the user got wrong or skipped
        setCards(missedCards);
        setCurrent(0);
        setCorrect(0);
        setIncorrect(0);
        setSkipped(0);
        setMissedCards([]);
        setDone(false);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
    if (!deck)   return <div style={{ padding: '2rem' }}>Deck not found</div>;
    if (cards.length === 0) return <div style={{ padding: '2rem' }}>This deck has no cards yet.</div>;

    if (done) {
        return (
            <div
                className="study-page"
                style={{ background: `linear-gradient(to bottom, color-mix(in srgb, ${deck.color} 15%, #ffffff) 0%, #ffffff 40%)` }}
            >
                <StudySummary
                    deck={deck}
                    correct={correct}
                    incorrect={incorrect}
                    skipped={skipped}
                    missedCards={missedCards}
                    onRetry={handleRetry}
                    onExit={() => navigate(`/decks/${deck.id}`)}
                />
            </div>
        );
    }

    return (
        <div
            className="study-page"
            style={{ background: `linear-gradient(to bottom, color-mix(in srgb, ${deck.color} 15%, #ffffff) 0%, #ffffff 40%)` }}
        >
            <div className="study-header">
                <div>
                    <div className="study-title">{deck.deckName}</div>
                    <div className="study-meta">{deck.tags?.join(' · ')} · {cards.length} cards</div>
                </div>
                <button className="exit-btn" onClick={() => navigate(`/decks/${deck.id}`)}>✕ Exit</button>
            </div>

            <div className="progress-row">
                <div className="progress-wrap">
                    <div
                        className="progress-fill"
                        style={{ width: `${(current / cards.length) * 100}%`, background: deck.color }}
                    />
                </div>
                <span className="progress-label">{current + 1} / {cards.length}</span>
            </div>

            <div className="score-row">
                <div className="score-pill">
                    <div className="score-dot correct" />
                    <span>{correct} Correct</span>
                </div>
                <div className="score-pill">
                    <div className="score-dot incorrect" />
                    <span>{incorrect} Incorrect</span>
                </div>
                <div className="score-pill">
                    <div className="score-dot skipped" />
                    <span>{skipped} Skipped</span>
                </div>
            </div>

            <FlashCard
                key={current}
                front={cards[current].front}
                back={cards[current].back}
                color={deck.color}
            />

            <div className="controls">
                <button className="btn-incorrect" onClick={() => handleMark('incorrect')}>✕ Incorrect</button>
                <button className="btn-skip" onClick={() => handleMark('skipped')}>Skip</button>
                <span className="card-counter">{current + 1} / {cards.length}</span>
                <button className="btn-correct" onClick={() => handleMark('correct')}>✓ Correct</button>
            </div>
        </div>
    );
}

export default StudySession;