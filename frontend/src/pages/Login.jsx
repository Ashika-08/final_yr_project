import { useState } from 'react';
import { api } from '../utils/api';
import './Auth.css';

function Login({ onLogin, onGoRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(username, password);
      localStorage.setItem('token', data.access_token);
      // Fetch user info and pass up
      const user = await api.me();
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v2h1a4 4 0 0 1 4 4v5a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-5a4 4 0 0 1 4-4h1V8h-1a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4z" />
            </svg>
          </div>
          <h1>RegBot</h1>
          <p>Sign in to access your Compliance Assistant</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !username.trim() || !password.trim()}
          >
            {loading && <span className="btn-spinner" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onGoRegister(); }}>
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
