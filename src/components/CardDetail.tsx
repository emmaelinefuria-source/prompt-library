"use client";

import { useEffect, useState, useMemo } from "react";
import { PromptCard, COLORS, CATEGORIES, MODELS, CARDS } from "@/data/prompts";

interface Collection {
  id: string;
  name: string;
  cardIds: string[];
  created: string;
}

const COLLECTIONS_KEY = "ai-canvas-collections";

interface CardDetailProps {
  card: PromptCard;
  starred: boolean;
  onToggleStar: (id: string) => void;
  onBack: () => void;
  onChat: (card: PromptCard, customPrompt?: string) => void;
  onCardClick?: (card: PromptCard) => void;
}

export default function CardDetail({
  card,
  starred,
  onToggleStar,
  onBack,
  onChat,
  onCardClick,
}: CardDetailProps) {
  const [showToast, setShowToast] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [collectionToast, setCollectionToast] = useState("");

  // Load collections
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLECTIONS_KEY);
      if (raw) setCollections(JSON.parse(raw));
    } catch {}
  }, []);

  function handleAddToCollection(colId: string) {
    try {
      const raw = localStorage.getItem(COLLECTIONS_KEY);
      const cols: Collection[] = raw ? JSON.parse(raw) : [];
      const col = cols.find((c) => c.id === colId);
      if (!col) return;

      if (col.cardIds.includes(card.id)) {
        // Remove from collection
        col.cardIds = col.cardIds.filter((id) => id !== card.id);
        setCollectionToast(`Removed from "${col.name}"`);
      } else {
        // Add to collection
        col.cardIds.push(card.id);
        setCollectionToast(`Added to "${col.name}"`);
      }

      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
      setCollections(cols);
      setShowCollectionPicker(false);
      setTimeout(() => setCollectionToast(""), 2000);
    } catch {}
  }

  const color = COLORS[card.cat] || COLORS.research;
  const catLabel = CATEGORIES[card.cat] || card.cat;
  const model = MODELS[card.tool];

  // Extract unique placeholders from the prompt
  const placeholders = useMemo(() => {
    const matches = card.prompt.match(/\[([^\]]+)\]/g);
    if (!matches) return [];
    const unique = [...new Set(matches.map((m) => m.slice(1, -1)))];
    return unique;
  }, [card.prompt]);

  // Reset placeholder values when card changes
  useEffect(() => {
    setPlaceholderValues({});
  }, [card.id]);

  // Build the customized prompt by replacing placeholders with user values
  const customizedPrompt = useMemo(() => {
    let result = card.prompt;
    for (const ph of placeholders) {
      const value = placeholderValues[ph];
      if (value && value.trim()) {
        // Replace all occurrences of this placeholder
        result = result.split(`[${ph}]`).join(value.trim());
      }
    }
    return result;
  }, [card.prompt, placeholders, placeholderValues]);

  const hasAnyValues = Object.values(placeholderValues).some((v) => v && v.trim());

  // Related prompts: same category or same tool, excluding current card
  const relatedCards = useMemo(() => {
    const candidates = CARDS.filter(
      (c) => c.id !== card.id && (c.cat === card.cat || c.tool === card.tool)
    );
    // Prioritize same category, then same tool
    const sameCat = candidates.filter((c) => c.cat === card.cat);
    const sameTool = candidates.filter((c) => c.tool === card.tool && c.cat !== card.cat);
    const combined = [...sameCat, ...sameTool];
    // Deduplicate and take up to 4
    const seen = new Set<string>();
    const result: PromptCard[] = [];
    for (const c of combined) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        result.push(c);
      }
      if (result.length >= 4) break;
    }
    return result;
  }, [card.id, card.cat, card.tool]);

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
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (/^\[.+\]$/.test(part)) {
        return (
          <span key={i} className="ph" style={{ color: color.hex }}>
            {part}
          </span>
        );
      }
      return part;
    });
  }

  // Render the live preview with filled-in values highlighted
  function renderPreview(text: string) {
    // Split on placeholders that were replaced (by checking which values exist)
    // We rebuild by splitting on filled values and remaining placeholders
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (/^\[.+\]$/.test(part)) {
        // Still an unfilled placeholder
        return (
          <span key={i} className="ph" style={{ color: color.hex }}>
            {part}
          </span>
        );
      }
      return part;
    });
  }

  function handlePlaceholderChange(name: string, value: string) {
    setPlaceholderValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleChatClick() {
    if (hasAnyValues) {
      onChat(card, customizedPrompt);
    } else {
      onChat(card);
    }
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
            {starred ? "\u2605" : "\u2606"}
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="scroll-body" style={{ paddingBottom: 120 }}>
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

          {/* Add to Collection */}
          <div style={{ marginBottom: 18 }}>
            <button
              className="collection-toggle-btn"
              onClick={() => setShowCollectionPicker(!showCollectionPicker)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              Add to Collection
            </button>

            {showCollectionPicker && (
              <div className="collection-picker">
                {collections.length === 0 ? (
                  <div style={{ padding: "12px 0", color: "var(--text-3)", fontSize: 12 }}>
                    No collections yet. Create one in the Library tab.
                  </div>
                ) : (
                  collections.map((col) => {
                    const isInCollection = col.cardIds.includes(card.id);
                    return (
                      <button
                        key={col.id}
                        className={`collection-picker-item${isInCollection ? " in-collection" : ""}`}
                        onClick={() => handleAddToCollection(col.id)}
                      >
                        <span>{col.name}</span>
                        <span style={{ fontSize: 11, color: isInCollection ? "#10a37f" : "rgba(0,0,0,0.3)" }}>
                          {isInCollection ? "Remove" : "Add"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {collectionToast && (
              <div className="collection-toast">{collectionToast}</div>
            )}
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

          {/* Placeholder editor fields */}
          {placeholders.length > 0 && (
            <div className="ph-editor">
              <div className="det-section-label">Customize Placeholders</div>
              <div className="ph-fields">
                {placeholders.map((ph) => (
                  <div key={ph} className="ph-field">
                    <label className="ph-field-label">{ph}</label>
                    <input
                      type="text"
                      className="ph-field-input"
                      placeholder={`Enter ${ph.toLowerCase()}...`}
                      value={placeholderValues[ph] || ""}
                      onChange={(e) => handlePlaceholderChange(ph, e.target.value)}
                      style={{ borderColor: placeholderValues[ph]?.trim() ? color.hex : undefined }}
                    />
                  </div>
                ))}
              </div>

              {/* Live preview */}
              {hasAnyValues && (
                <div className="ph-preview">
                  <div className="det-section-label">Live Preview</div>
                  <div className="det-prompt-box">
                    <div className="det-prompt-text">{renderPreview(customizedPrompt)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Related Prompts */}
          {relatedCards.length > 0 && (
            <div className="related-prompts">
              <div className="det-section-label" style={{ marginTop: 20 }}>Related Prompts</div>
              <div className="related-prompts-scroll">
                {relatedCards.map((rc) => {
                  const rcColor = COLORS[rc.cat] || COLORS.research;
                  const rcCatLabel = CATEGORIES[rc.cat] || rc.cat;
                  return (
                    <div
                      key={rc.id}
                      className="related-prompt-card"
                      onClick={() => onCardClick?.(rc)}
                    >
                      <div className="related-prompt-title">{rc.title}</div>
                      <div
                        className="related-prompt-badge"
                        style={{
                          background: rcColor.bg,
                          border: `1px solid ${rcColor.b}`,
                          color: rcColor.hex,
                        }}
                      >
                        {rcCatLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat button */}
      <div className="chat-btn-wrap">
        <button className="chat-btn" onClick={handleChatClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {hasAnyValues ? "Chat with Customized Prompt" : "Chat with AI"}
        </button>
      </div>
    </>
  );
}
