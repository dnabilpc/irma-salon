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
    .nav-mobile-btn { display: block !important; }
    .vto-section   { flex-direction: column !important; }
    .dashboard-grid { grid-template-columns: 1fr !important; }
    .profile-header { flex-direction: column !important; text-align: center !important; gap: 20px !important; }
    .profile-actions { width: 100% !important; flex-direction: row !important; justify-content: center !important; }
  }
`;

export const ADMIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --sidebar-bg:    #F2D8E4;
    --topbar-bg:     #FAEAF0;
    --content-bg:    #FDF8F5;
    --card-bg:       #FFFFFF;
    --border:        #E8C0D0;
    --border-soft:   #F0D9E0;
    --rose-dark:     #7A2848;
    --rose-mid:      #C4728E;
    --rose-light:    #F9EAF0;
    --rose-muted:    #B06080;
    --gold:          #C9922A;
    --gold-light:    rgba(201,146,42,0.12);
    --green:         #2A8C5A;
    --green-light:   rgba(42,140,90,0.12);
    --red:           #D94060;
    --red-light:     rgba(217,64,96,0.12);
    --purple:        #9B6FD4;
    --text-main:     #3A1A28;
    --text-mid:      #8A4060;
    --text-soft:     #B08090;
    --shadow-sm:     0 1px 4px rgba(196,114,142,0.1);
    --shadow-md:     0 4px 16px rgba(196,114,142,0.15);
  }

  body {
    background: var(--content-bg);
    color: var(--text-main);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--border-soft); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--rose-mid); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-anim { animation: fadeUp 0.35s ease forwards; opacity: 0; }

  /* Stat card */
  .admin-stat-card {
    background: var(--card-bg);
    border: 1px solid var(--border-soft);
    border-radius: 10px;
    padding: 20px;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .admin-stat-card:hover {
    border-color: var(--rose-mid);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  /* Table rows */
  .table-row {
    display: grid;
    padding: 13px 16px;
    border-bottom: 1px solid var(--border-soft);
    transition: background 0.15s;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: var(--rose-light); }

  /* Filter buttons */
  .filter-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-soft);
    padding: 6px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 20px;
    font-weight: 500;
  }
  .filter-btn:hover {
    border-color: var(--rose-mid);
    color: var(--rose-mid);
    background: var(--rose-light);
  }
  .filter-btn.active {
    background: var(--rose-mid);
    border-color: var(--rose-mid);
    color: white;
  }

  /* Notification panel */
  .notif-panel {
    position: absolute;
    top: 52px; right: 0;
    width: 340px;
    background: white;
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-md);
    z-index: 200;
    animation: slideDown 0.2s ease;
    max-height: 420px;
    overflow-y: auto;
  }

  /* Admin card */
  .admin-card {
    background: var(--card-bg);
    border: 1px solid var(--border-soft);
    border-radius: 10px;
    box-shadow: var(--shadow-sm);
  }

  /* Status badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    white-space: nowrap;
    font-family: 'DM Sans', sans-serif;
  }

  /* Action button */
  .btn-action {
    background: var(--rose-light);
    border: 1px solid var(--border);
    color: var(--rose-dark);
    padding: 8px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .btn-action:hover {
    background: var(--rose-mid);
    color: white;
    border-color: var(--rose-mid);
  }

  .btn-action-gold {
    background: var(--gold-light);
    border: 1px solid rgba(201,146,42,0.3);
    color: var(--gold);
    padding: 8px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .btn-action-gold:hover {
    background: var(--gold);
    color: white;
  }

  /* Search input */
  .search-input {
    width: 100%;
    padding: 10px 16px 10px 38px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--text-main);
    background: white;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus { border-color: var(--rose-mid); }
  .search-input::placeholder { color: var(--text-soft); }

  .admin-content-wrapper {
    flex: 1;
    margin-left: 220px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    transition: margin-left 0.3s ease;
  }

  body.sidebar-collapsed .admin-content-wrapper {
    margin-left: 58px;
  }

  .admin-sidebar-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(58, 26, 40, 0.4);
    backdrop-filter: blur(4px);
    z-index: 45;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .table-responsive-container {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 8px;
    margin-top: 15px;
    border: 1px solid var(--border-soft);
    background: white;
  }

  .admin-sidebar {
    transition: transform 0.3s ease, width 0.3s ease !important;
  }

  @media (max-width: 900px) {
    .admin-stats-grid { grid-template-columns: 1fr 1fr !important; }
    .admin-main-grid  { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 768px) {
    .admin-content-wrapper {
      margin-left: 0 !important;
    }
    
    .admin-sidebar {
      transform: translateX(-100%);
      width: 260px !important;
    }

    body.sidebar-open .admin-sidebar {
      transform: translateX(0);
    }

    body.sidebar-open .admin-sidebar-overlay {
      opacity: 1;
      pointer-events: auto;
    }

    .admin-stats-grid { grid-template-columns: 1fr !important; }
    .admin-hamburger-btn { display: block !important; }
    .admin-sidebar-toggle-btn { display: none !important; }
    .admin-topbar-sub, .admin-topbar-date { display: none !important; }
  }
`;