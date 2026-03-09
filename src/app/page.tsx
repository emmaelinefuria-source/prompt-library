"use client";

import { useState, useCallback } from "react";
import { prompts, getPromptById, PromptCard } from "@/data/prompts";
import PromptCardView from "@/components/PromptCardView";
import ChatInterface from "@/components/ChatInterface";
import QRScanner from "@/components/QRScanner";

type View = "library" | "chat";

export default function Home() {
  const [view, setView] = useState<View>("library");
  const [scanning, setScanning] = useState(false);
  const [activePrompt, setActivePrompt] = useState<PromptCard | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [scanMessage, setScanMessage] = useState<string>("");

  const categories = ["All", ...Array.from(new Set(prompts.map((p) => p.category)))];

  const filtered = prompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleScan = useCallback((result: string) => {
    setScanning(false);
    // The QR code contains the prompt ID or a URL with the prompt ID
    let promptId = result;

    // Handle URL format: extract the id parameter or path
    try {
      const url = new URL(result);
      promptId = url.searchParams.get("id") || url.pathname.split("/").pop() || result;
    } catch {
      // Not a URL, treat as plain prompt ID
    }

    const card = getPromptById(promptId);
    if (card) {
      setActivePrompt(card);
      setScanMessage("");
    } else {
      setScanMessage(`Card not found for: "${promptId}". Try scanning again or browse the library.`);
    }
  }, []);

  const handleUsePrompt = (card: PromptCard) => {
    setActivePrompt(card);
    setView("chat");
  };

  if (view === "chat" && activePrompt) {
    return (
      <ChatInterface
        initialPrompt={activePrompt.prompt}
        promptTitle={activePrompt.title}
        onBack={() => setView("library")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Prompt Library</h1>
              <p className="text-sm text-gray-500">
                Discover what AI can do for you
              </p>
            </div>
            <button
              onClick={() => setScanning(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Scan
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3 text-gray-800"
          />

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan message */}
      {scanMessage && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
            {scanMessage}
          </div>
        </div>
      )}

      {/* Scanned card highlight */}
      {activePrompt && view === "library" && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <p className="text-xs font-medium text-indigo-600 mb-2">
              Scanned Card
            </p>
            <PromptCardView card={activePrompt} onUsePrompt={handleUsePrompt} />
          </div>
        </div>
      )}

      {/* Prompt cards grid */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No prompts found. Try a different search.
          </div>
        ) : (
          filtered.map((card) => (
            <PromptCardView
              key={card.id}
              card={card}
              onUsePrompt={handleUsePrompt}
            />
          ))
        )}
      </div>

      {/* QR Scanner overlay */}
      {scanning && (
        <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
      )}
    </div>
  );
}
