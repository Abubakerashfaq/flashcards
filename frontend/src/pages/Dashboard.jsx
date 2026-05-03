import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import LastStudy from '../components/LastStudy';
import Lessons from '../components/Lessons';
import '../css/Dashboard.css';
import { apiGetDecks, apiGetClasses } from '../api';

const DEFAULT_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg';

function Dashboard() {
    const navigate = useNavigate();
    const [decks, setDecks] = useState([]);
    const [classes, setClasses] = useState([]);
    const [lessons, setLessons] = useState([]);

    const activityDots = Array.from({ length: 63 }, () => {
        const r = Math.random();
        return r > 0.8 ? 'high' : r > 0.5 ? 'mid' : r > 0.3 ? 'low' : '';
    });

    useEffect(() => {
        apiGetDecks().then(data => setDecks(data)).catch(() => {});
        apiGetClasses().then(data => setClasses(data)).catch(() => {});
    }, []);

    // build lesson list from classes for display
    useEffect(() => {
        if (classes.length > 0) {
            setLessons(classes.map((c, i) => ({
                id: c.id,
                name: c.className,
                time: '',
                done: i === 0,
            })));
        }
    }, [classes]);

    const lastDeck = decks.length > 0 ? {
        id: decks[0].id,
        deckName: decks[0].name,
        imgURL: decks[0].img_url || DEFAULT_IMG,
        numCards: decks[0].card_count,
        progress: 0,
        color: decks[0].color,
        cards: [],
    } : null;

    return (
        <div className="dashboard-page">
            <div className="dashboard-left">
                <h1 className="dashboard-title">YOUR<br />DASHBOARD</h1>
                <div className="quick-links">
                    <div className="quick-card glass" onClick={() => navigate('/decks')}>
                        <span className="card-count">{decks.length}</span>
                        Decks
                    </div>
                    <div className="quick-card glass" onClick={() => navigate('/classes')}>
                        <span className="card-count">{classes.length}</span>
                        Classes
                    </div>
                </div>
                <LastStudy deck={lastDeck} />
                <div className="activity-card glass">
                    <h3>Activity Levels</h3>
                    <div className="activity-grid">
                        {activityDots.map((level, i) => (
                            <div key={i} className={`activity-dot ${level}`} />
                        ))}
                    </div>
                </div>
            </div>

            <div></div>

            <div className="dashboard-right">
                <div className="calendar-card glass">
                    <Calendar />
                </div>
                <Lessons lessons={lessons} />
            </div>
        </div>
    );
}

export default Dashboard;