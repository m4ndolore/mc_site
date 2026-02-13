import { useState } from "react";
import { Outlet } from "react-router-dom";

function Layout(): React.JSX.Element {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <>
      <style>{`
        /* ── NAV ── */
        .nav {
          position: sticky;
          top: 0;
          height: var(--nav-height);
          z-index: 1000;
          background: var(--black);
          border-bottom: 1px solid transparent;
          transition: background var(--transition-base), border-color var(--transition-base);
        }
        .nav--scrolled {
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .nav__container {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 clamp(16px, 3vw, 40px);
          height: 100%;
          display: flex;
          align-items: center;
          gap: 32px;
        }

        /* Logo */
        .nav__logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: opacity var(--transition-fast);
        }
        .nav__logo:hover { opacity: 0.85; }
        .nav__logo-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1;
        }
        .nav__logo-merge {
          font-family: var(--font-serif);
          font-size: 14px;
          font-weight: 400;
          font-style: italic;
          color: rgba(242, 245, 247, 0.85);
          letter-spacing: 0.02em;
          margin-bottom: -1px;
          margin-left: 1px;
        }
        .nav__logo-combinator {
          font-family: var(--font-primary);
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--offwhite);
          line-height: 1;
        }
        .nav__logo-icon {
          height: 96px;
          width: auto;
          display: block;
          margin-left: 10px;
        }

        /* Menu */
        .nav__menu {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav__menu-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav__menu-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Links */
        .nav__link {
          position: relative;
          color: rgba(242, 245, 247, 0.85);
          font-size: 18px;
          font-weight: 500;
          font-family: var(--font-primary);
          letter-spacing: -0.015em;
          padding: 6px 0;
          transition: color var(--transition-fast);
          background: none;
          border: none;
          cursor: pointer;
        }
        .nav__link::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -6px;
          height: 2px;
          background: var(--blue);
          opacity: 0;
          transform: scaleX(0.5);
          transform-origin: center;
          transition: opacity var(--transition-fast), transform var(--transition-fast);
        }
        .nav__link:hover,
        .nav__link:focus-visible { color: var(--white); }
        .nav__link:hover::after,
        .nav__link:focus-visible::after { opacity: 1; transform: scaleX(1); }
        .nav__link--active { color: var(--white); }
        .nav__link--active::after { opacity: 1; transform: scaleX(1); }

        /* Dropdown */
        .nav__dropdown { position: relative; }
        .nav__dropdown-trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .nav__dropdown-trigger::after { right: 20px; }
        .nav__dropdown-icon { transition: transform var(--transition-fast); }
        .nav__dropdown--open .nav__dropdown-icon { transform: rotate(180deg); }
        .nav__dropdown-menu {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
          min-width: 180px;
          background: rgba(13, 17, 23, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 8px 0;
          opacity: 0;
          visibility: hidden;
          transition: opacity var(--transition-fast), visibility var(--transition-fast), transform var(--transition-fast);
          z-index: 100;
        }
        .nav__dropdown--open .nav__dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .nav__dropdown-item {
          display: block;
          padding: 10px 20px;
          color: rgba(242, 245, 247, 0.85);
          font-size: 15px;
          font-weight: 500;
          font-family: var(--font-primary);
          transition: background var(--transition-fast), color var(--transition-fast);
        }
        .nav__dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--white);
        }

        /* Buttons */
        .nav__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-primary);
          font-size: 14px;
          font-weight: 500;
          border-radius: 2px;
          padding: 10px 18px;
          transition: box-shadow var(--transition-fast), background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
        }
        .nav__btn--secondary {
          background: transparent;
          color: var(--offwhite);
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .nav__btn--secondary:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.4);
          color: var(--white);
        }
        .nav__btn--access {
          background: var(--blue);
          color: var(--white);
          border: 1px solid var(--blue);
        }
        .nav__btn--access:hover {
          background: var(--blue-dark);
          border-color: var(--blue-dark);
        }

        /* ── MAIN ── */
        .site-main {
          flex: 1;
          width: 100%;
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 2rem clamp(16px, 3vw, 40px);
        }

        /* ── FOOTER ── */
        .footer {
          background: var(--black);
          padding: 80px 0 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .footer__container {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 clamp(16px, 3vw, 40px);
        }
        .footer__grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 80px;
          margin-bottom: 60px;
        }
        .footer__brand { max-width: 280px; }
        .footer__logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .footer__logo-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1;
        }
        .footer__logo-merge {
          font-family: var(--font-serif);
          font-size: 12px;
          font-weight: 400;
          font-style: italic;
          color: rgba(242, 245, 247, 0.7);
          letter-spacing: 0.02em;
          margin-bottom: -1px;
        }
        .footer__logo-combinator {
          font-family: var(--font-primary);
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--offwhite);
          line-height: 1;
        }
        .footer__logo-icon {
          height: 26px;
          width: auto;
          display: block;
          margin-left: 4px;
        }
        .footer__tagline {
          color: rgba(255, 255, 255, 0.5);
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .footer__social {
          display: flex;
          gap: 12px;
        }
        .footer__social-link {
          width: 40px;
          height: 40px;
          background: var(--charcoal);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-medium);
          transition: all var(--transition-fast);
        }
        .footer__social-link:hover {
          background: var(--blue);
          color: var(--white);
        }
        .footer__social-link svg {
          width: 18px;
          height: 18px;
        }
        .footer__links {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
        }
        .footer__heading {
          font-size: 14px;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 20px;
        }
        .footer__list li { margin-bottom: 12px; }
        .footer__list a {
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
        }
        .footer__list a:hover { color: var(--white); }
        .footer__bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .footer__copyright,
        .footer__location {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .nav__menu-links { display: none; }
          .nav__menu-actions { display: none; }
          .footer__grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .footer__links {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <header className="nav" id="nav">
        <div className="nav__container">
          <a href="/" className="nav__logo">
            <span className="nav__logo-text">
              <span className="nav__logo-merge">Merge</span>
              <span className="nav__logo-combinator">Combinator</span>
            </span>
            <img
              src="/opportunities/arrows-2.png"
              alt="Merge arrows"
              className="nav__logo-icon"
            />
          </a>

          <nav className="nav__menu" aria-label="Primary navigation">
            <div className="nav__menu-links">
              <a href="/builders" className="nav__link">
                Defense Builders
              </a>
              <a href="/wingman" className="nav__link">
                Wingman
              </a>
              <a href="/guild" className="nav__link">
                Guild
              </a>
              <a
                href="/programs/the-combine"
                className="nav__link"
              >
                The Combine
              </a>
              <div
                className={`nav__dropdown${dropdownOpen ? " nav__dropdown--open" : ""}`}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  className="nav__link nav__dropdown-trigger"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  type="button"
                >
                  Platform
                  <svg
                    className="nav__dropdown-icon"
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="nav__dropdown-menu">
                  <a
                    href="/opportunities"
                    className="nav__dropdown-item nav__link--active"
                  >
                    Opportunities
                  </a>
                  <a
                    href="/status"
                    className="nav__dropdown-item"
                  >
                    Status
                  </a>
                  <a
                    href="/briefs"
                    className="nav__dropdown-item"
                  >
                    Briefs
                  </a>
                  <a
                    href="/knowledge"
                    className="nav__dropdown-item"
                  >
                    Knowledge
                  </a>
                  <a
                    href="https://docs.mergecombinator.com"
                    className="nav__dropdown-item"
                  >
                    Docs
                  </a>
                </div>
              </div>
            </div>
            <div className="nav__menu-actions">
              <a
                href="/auth/login"
                className="nav__btn nav__btn--secondary"
              >
                Sign in
              </a>
              <a
                href="/access"
                className="nav__btn nav__btn--access"
              >
                Join
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer__container">
          <div className="footer__grid">
            <div className="footer__brand">
              <a href="/" className="footer__logo">
                <span className="footer__logo-text">
                  <span className="footer__logo-merge">Merge</span>
                  <span className="footer__logo-combinator">Combinator</span>
                </span>
                <img
                  src="/opportunities/arrows-2.png"
                  alt="Merge arrows"
                  className="footer__logo-icon"
                />
              </a>
              <p className="footer__tagline">
                The builder-led venture studio for national security.
              </p>
              <div className="footer__social">
                <a
                  href="https://www.linkedin.com/company/merge-combinator/"
                  className="footer__social-link"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/FPExtraordinAir"
                  className="footer__social-link"
                  aria-label="X (Twitter)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer__links">
              <div>
                <h4 className="footer__heading">Platform</h4>
                <ul className="footer__list">
                  <li><a href="/builders">Defense Builders</a></li>
                  <li><a href="/wingman">Wingman</a></li>
                  <li><a href="/guild">Guild</a></li>
                  <li><a href="/programs/the-combine">The Combine</a></li>
                  <li><a href="/opportunities">Opportunities</a></li>
                  <li><a href="/briefs">Briefs</a></li>
                </ul>
              </div>
              <div>
                <h4 className="footer__heading">Company</h4>
                <ul className="footer__list">
                  <li><a href="/#hero">About</a></li>
                  <li><a href="/access">Contact</a></li>
                  <li><a href="/builders">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="footer__heading">Resources</h4>
                <ul className="footer__list">
                  <li><a href="/blog">Blog</a></li>
                  <li><a href="/portfolio">Case Studies</a></li>
                  <li><a href="/knowledge">Knowledge</a></li>
                  <li><a href="https://docs.mergecombinator.com">Docs</a></li>
                </ul>
              </div>
              <div>
                <h4 className="footer__heading">Legal</h4>
                <ul className="footer__list">
                  <li><a href="/privacy">Privacy Policy</a></li>
                  <li><a href="/terms">Terms of Service</a></li>
                  <li><a href="/security">Security</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer__bottom">
            <p className="footer__copyright">
              &copy; {new Date().getFullYear()} Merge Combinator. All rights reserved.
            </p>
            <p className="footer__location">Honolulu &bull; Seattle &bull; Las Vegas</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Layout;
