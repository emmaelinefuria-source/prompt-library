"use client";

import React, { useState, useMemo } from "react";
import { PromptCard, CATEGORIES, COLORS } from "@/data/prompts";
import CardRow from "./CardRow";

interface HomeScreenProps {
  cards: PromptCard[];
  customCards: PromptCard[];
  starredIds: Set<string>;
  onCardClick: (card: PromptCard) => void;
  onToggleStar: (id: string) => void;
  onScan: () => void;
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
}: HomeScreenProps) {
  const [selectedCat, setSelectedCat] = useState("all");

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
