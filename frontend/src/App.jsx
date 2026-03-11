import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to the Smart Campus Assistant. Ask me any legal questions about the Companies Act or Income Tax Act.", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const newMsg = { id: Date.now(), text: inputValue, sender: "user" };
    setMessages(prev => [...prev, newMsg]);
    setInputValue("");
    
    // Simulate bot response after a delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: "This is a placeholder response. In the future, this will connect to the FastAPI backend to fetch real legal answers.", 
        sender: "bot" 
      }]);
    }, 1000);
  };

  return (
    <div className="chat-container">
      {/* Sidebar - Optional but good for layout structure */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-placeholder"></div>
          <h2>Smart Campus</h2>
        </div>
        <button className="new-chat-btn">
          <span>+</span> New Chat
        </button>
        <div className="history-list">
          <p className="history-title">Recent Chats</p>
          <div className="history-item active">Legal Query - Tax Ex...</div>
          <div className="history-item">Company Formation</div>
        </div>
        <div className="user-profile">
          <div className="avatar">U</div>
          <span>User Management Soon</span>
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
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <form className="input-form" onSubmit={handleSend}>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a legal question..." 
              className="chat-input"
            />
            <button type="submit" className="send-btn" disabled={!inputValue.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <p className="disclaimer">AI can make mistakes. Verify important legal information.</p>
        </div>
      </main>
    </div>
  )
}

export default App
