"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { PromptCard, CATEGORIES, COLORS } from "@/data/prompts";
import CardRow from "./CardRow";

interface Collection {
  id: string;
  name: string;
  cardIds: string[];
  created: string;
}

const COLLECTIONS_KEY = "ai-canvas-collections";

interface LibraryScreenProps {
  cards: PromptCard[];
  customCards: PromptCard[];
  starredIds: Set<string>;
  onCardClick: (card: PromptCard) => void;
  onToggleStar: (id: string) => void;
  allCards: PromptCard[];
}

const FILTER_KEYS = [
  "all", "starred", "canvas",
  "research", "analysis", "ideation",
  "critique", "synthesis", "writing", "collins",
];

export default function LibraryScreen({
  cards,
  customCards,
  starredIds,
  onCardClick,
  onToggleStar,
  allCards: allCardsProp,
}: LibraryScreenProps) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);

  // Load collections
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLECTIONS_KEY);
      if (raw) setCollections(JSON.parse(raw));
    } catch {}
  }, []);

  // Save collections
  const saveCollections = useCallback((cols: Collection[]) => {
    setCollections(cols);
    try {
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
    } catch {}
  }, []);

  function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    const col: Collection = {
      id: `col-${Date.now()}`,
      name: newCollectionName.trim(),
      cardIds: [],
      created: new Date().toISOString(),
    };
    saveCollections([col, ...collections]);
    setNewCollectionName("");
    setShowNewCollection(false);
  }

  function handleDeleteCollection(colId: string) {
    saveCollections(collections.filter((c) => c.id !== colId));
    if (expandedCollection === colId) setExpandedCollection(null);
  }

  function getCollectionCards(col: Collection): PromptCard[] {
    return col.cardIds
      .map((id) => allCardsProp.find((c) => c.id === id))
      .filter((c): c is PromptCard => c !== undefined);
  }

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

        {/* Collections */}
        <div className="collections-section">
          <div className="section-head" style={{ paddingTop: 4 }}>
            <div className="section-head-title">Collections</div>
            <button
              className="collection-add-btn"
              onClick={() => setShowNewCollection(!showNewCollection)}
            >
              {showNewCollection ? "Cancel" : "+ New"}
            </button>
          </div>

          {showNewCollection && (
            <div className="collection-new-form">
              <input
                type="text"
                className="collection-name-input"
                placeholder="Collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCollection();
                }}
                autoFocus
              />
              <button
                className="collection-create-btn"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                Create
              </button>
            </div>
          )}

          {collections.length === 0 && !showNewCollection ? (
            <div style={{ textAlign: "center", padding: "12px 20px 20px", color: "var(--text-3)", fontSize: 12 }}>
              No collections yet. Create one to organize your cards.
            </div>
          ) : (
            <div className="collection-list">
              {collections.map((col) => {
                const colCards = getCollectionCards(col);
                const isExpanded = expandedCollection === col.id;
                return (
                  <div key={col.id} className={`collection-card${isExpanded ? " expanded" : ""}`}>
                    <div
                      className="collection-card-header"
                      onClick={() => setExpandedCollection(isExpanded ? null : col.id)}
                    >
                      <div className="collection-card-info">
                        <div className="collection-card-name">{col.name}</div>
                        <div className="collection-card-count">{colCards.length} cards</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          className="collection-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(col.id);
                          }}
                        >
                          &#10005;
                        </button>
                        <div className={`digital-section-chevron${isExpanded ? " open" : ""}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="collection-card-body">
                        {colCards.length === 0 ? (
                          <div style={{ padding: "12px 0", color: "var(--text-3)", fontSize: 12 }}>
                            No cards in this collection yet. Add cards from any card detail view.
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {colCards.map((card, i) => (
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
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
