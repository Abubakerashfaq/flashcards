import { useState, useEffect } from 'react';
import './css/App.css';
import Cardeditor from './pages/Cardeditor';
import Classes from './pages/Classes';
import Decklist from './pages/Decklist';
import Dashboard from './pages/Dashboard';
import ClassPage from './pages/ClassPage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import DeckPage from './pages/DeckPage';
import StudySession from './pages/StudySession';
import { apiMe } from './api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [streak, setStreak] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    apiMe()
      .then(data => {
        if (data.logged_in) {
          setIsLoggedIn(true);
          setUsername(data.username || '');
          setEmail(data.email || '');
          setStreak(data.streak_days || 0);
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) return null;

  return (
    <>
      <NavBar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        username={username}
        email={email}
        streak={streak}
      />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Home />}
          />
          <Route path="/home" element={<Home />} />
          <Route path="/decks" element={<Decklist />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:classId" element={<ClassPage />} />
          <Route path="/decks/:deckId" element={<DeckPage />} />
          <Route path="/decks/:deckId/study" element={<StudySession />} />
          <Route path="/dashboard" element={<Dashboard streak={streak} />} />
          <Route path="/cardeditor" element={<Cardeditor />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUsername={setUsername} setEmail={setEmail} />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </main>
    </>
  );
}

export default App;