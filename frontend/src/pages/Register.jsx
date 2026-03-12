import { useState } from 'react';
import { api } from '../utils/api';
import './Auth.css';

function Register({ onGoLogin }) {
  const [form, setForm]       = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.register(form.username, form.email, form.password);
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => onGoLogin(), 1500);
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
          <h1>Create Account</h1>
          <p>Join RegBot — Your Compliance Assistant</p>
        </div>

        {error   && <div className="auth-error">{error}</div>}
        {success && (
          <div className="auth-error" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' }}>
            {success}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-username">Username</label>
            <input id="reg-username" name="username" type="text" className="form-input"
              placeholder="Choose a username" value={form.username} onChange={handleChange} required autoFocus />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" name="email" type="email" className="form-input"
              placeholder="your@email.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" name="password" type="password" className="form-input"
              placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input id="reg-confirm" name="confirm" type="password" className="form-input"
              placeholder="Repeat your password" value={form.confirm} onChange={handleChange} required />
          </div>

          <button type="submit" className="auth-submit-btn"
            disabled={loading || !form.username || !form.email || !form.password || !form.confirm}>
            {loading && <span className="btn-spinner" />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onGoLogin(); }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
