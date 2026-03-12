import './Auditors.css';

const auditors = [
  {
    id: 1,
    name: 'Priya Sharma',
    firm: 'Sharma & Associates',
    specialization: 'Corporate Compliance & Companies Act',
    experience: '12 years',
    location: 'Mumbai, Maharashtra',
    email: 'priya.sharma@sharmaassoc.in',
    phone: '+91 98201 34567',
    rating: 4.9,
    avatar: 'PS',
  },
  {
    id: 2,
    name: 'Arjun Mehta',
    firm: 'Mehta Tax Consultants',
    specialization: 'Income Tax & GST Advisory',
    experience: '9 years',
    location: 'Bengaluru, Karnataka',
    email: 'arjun@mehtatax.co.in',
    phone: '+91 98456 78901',
    rating: 4.7,
    avatar: 'AM',
  },
  {
    id: 3,
    name: 'Sneha Iyer',
    firm: 'Iyer Legal & Audit LLP',
    specialization: 'Startup Regulatory & SEBI Compliance',
    experience: '7 years',
    location: 'Chennai, Tamil Nadu',
    email: 'sneha.iyer@iyerlegal.in',
    phone: '+91 94433 21098',
    rating: 4.8,
    avatar: 'SI',
  },
  {
    id: 4,
    name: 'Rajesh Kapoor',
    firm: 'Kapoor & Co. Chartered Accountants',
    specialization: 'Statutory Audit & Financial Reporting',
    experience: '15 years',
    location: 'Delhi, NCR',
    email: 'rkapoor@kapoorca.com',
    phone: '+91 98118 56432',
    rating: 4.9,
    avatar: 'RK',
  },
  {
    id: 5,
    name: 'Divya Nair',
    firm: 'Nair Compliance Solutions',
    specialization: 'FEMA, RBI & Foreign Investment',
    experience: '11 years',
    location: 'Kochi, Kerala',
    email: 'divya@naircompliance.in',
    phone: '+91 93471 23456',
    rating: 4.6,
    avatar: 'DN',
  },
  {
    id: 6,
    name: 'Vikram Sinha',
    firm: 'Sinha & Partners Audit Firm',
    specialization: 'Labour Law & PF/ESI Compliance',
    experience: '8 years',
    location: 'Kolkata, West Bengal',
    email: 'vikram.sinha@sinhapartners.in',
    phone: '+91 99030 87654',
    rating: 4.7,
    avatar: 'VS',
  },
];

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="star-rating">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i} className="star full">★</span>;
        if (i === full && half) return <span key={i} className="star half">★</span>;
        return <span key={i} className="star empty">☆</span>;
      })}
      <span className="rating-value">{rating}</span>
    </div>
  );
}

export default function Auditors({ onBack }) {
  return (
    <div className="auditors-page">
      <header className="auditors-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Chat
        </button>
        <div className="auditors-header-text">
          <h1>Find an Auditor</h1>
          <p>Connect with certified compliance experts for personalised support</p>
        </div>
      </header>

      <div className="auditors-grid">
        {auditors.map((a) => (
          <div className="auditor-card" key={a.id}>
            <div className="auditor-card-top">
              <div className="auditor-avatar">{a.avatar}</div>
              <div className="auditor-info">
                <h3>{a.name}</h3>
                <span className="firm-name">{a.firm}</span>
                <StarRating rating={a.rating} />
              </div>
            </div>

            <div className="auditor-badge">{a.specialization}</div>

            <div className="auditor-meta">
              <div className="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {a.experience} experience
              </div>
              <div className="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {a.location}
              </div>
            </div>

            <div className="auditor-contacts">
              <a href={`mailto:${a.email}`} className="contact-chip email">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {a.email}
              </a>
              <a href={`tel:${a.phone}`} className="contact-chip phone">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.57 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.74a16 16 0 0 0 6.35 6.35l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {a.phone}
              </a>
            </div>

            <button className="contact-btn">Request Consultation</button>
          </div>
        ))}
      </div>
    </div>
  );
}
