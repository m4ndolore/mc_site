import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

type NavLinkItem = { href: string; label: string };
type FooterColumn = { heading: string; links: NavLinkItem[] };
type FooterConfig = { footerColumns: FooterColumn[] };

const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Platform",
    links: [
      { href: "/builders", label: "Defense Builders" },
      { href: "/wingman", label: "Wingman" },
      { href: "/guild", label: "Guild" },
      { href: "/programs/the-combine", label: "The Combine" },
      { href: "/opportunities", label: "Opportunities" },
      { href: "/briefs", label: "Briefs" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/#hero", label: "About" },
      { href: "/access", label: "Contact" },
      { href: "/builders", label: "Careers" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/portfolio", label: "Case Studies" },
      { href: "/knowledge", label: "Knowledge" },
      { href: "/learn", label: "Learn" },
      { href: "https://docs.mergecombinator.com", label: "Docs" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/security", label: "Security" },
    ],
  },
];

function Layout(): React.JSX.Element {
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>(DEFAULT_FOOTER_COLUMNS);

  useEffect(() => {
    let isMounted = true;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/data/navigation.json", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as Partial<FooterConfig>;
        if (!isMounted) return;
        if (Array.isArray(data.footerColumns)) {
          setFooterColumns(data.footerColumns);
        }
      } catch {
        // Keep fallback footer config when fetch fails.
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <style>{`
        .site-main {
          flex: 1;
          width: 100%;
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 2rem clamp(16px, 3vw, 40px);
        }
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
        .footer__logo-img {
          height: 36px;
          width: auto;
          display: block;
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
        @media (max-width: 1024px) {
          .footer__grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .footer__links {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer__container">
          <div className="footer__grid">
            <div className="footer__brand">
              <a href="/" className="footer__logo">
                <img
                  src="/assets/logowhite2.png"
                  alt="Merge Combinator"
                  className="footer__logo-img"
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
              {footerColumns.map((column) => (
                <div key={column.heading}>
                  <h4 className="footer__heading">{column.heading}</h4>
                  <ul className="footer__list">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href}>{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
