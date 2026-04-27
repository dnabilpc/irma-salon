// lib/styles.ts — bagian ADMIN_STYLES saja (replace bagian ADMIN_STYLES di file existing)

export const ADMIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #FDF8F3;
    --bg-card:     #FFFFFF;
    --bg-hover:    #FDF0F4;
    --border:      #F0E0E6;
    --border-soft: #F5EBF0;
    --mauve:       #C4788A;
    --mauve-light: rgba(196,120,138,0.1);
    --mauve-mid:   rgba(196,120,138,0.18);
    --gold:        #C9922A;
    --gold-light:  rgba(201,146,42,0.1);
    --dark:        #2C1A0E;
    --text-main:   #3D2314;
    --text-mid:    #7A5C50;
    --text-soft:   #B09080;
    --green:       #5A9E7A;
    --green-light: rgba(90,158,122,0.12);
    --red:         #C05060;
    --red-light:   rgba(192,80,96,0.12);
    --shadow-sm:   0 1px 4px rgba(196,120,138,0.08);
    --shadow-md:   0 4px 16px rgba(196,120,138,0.12);
    --shadow-lg:   0 12px 40px rgba(196,120,138,0.16);
  }

  body {
    background: var(--bg);
    color: var(--text-main);
    font-family: 'DM Sans', sans-serif;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--border-soft); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--mauve); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position: 200% 0; }
  }

  .card-anim { animation: fadeUp 0.35s ease forwards; opacity: 0; }

  .admin-stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .admin-stat-card:hover {
    border-color: var(--mauve);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .table-row {
    display: grid;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-soft);
    transition: background 0.15s;
    align-items: center;
    gap: 8px;
  }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: var(--bg-hover); }

  .filter-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-soft);
    padding: 5px 13px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 20px;
    font-weight: 500;
  }
  .filter-btn:hover { border-color: var(--mauve); color: var(--mauve); background: var(--mauve-light); }
  .filter-btn.active { background: var(--mauve); border-color: var(--mauve); color: white; }

  .notif-panel {
    position: absolute; top: 52px; right: 0;
    width: 340px;
    background: white;
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    z-index: 200;
    animation: slideDown 0.2s ease;
    max-height: 420px;
    overflow-y: auto;
  }

  .admin-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
  }

  @media (max-width: 900px) {
    .admin-stats-grid { grid-template-columns: 1fr 1fr !important; }
    .admin-main-grid  { grid-template-columns: 1fr !important; }
  }
`;

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