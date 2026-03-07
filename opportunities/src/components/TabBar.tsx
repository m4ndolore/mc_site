interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function TabBar({ tabs, activeTab, onTabChange }: TabBarProps): React.JSX.Element {
  return (
    <>
      <style>{`
        .ops-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--mc-border);
          margin-bottom: 1.5rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .ops-tabs::-webkit-scrollbar { display: none; }
        .ops-tab {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-primary);
          color: var(--mc-text-muted);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 150ms ease, border-color 150ms ease;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ops-tab:hover {
          color: var(--mc-text);
        }
        .ops-tab--active {
          color: var(--mc-accent);
          border-bottom-color: var(--mc-accent);
        }
        .ops-tab__count {
          font-size: 11px;
          font-weight: 600;
          color: var(--mc-text-muted);
          background: var(--mc-bg-tertiary);
          padding: 1px 6px;
          border-radius: 2px;
          font-variant-numeric: tabular-nums;
        }
        .ops-tab--active .ops-tab__count {
          color: var(--mc-accent);
          background: rgba(59, 130, 246, 0.15);
        }
      `}</style>
      <nav className="ops-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`ops-tab${activeTab === tab.id ? " ops-tab--active" : ""}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ops-tab__count">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>
    </>
  );
}

export default TabBar;
