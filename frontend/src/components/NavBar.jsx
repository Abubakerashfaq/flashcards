import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Navbar.css';
import { apiLogout, apiFetch } from '../api';

function NavBar({ isLoggedIn, setIsLoggedIn, username, email }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiLogout();
      setIsLoggedIn(false);
      navigate('/login');
    } catch (err) {
      console.error('logout failed:', err);
    }
  };

  const handleChangePassword = async () => {
    try {
      await apiFetch('/api/change-password', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      setPwMsg('Password changed!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwMsg(err.message);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/home" className="navbar-brand">
        <span className="brand-flash">flash</span>
        <span className="brand-cards">cards</span>
      </Link>

      <div className="navbar-spacer" />

      {isLoggedIn ? (
        <>
          <div className="navbar-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/classes">Classes</Link>
            <Link to="/decks">Decks</Link>
          </div>
          <div className="navbar-right" style={{ position: 'relative' }}>
            <button
              className="admin-btn"
              onClick={() => { setShowProfile(p => !p); setShowPasswordForm(false); setPwMsg(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2c5282" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </button>

            {showProfile && (
              <div style={{
                position: 'absolute', top: '36px', right: 0,
                background: 'white', borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                padding: '16px', minWidth: '220px', zIndex: 1000,
                display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{username}</div>
                <div style={{ fontSize: '12px', color: '#6b7a99', marginTop: '-6px' }}>{email}</div>

                <div style={{ height: '1px', background: '#e5e7eb' }} />

                {!showPasswordForm ? (
                  <button onClick={() => setShowPasswordForm(true)} style={{
                    background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px',
                    padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                    color: '#378ADD', textAlign: 'left'
                  }}>
                    Change password
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="password"
                      placeholder="Current password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    {pwMsg && <div style={{ fontSize: '11px', color: pwMsg === 'Password changed!' ? 'green' : 'red' }}>{pwMsg}</div>}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setShowPasswordForm(false)} style={{
                        flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid #e5e7eb',
                        background: 'white', cursor: 'pointer', fontSize: '12px'
                      }}>Cancel</button>
                      <button onClick={handleChangePassword} style={{
                        flex: 1, padding: '7px', borderRadius: '8px', border: 'none',
                        background: '#378ADD', color: 'white', cursor: 'pointer', fontSize: '12px'
                      }}>Save</button>
                    </div>
                  </div>
                )}

                <div style={{ height: '1px', background: '#e5e7eb' }} />

                <button onClick={handleLogout} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '13px', color: '#ef4444', textAlign: 'left', padding: '0'
                }}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="navbar-links">
            <Link to="/login">Login</Link>
          </div>
          <div className="navbar-right">
            <Link to="/signup" className="btn-get-started">Get started</Link>
          </div>
        </>
      )}
    </nav>
  );
}

export default NavBar;