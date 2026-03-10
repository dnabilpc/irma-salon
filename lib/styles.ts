// lib/styles.ts

export const PUBLIC_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:      #FDF8F3;
    --warm-brown: #6B3A2A;
    --blush:      #E8A89C;
    --gold:       #C9922A;
    --dark:       #2C1A0E;
    --soft-pink:  #F5E6E0;
    --text-light: #8B6A5A;
    --border:     #EDD8CC;
  }

  .btn-primary {
    background: var(--warm-brown);
    color: #fff;
    border: none;
    padding: 14px 32px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
  }
  .btn-primary:hover {
    background: var(--gold);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(107,58,42,0.25);
  }

  .btn-outline {
    background: transparent;
    color: var(--warm-brown);
    border: 1.5px solid var(--warm-brown);
    padding: 13px 32px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
  }
  .btn-outline:hover {
    background: var(--warm-brown);
    color: white;
    transform: translateY(-2px);
  }

  .nav-link {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: var(--dark);
    text-decoration: none;
    letter-spacing: 0.05em;
    transition: color 0.2s;
    cursor: pointer;
    background: none;
    border: none;
    font-weight: 400;
  }
  .nav-link:hover { color: var(--warm-brown); }

  .testimonial-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--border);
    border: none; cursor: pointer; padding: 0;
    transition: all 0.3s;
  }
  .testimonial-dot.active {
    background: var(--warm-brown);
    transform: scale(1.3);
  }

  @keyframes floatUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-hero   { animation: floatUp 0.8s ease forwards; }
  .animate-hero-2 { animation: floatUp 1s ease 0.2s both; }

  @media (max-width: 768px) {
    .hero-grid     { flex-direction: column !important; }
    .services-grid { grid-template-columns: 1fr !important; }
    .stats-row     { flex-wrap: wrap !important; }
    .footer-grid   { flex-direction: column !important; gap: 40px !important; }
    .nav-desktop   { display: none !important; }
    .vto-section   { flex-direction: column !important; }
  }
`;

export const ADMIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Cormorant+Garamond:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #1A0F05; }
  ::-webkit-scrollbar-thumb { background: #3A2010; border-radius: 2px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-anim { animation: fadeUp 0.4s ease forwards; opacity: 0; }

  .admin-stat-card {
    background: #1A0F05;
    border: 1px solid #2A1A0A;
    padding: 24px;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }
  .admin-stat-card:hover {
    border-color: #3A2A1A;
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }

  .table-row {
    display: grid;
    padding: 13px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.15s;
    align-items: center;
    gap: 8px;
  }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: rgba(255,255,255,0.025); }

  .filter-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.4);
    padding: 5px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 2px;
  }
  .filter-btn:hover { border-color: rgba(201,146,42,0.4); color: #C9922A; }
  .filter-btn.active { background: rgba(201,146,42,0.12); border-color: #C9922A; color: #C9922A; }

  .notif-panel {
    position: absolute; top: 52px; right: 0;
    width: 340px; background: #1A0F05;
    border: 1px solid #2A1A0A; border-radius: 4px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7);
    z-index: 200;
    animation: slideDown 0.2s ease;
    max-height: 420px; overflow-y: auto;
  }

  @media (max-width: 900px) {
    .admin-stats-grid { grid-template-columns: 1fr 1fr !important; }
    .admin-main-grid  { grid-template-columns: 1fr !important; }
  }
`;