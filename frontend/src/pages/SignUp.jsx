import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SignUp.css';
import bgImage from '../assets/cloud_background.jpg';
import { apiRegister } from '../api';

function SignUp() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        try {
            await apiRegister(username, email, password);
            setSuccess('Account created! Redirecting to login...');
            // wait a bit so the user can see the success message
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-left">
                <h2>Create Account</h2>

                {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
                {success && <p style={{ color: 'green', marginBottom: '1rem' }}>{success}</p>}

                <div className="field">
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="smartshark"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="field">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="ss1453@mynsu.nova.edu"
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
                    Create Account
                </button>

                <p className="login-link">
                    Already have an account? <a href="/login">Log in</a>
                </p>
            </div>
            <div className="signup-right">
                <img src={bgImage} alt="" className="signup-bg-img" />
            </div>
        </div>
    );
}

export default SignUp;
