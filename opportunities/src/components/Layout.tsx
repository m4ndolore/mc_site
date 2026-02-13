import { Outlet } from "react-router-dom";

const styles = {
  layout: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
  },
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1.5rem",
    height: "3.5rem",
    backgroundColor: "var(--mc-bg-secondary)",
    borderBottom: "1px solid var(--mc-border)",
    backdropFilter: "blur(12px)",
  },
  logo: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--mc-text)",
    textDecoration: "none",
    letterSpacing: "-0.02em",
  },
  logoAccent: {
    color: "var(--mc-accent)",
  },
  pageTitle: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--mc-text-muted)",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },
  main: {
    flex: 1,
    width: "100%",
    maxWidth: "72rem",
    margin: "0 auto",
    padding: "2rem 1.5rem",
  },
  footer: {
    borderTop: "1px solid var(--mc-border)",
    backgroundColor: "var(--mc-bg-secondary)",
    padding: "1.5rem",
  },
  footerInner: {
    maxWidth: "72rem",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
    alignItems: "center",
  },
  footerNav: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap" as const,
    justifyContent: "center",
  },
  footerLink: {
    fontSize: "0.875rem",
    color: "var(--mc-text-muted)",
    textDecoration: "none",
    transition: "color 0.2s ease",
  },
  copyright: {
    fontSize: "0.75rem",
    color: "var(--mc-text-muted)",
  },
} as const;

function Layout(): React.JSX.Element {
  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <a
          href="https://mergecombinator.com"
          style={styles.logo}
          target="_blank"
          rel="noopener noreferrer"
        >
          Merge<span style={styles.logoAccent}>Combinator</span>
        </a>
        <span style={styles.pageTitle}>Opportunities</span>
      </header>

      <main style={styles.main}>
        <Outlet />
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <nav style={styles.footerNav}>
            <a
              href="https://mergecombinator.com/builders.html"
              style={styles.footerLink}
            >
              Builders
            </a>
            <a
              href="https://mergecombinator.com/combine.html"
              style={styles.footerLink}
            >
              Combine
            </a>
            <a
              href="https://mergecombinator.com/knowledge.html"
              style={styles.footerLink}
            >
              Knowledge
            </a>
          </nav>
          <span style={styles.copyright}>
            &copy; {new Date().getFullYear()} Merge Combinator
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
