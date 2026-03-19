import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-logo-block">
            <Link to="/" className="nav-logo">TECHNODIUM</Link>
            <p>Presented by ASSCET club</p>
          </div>
          <div className="footer-contact">
            <span className="footer-contact-title">Contact Us</span>
            <a href="mailto:contact@asscet.club">contact@asscet.club</a>
            <a href="tel:+919561236804">+91 67676 67676</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Technodium. All rights reserved.</span>
          <div className="footer-credits">
            <a href="/#details-footer" className="footer-meta-link">Info</a>
            <span className="footer-meta-divider" aria-hidden="true">/</span>
            <a href="https://github.com/Aazhs/" target="_blank" rel="noreferrer" className="footer-signature">Website Built by Aarsh</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
