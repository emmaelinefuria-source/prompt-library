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
  "all",
  "starred",
  "canvas",
  "research",
  "writing",
  "ideation",
  "analysis",
  "critique",
  "synthesis",
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

  const allCards = useMemo(() => [...cards, ...customCards], [cards, customCards]);

  const myPrompts = useMemo(() => {
    const starred = allCards.filter((c) => starredIds.has(c.id));
    const customCanvas = customCards.filter((c) => c.cat === "canvas");
    const ids = new Set<string>();
    const result: PromptCard[] = [];
    for (const c of [...starred, ...customCanvas]) {
      if (!ids.has(c.id)) {
        ids.add(c.id);
        result.push(c);
      }
    }
    return result;
  }, [allCards, customCards, starredIds]);

  const filteredCards = useMemo(() => {
    if (selectedCat === "all") return allCards;
    if (selectedCat === "starred") return allCards.filter((c) => starredIds.has(c.id));
    return allCards.filter((c) => c.cat === selectedCat);
  }, [allCards, starredIds, selectedCat]);

  return (
    <div className="home-screen">
      <div className="home-header">
        <div className="home-label">Prompt Library</div>
        <h1 className="home-greeting">{getGreeting()}</h1>
      </div>

      <div className="scan-cta" onClick={onScan}>
        <span className="scan-cta-icon">&#x1F4F7;</span>
        <div className="scan-cta-text">
          <strong>Scan a card</strong>
          <span>Use your camera to scan a prompt card QR code</span>
        </div>
      </div>

      <div className="cat-row">
        {FILTER_KEYS.map((key) => {
          const label =
            key === "all"
              ? "All"
              : CATEGORIES[key] || key.charAt(0).toUpperCase() + key.slice(1);
          const color = COLORS[key];
          const isActive = selectedCat === key;
          return (
            <button
              key={key}
              className={`cat-pill${isActive ? " active" : ""}`}
              onClick={() => setSelectedCat(key)}
            >
              {color && (
                <span
                  className="cat-dot"
                  style={{ backgroundColor: color.hex }}
                />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {myPrompts.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">My Prompts</h2>
          {myPrompts.map((card, i) => (
            <CardRow
              key={card.id}
              card={card}
              starred={starredIds.has(card.id)}
              onToggleStar={onToggleStar}
              onClick={() => onCardClick(card)}
              animationDelay={i * 40}
            />
          ))}
        </section>
      )}

      <section className="home-section">
        <h2 className="home-section-title">All Cards</h2>
        {filteredCards.map((card, i) => (
          <CardRow
            key={card.id}
            card={card}
            starred={starredIds.has(card.id)}
            onToggleStar={onToggleStar}
            onClick={() => onCardClick(card)}
            animationDelay={i * 40}
          />
        ))}
      </section>
    </div>
  );
}
