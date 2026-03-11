import { useState, useRef, useEffect } from 'react'
import { api } from './utils/api'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

function getInitials(username = '') {
  return username.charAt(0).toUpperCase();
}

// ──────────────────────────────────────────────
//  App
// ──────────────────────────────────────────────

function App() {
  // Auth state
  const [user, setUser]       = useState(null);    // null = not logged in
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [authLoading, setAuthLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome! Ask me any legal questions about the Companies Act or Income Tax Act.", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError]     = useState('');

  const messagesEndRef = useRef(null);

  // On mount: check if a valid token already exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setAuthLoading(false); return; }

    api.me()
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auth handlers ──
  const handleLogin = (u) => setUser(u);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setMessages([
      { id: 1, text: "Welcome! Ask me any legal questions about the Companies Act or Income Tax Act.", sender: "bot" }
    ]);
  };

  // ── Chat handler ──
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || chatLoading) return;

    const query = inputValue.trim();
    setInputValue('');
    setChatError('');

    // Optimistically add user message
    const userMsg = { id: Date.now(), text: query, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    // Add a placeholder typing indicator
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, text: '...', sender: 'bot', typing: true }]);

    try {
      const data = await api.chat(query);

      // Build the answer with source citations
      let fullAnswer = data.answer;
      if (data.sources && data.sources.length > 0) {
        const citations = data.sources
          .map((s, i) => `[${i + 1}] ${s.metadata.display_source} – page ${s.metadata.page}`)
          .join('\n');
        fullAnswer += `\n\n📚 Sources:\n${citations}`;
      }

      // Replace typing indicator with real answer
      setMessages(prev => prev.map(m =>
        m.id === typingId ? { id: typingId, text: fullAnswer, sender: 'bot' } : m
      ));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      setChatError(err.message || 'Failed to get a response. Is the backend running?');
    } finally {
      setChatLoading(false);
    }
  };

  // ──────────────────────────────────────────
  //  Render: loading splash
  // ──────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="status-indicator" style={{ margin: '0 auto 1rem', width: 14, height: 14 }} />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────
  //  Render: auth pages
  // ──────────────────────────────────────────
  if (!user) {
    if (authView === 'register') {
      return <Register onGoLogin={() => setAuthView('login')} />;
    }
    return <Login onLogin={handleLogin} onGoRegister={() => setAuthView('register')} />;
  }

  // ──────────────────────────────────────────
  //  Render: chat
  // ──────────────────────────────────────────
  return (
    <div className="chat-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-placeholder"></div>
          <h2>Smart Campus</h2>
        </div>

        <button className="new-chat-btn" onClick={() => setMessages([
          { id: 1, text: "Welcome! Ask me any legal questions about the Companies Act or Income Tax Act.", sender: "bot" }
        ])}>
          <span>+</span> New Chat
        </button>

        <div className="history-list">
          <p className="history-title">Session</p>
          {messages.filter(m => m.sender === 'user').slice(0, 5).map(m => (
            <div key={m.id} className="history-item">
              {m.text.length > 30 ? m.text.substring(0, 30) + '…' : m.text}
            </div>
          ))}
        </div>

        <div className="user-profile">
          <div className="avatar">{getInitials(user.username)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              padding: '4px', borderRadius: '6px', transition: 'color 0.2s', flexShrink: 0
            }}
            onMouseEnter={e => e.target.style.color = '#f87171'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
          <h2>Legal Assistant RAG</h2>
          <span className="status-indicator"></span>
        </header>

        <div className="messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
              <div className="message-bubble">
                {msg.sender === 'bot' && (
                  <div className="bot-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v2h1a4 4 0 0 1 4 4v5a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-5a4 4 0 0 1 4-4h1V8h-1a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4z" />
                    </svg>
                  </div>
                )}
                <div className="message-content">
                  {msg.typing ? (
                    <div className="typing-indicator">
                      <span /><span /><span />
                    </div>
                  ) : (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {chatError && (
            <div style={{ textAlign: 'center', color: '#f87171', fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
              ⚠️ {chatError}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <form className="input-form" onSubmit={handleSend}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a legal question…"
              className="chat-input"
              disabled={chatLoading}
            />
            <button type="submit" className="send-btn" disabled={!inputValue.trim() || chatLoading}>
              {chatLoading ? (
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </form>
          <p className="disclaimer">AI can make mistakes. Verify important legal information.</p>
        </div>
      </main>
    </div>
  );
}

export default App
