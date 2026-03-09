"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PromptCard, CATEGORIES, COLORS, MODELS } from "@/data/prompts";
import CardRow from "./CardRow";

interface HistoryEntry {
  cardId: string;
  cardTitle: string;
  model: string;
  prompt: string;
  timestamp: number;
}

interface InsightsData {
  totalSessions: number;
  savedNotes: number;
  thumbsUpPct: number | null;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

interface HomeScreenProps {
  cards: PromptCard[];
  customCards: PromptCard[];
  starredIds: Set<string>;
  onCardClick: (card: PromptCard) => void;
  onToggleStar: (id: string) => void;
  onScan: () => void;
  onSkills: () => void;
}

const FILTER_KEYS = [
  "all", "starred", "canvas",
  "research", "writing", "ideation",
  "analysis", "critique", "synthesis",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

export default function HomeScreen({
  cards,
  customCards,
  starredIds,
  onCardClick,
  onToggleStar,
  onScan,
  onSkills,
}: HomeScreenProps) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);
  const [insights, setInsights] = useState<InsightsData>({ totalSessions: 0, savedNotes: 0, thumbsUpPct: null });

  // Load history and insights from localStorage
  useEffect(() => {
    try {
      const histRaw = localStorage.getItem("ai-canvas-history");
      if (histRaw) {
        const all: HistoryEntry[] = JSON.parse(histRaw);
        setRecentHistory(all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
      }
    } catch {}

    try {
      const histRaw = localStorage.getItem("ai-canvas-history");
      const notesRaw = localStorage.getItem("ai-canvas-notes");
      const fbRaw = localStorage.getItem("ai-canvas-feedback");

      const histArr = histRaw ? JSON.parse(histRaw) : [];
      const notesArr = notesRaw ? JSON.parse(notesRaw) : [];
      const fbArr: { rating: string }[] = fbRaw ? JSON.parse(fbRaw) : [];

      const upCount = fbArr.filter((f) => f.rating === "up").length;
      const totalFb = fbArr.length;

      setInsights({
        totalSessions: histArr.length,
        savedNotes: notesArr.length,
        thumbsUpPct: totalFb > 0 ? Math.round((upCount / totalFb) * 100) : null,
      });
    } catch {}
  }, []);

  const allCards = useMemo(() => [...customCards, ...cards], [cards, customCards]);

  const myPrompts = useMemo(() => {
    const starred = allCards.filter((c) => starredIds.has(c.id));
    const canvasOnly = customCards.filter((c) => !starredIds.has(c.id));
    return [...starred, ...canvasOnly];
  }, [allCards, customCards, starredIds]);

  const filteredCards = useMemo(() => {
    if (selectedCat === "all") return cards;
    if (selectedCat === "starred") return allCards.filter((c) => starredIds.has(c.id));
    if (selectedCat === "canvas") return customCards;
    return cards.filter((c) => c.cat === selectedCat);
  }, [cards, allCards, customCards, starredIds, selectedCat]);

  const sectionLabel = selectedCat === "all" ? "All Cards" : (CATEGORIES[selectedCat] || selectedCat);

  return (
    <>
      <div className="topbar" style={{ background: "transparent" }}>
        <div className="topbar-left" />
        <div className="topbar-right" />
      </div>

      <div className="scroll-body">
        <div className="home-header">
          <div className="home-label">Prompt Library</div>
          <div className="home-title">{getGreeting()}</div>
        </div>

        {/* Scan CTA */}
        <div className="scan-cta" onClick={onScan}>
          <div className="scan-cta-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="3" height="3" rx="0.5" /><rect x="14" y="7" width="3" height="3" rx="0.5" />
              <rect x="7" y="14" width="3" height="3" rx="0.5" /><rect x="14" y="14" width="3" height="3" rx="0.5" />
            </svg>
          </div>
          <div className="scan-cta-text">
            <div className="scan-cta-name">Scan a Card</div>
            <div className="scan-cta-sub">Point at the QR code on any physical prompt card</div>
          </div>
          <div className="scan-cta-arrow">&rsaquo;</div>
        </div>

        {/* Skills CTA */}
        <div className="scan-cta" onClick={onSkills} style={{
          background: "linear-gradient(135deg, #f0eef8 0%, #eef3fe 100%)",
          borderColor: "rgba(124,95,207,0.16)",
        }}>
          <div className="scan-cta-icon" style={{
            background: "rgba(124,95,207,0.14)",
            borderColor: "rgba(124,95,207,0.28)",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c5fcf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </div>
          <div className="scan-cta-text">
            <div className="scan-cta-name">Skills</div>
            <div className="scan-cta-sub">Run AI workflows: research, reports, and chained pipelines</div>
          </div>
          <div className="scan-cta-arrow" style={{ color: "rgba(124,95,207,0.6)" }}>&rsaquo;</div>
        </div>

        {/* Category pills */}
        <div className="cat-row">
          {FILTER_KEYS.map((key) => {
            const label = key === "all" ? "All" : (CATEGORIES[key] || key);
            const color = COLORS[key];
            const isActive = selectedCat === key;
            return (
              <button
                key={key}
                className={`cat-pill${isActive ? " active" : ""}`}
                data-cat={key}
                onClick={() => setSelectedCat(key)}
              >
                {key === "starred" ? (
                  <span>&#11088;</span>
                ) : color ? (
                  <span className="dot" style={{ background: color.hex }} />
                ) : (
                  <span className="dot" style={{ background: "#888" }} />
                )}
                {label}
              </button>
            );
          })}
        </div>

        {/* Insights Card */}
        {(insights.totalSessions > 0 || insights.savedNotes > 0) && (
          <div className="insights-card">
            <div className="insights-title">Insights</div>
            <div className="insights-stats">
              <div className="insights-stat">
                <div className="insights-stat-value">{insights.totalSessions}</div>
                <div className="insights-stat-label">Sessions</div>
              </div>
              <div className="insights-stat">
                <div className="insights-stat-value">{insights.savedNotes}</div>
                <div className="insights-stat-label">Notes</div>
              </div>
              <div className="insights-stat">
                <div className="insights-stat-value">
                  {insights.thumbsUpPct !== null ? `${insights.thumbsUpPct}%` : "—"}
                </div>
                <div className="insights-stat-label">Positive</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentHistory.length > 0 && (
          <div className="recent-activity">
            <div className="recent-activity-head">
              <div className="recent-activity-title">Recent Activity</div>
            </div>
            <div className="recent-activity-list">
              {recentHistory.map((entry, i) => {
                const modelInfo = MODELS[entry.model];
                return (
                  <div
                    key={`${entry.cardId}-${entry.timestamp}-${i}`}
                    className="recent-activity-row"
                    onClick={() => {
                      const found = [...customCards, ...cards].find(
                        (c) => c.id === entry.cardId
                      );
                      if (found) onCardClick(found);
                    }}
                  >
                    <div className="recent-activity-info">
                      <div className="recent-activity-card-title">{entry.cardTitle}</div>
                      <div className="recent-activity-prompt">{entry.prompt}</div>
                    </div>
                    <div className="recent-activity-meta">
                      <span className="recent-activity-model">{modelInfo?.name || entry.model}</span>
                      <span className="recent-activity-time">{formatRelativeTime(entry.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* My Prompts */}
        {myPrompts.length > 0 && (
          <div className="my-section">
            <div className="my-section-head">
              <div className="my-section-title">My Prompts</div>
              <div className="my-section-count">{myPrompts.length} cards</div>
            </div>
            <div className="card-list">
              {myPrompts.map((card, i) => (
                <CardRow
                  key={card.id}
                  card={card}
                  starred={starredIds.has(card.id)}
                  onToggleStar={onToggleStar}
                  onClick={() => onCardClick(card)}
                  animationDelay={i * 18}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Cards */}
        <div className="section-head">
          <div className="section-head-title">{sectionLabel}</div>
          <div className="section-head-count">{filteredCards.length} cards</div>
        </div>
        <div className="card-list">
          {filteredCards.map((card, i) => (
            <CardRow
              key={card.id}
              card={card}
              starred={starredIds.has(card.id)}
              onToggleStar={onToggleStar}
              onClick={() => onCardClick(card)}
              animationDelay={i * 18}
            />
          ))}
        </div>
      </div>
    </>
  );
}
