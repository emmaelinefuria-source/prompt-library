"use client";

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onScan: () => void;
}

export default function TabBar({ activeTab, onTabChange, onScan }: TabBarProps) {
  return (
    <nav className="tab-bar">
      {/* Home */}
      <button
        className={`tab-item${activeTab === "home" ? " active" : ""}`}
        onClick={() => onTabChange("home")}
      >
        <span className="tab-icon">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z" />
          </svg>
        </span>
        <span className="tab-label">Home</span>
      </button>

      {/* Library */}
      <button
        className={`tab-item${activeTab === "library" ? " active" : ""}`}
        onClick={() => onTabChange("library")}
      >
        <span className="tab-icon">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </span>
        <span className="tab-label">Library</span>
      </button>

      {/* Scan — raised center button */}
      <button className="tab-scan" onClick={onScan}>
        <span className="tab-scan-ring">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V4h3" />
            <path d="M20 7V4h-3" />
            <path d="M4 17v3h3" />
            <path d="M20 17v3h-3" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
        </span>
        <span className="tab-label">Scan</span>
      </button>

      {/* Canvas */}
      <button
        className={`tab-item${activeTab === "canvas" ? " active" : ""}`}
        onClick={() => onTabChange("canvas")}
      >
        <span className="tab-icon">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </span>
        <span className="tab-label">Canvas</span>
      </button>
    </nav>
  );
}
