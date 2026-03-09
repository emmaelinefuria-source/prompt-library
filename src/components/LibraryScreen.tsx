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

export default function LibraryScreen({
  cards,
  customCards,
  starredIds,
  onCardClick,
  onToggleStar,
}: LibraryScreenProps) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");

  const allCards = useMemo(() => [...cards, ...customCards], [cards, customCards]);

  const filteredCards = useMemo(() => {
    let result = allCards;

    if (selectedCat === "starred") {
      result = result.filter((c) => starredIds.has(c.id));
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
  }, [allCards, starredIds, selectedCat, search]);

  return (
    <div className="library-screen">
      <h1 className="library-title">Library</h1>

      <div className="search-bar">
        <span className="search-icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className="search-input"
          placeholder="Search prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="search-clear"
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
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

      <div className="library-list">
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
        {filteredCards.length === 0 && (
          <div className="library-empty">No prompts found.</div>
        )}
      </div>
    </div>
  );
}
