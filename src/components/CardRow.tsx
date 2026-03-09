"use client";

import React from "react";
import { PromptCard, COLORS } from "@/data/prompts";

interface CardRowProps {
  card: PromptCard;
  starred: boolean;
  onToggleStar: (id: string) => void;
  onClick: () => void;
  animationDelay?: number;
  style?: React.CSSProperties;
}

export default function CardRow({
  card,
  starred,
  onToggleStar,
  onClick,
  animationDelay,
  style,
}: CardRowProps) {
  const color = COLORS[card.cat] || COLORS.research;

  return (
    <div
      className="card-row"
      onClick={onClick}
      style={{ ...(animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : {}), ...style }}
    >
      <div className="card-row-bar" style={{ backgroundColor: color.hex }} />
      <div className="card-row-body">
        <div className="card-row-meta">
          <span className="card-row-cat" style={{ color: color.hex }}>
            {card.cat.charAt(0).toUpperCase() + card.cat.slice(1)}
          </span>
          <span className="card-row-id">{card.id}</span>
        </div>
        <div className="card-row-title">{card.title}</div>
        <div className="card-row-sub">{card.tagline}</div>
      </div>
      <div className="card-row-right">
        <button
          className={`star-btn${starred ? " starred" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(card.id);
          }}
          aria-label={starred ? "Unstar" : "Star"}
        >
          {starred ? "\u2605" : "\u2606"}
        </button>
        <span className="card-row-chev">&rsaquo;</span>
      </div>
    </div>
  );
}
