import { useState } from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../api';

export default function Nav({ user }: { user: any }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          TECHNODIUM<span className="accent"> 26</span>
          <img src="/static/images/girlscript-logo.png" alt="ASSCET Logo" className="presented-logo" />
        </Link>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <a href="/#timeline" className="magic-hover magic-hover__square" onClick={closeMenu}>Timeline</a>
          <a href="/#winners" className="magic-hover magic-hover__square" onClick={closeMenu}>Prizes</a>
          <a href="/#structure" className="magic-hover magic-hover__square" onClick={closeMenu}>Rounds</a>
          <a href="/#problems" className="magic-hover magic-hover__square" onClick={closeMenu}>Problems</a>
          <a href="/#how" className="magic-hover magic-hover__square" onClick={closeMenu}>Register</a>
          {user ? (
            <div className="nav-user">
              <span className="nav-name">{user.name}</span>
              <Link to="/dashboard" className="nav-cta magic-hover magic-hover__square" onClick={closeMenu}>Dashboard</Link>
              <button onClick={handleLogout} className="nav-logout magic-hover magic-hover__square">Logout</button>
            </div>
          ) : (
            <div className="nav-user">
              <Link to="/login" className="nav-link-login magic-hover magic-hover__square" onClick={closeMenu}>Login</Link>
              <Link to="/signup" className="nav-cta magic-hover magic-hover__square" onClick={closeMenu}>Sign Up</Link>
            </div>
          )}
        </div>
        <button
          className="nav-toggle"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  );
}
