"use client";

import { useEffect, useState } from "react";
import { PromptCard, COLORS, CATEGORIES, MODELS } from "@/data/prompts";

interface CardDetailProps {
  card: PromptCard;
  starred: boolean;
  onToggleStar: (id: string) => void;
  onBack: () => void;
  onChat: (card: PromptCard) => void;
}

export default function CardDetail({
  card,
  starred,
  onToggleStar,
  onBack,
  onChat,
}: CardDetailProps) {
  const [showToast, setShowToast] = useState(false);

  const color = COLORS[card.cat] || COLORS.research;
  const catLabel = CATEGORIES[card.cat] || card.cat;
  const model = MODELS[card.tool];

  // Auto-copy prompt to clipboard on mount
  useEffect(() => {
    navigator.clipboard.writeText(card.prompt).then(() => {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(t);
    }).catch(() => {
      // clipboard may not be available
    });
  }, [card.prompt]);

  // Highlight [PLACEHOLDER] text
  function renderPrompt(text: string) {
    const parts = text.split(/(\[[A-Z0-9_ /&'+.–—-]+\])/g);
    return parts.map((part, i) => {
      if (/^\[[A-Z0-9_ /&'+.–—-]+\]$/.test(part)) {
        return (
          <span key={i} className="ph" style={{ color: color.hex }}>
            {part}
          </span>
        );
      }
      return part;
    });
  }

  return (
    <>
      {/* Top bar */}
      <div
        className="topbar"
        style={{
          background: "rgba(248,248,245,0.94)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div className="topbar-left">
          <button className="icon-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
        <span className="topbar-title">{card.id}</span>
        <div className="topbar-right">
          <button
            className={`star-btn${starred ? " starred" : ""}`}
            onClick={() => onToggleStar(card.id)}
          >
            {starred ? "★" : "☆"}
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="scroll-body">
        <div className="detail-body">
          {/* Category badge */}
          <div
            className="det-cat-badge"
            style={{
              background: color.bg,
              border: `1px solid ${color.b}`,
              color: color.hex,
            }}
          >
            {catLabel}
          </div>

          {/* Title and tagline */}
          <h1 className="det-title">{card.title}</h1>
          <p className="det-tagline">{card.tagline}</p>

          {/* Meta chips */}
          <div className="det-chips">
            {/* Card ID with color dot */}
            <div className="det-chip">
              <span className="dot" style={{ background: color.hex }} />
              {card.id}
            </div>

            {/* Recommended tool */}
            {model && (
              <div className="det-chip">
                {model.name}
              </div>
            )}

            {/* Difficulty dots */}
            <div className="det-chip" style={{ color: color.hex }}>
              <div className="diff-dots">
                {[1, 2, 3].map((d) => (
                  <span
                    key={d}
                    className={`diff-d${d <= card.level ? " on" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Prompt section */}
          <div className="det-section-label">Prompt</div>
          <div className="det-prompt-box">
            <div className="det-prompt-text">{renderPrompt(card.prompt)}</div>
          </div>

          {/* Copy toast */}
          <div className={`copy-toast${showToast ? " show" : ""}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Prompt copied to clipboard
          </div>
        </div>
      </div>

      {/* Chat button */}
      <div className="chat-btn-wrap">
        <button className="chat-btn" onClick={() => onChat(card)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Chat with AI
        </button>
      </div>
    </>
  );
}
