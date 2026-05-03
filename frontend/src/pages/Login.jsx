import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SignUp.css';
import bgImage from '../assets/shark_bg.jpg';
import { apiLogin } from '../api';

// setIsLoggedIn comes from App.jsx so the navbar updates after login
function Login({ setIsLoggedIn, setUsername, setEmail: setParentEmail }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async () => {
    setError('');
    try {
        const data = await apiLogin(email, password);
        setIsLoggedIn(true);
        setUsername(data.username || '');
        setEmail(email);
        navigate('/dashboard');
    } catch (err) {
        setError(err.message);
    }
};

    return (
        <div className="signup-page">
            <div className="signup-left">
                <h2>Welcome Back!</h2>

                {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

                <div className="field">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="field">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="At least 4 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                    />
                </div>

                <button className="btn-signup" onClick={handleSubmit}>
                    Sign In
                </button>

                <p className="login-link">
                    Don't have an account? <a href="/signup">Create an Account</a>
                </p>
            </div>
            <div className="signup-right">
                <img src={bgImage} alt="" className="signup-bg-img" />
            </div>
        </div>
    );
}

export default Login;
