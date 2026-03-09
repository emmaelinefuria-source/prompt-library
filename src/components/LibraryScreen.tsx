"use client";

import React, { useState, useMemo } from "react";
import { PromptCard, CATEGORIES, COLORS } from "@/data/prompts";
import CardRow from "./CardRow";

interface LibraryScreenProps {
  cards: PromptCard[];
  customCards: PromptCard[];
  starredIds: Set<string>;
  onCardClick: (card: PromptCard) => void;
  onToggleStar: (id: string) => void;
}

const FILTER_KEYS = [
  "all", "starred", "canvas",
  "research", "writing", "ideation",
  "analysis", "critique", "synthesis",
];

export default function LibraryScreen({
  cards,
  customCards,
  starredIds,
  onCardClick,
  onToggleStar,
}: LibraryScreenProps) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");

  const allCards = useMemo(() => [...customCards, ...cards], [cards, customCards]);

  const filteredCards = useMemo(() => {
    let result = allCards;

    if (selectedCat === "starred") {
      result = result.filter((c) => starredIds.has(c.id));
    } else if (selectedCat === "canvas") {
      result = customCards;
    } else if (selectedCat !== "all") {
      result = result.filter((c) => c.cat === selectedCat);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.cat.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allCards, customCards, starredIds, selectedCat, search]);

  return (
    <>
      <div className="topbar" style={{
        paddingBottom: 12,
        background: "rgba(248,248,245,0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        <div className="topbar-left">
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "#1a1a1a" }}>
            Library
          </div>
        </div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 0 }}>
        {/* Search */}
        <div className="search-bar">
          <div className="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {search && (
            <span
              className="search-clear show"
              onClick={() => setSearch("")}
            >
              &#10005;
            </span>
          )}
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
                  <span className="dot" style={{ background: "#444" }} />
                )}
                {label}
              </button>
            );
          })}
        </div>

        {/* Card list */}
        <div className="section-head" style={{ paddingTop: 4 }}>
          <div className="section-head-title">
            {selectedCat === "all" ? "All Cards" : (CATEGORIES[selectedCat] || selectedCat)}
          </div>
          <div className="section-head-count">{filteredCards.length} cards</div>
        </div>
        <div className="card-list">
          {filteredCards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 20px", color: "var(--text-3)", fontSize: 13 }}>
              No prompts found.
            </div>
          ) : (
            filteredCards.map((card, i) => (
              <CardRow
                key={card.id}
                card={card}
                starred={starredIds.has(card.id)}
                onToggleStar={onToggleStar}
                onClick={() => onCardClick(card)}
                animationDelay={i * 18}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
