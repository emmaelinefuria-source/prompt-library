"use client";

import { PromptCard } from "@/data/prompts";

interface PromptCardViewProps {
  card: PromptCard;
  onUsePrompt: (card: PromptCard) => void;
}

export default function PromptCardView({ card, onUsePrompt }: PromptCardViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{card.emoji}</span>
        <div className="flex-1 min-w-0">
          <span className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-1">
            {card.category}
          </span>
          <h3 className="font-bold text-gray-900 text-lg leading-tight">
            {card.title}
          </h3>
        </div>
      </div>
      <p className="text-gray-600 text-sm">{card.description}</p>
      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 font-mono leading-relaxed">
        {card.prompt}
      </div>
      <button
        onClick={() => onUsePrompt(card)}
        className="mt-1 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
      >
        Use This Prompt →
      </button>
    </div>
  );
}
