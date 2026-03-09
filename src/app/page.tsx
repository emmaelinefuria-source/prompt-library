"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CARDS, PromptCard } from "@/data/prompts";
import TabBar from "@/components/TabBar";
import HomeScreen from "@/components/HomeScreen";
import LibraryScreen from "@/components/LibraryScreen";
import CardDetail from "@/components/CardDetail";
import ChatScreen from "@/components/ChatScreen";
import ScanScreen from "@/components/ScanScreen";
import CanvasScreen from "@/components/CanvasScreen";
import SkillsRunner from "@/components/SkillsRunner";

type Screen = "home" | "library" | "canvas" | "scan" | "detail" | "chat" | "skills";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [prevScreens, setPrevScreens] = useState<Screen[]>([]);
  const [activeCard, setActiveCard] = useState<PromptCard | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [customCards, setCustomCards] = useState<PromptCard[]>([]);
  const [flash, setFlash] = useState(false);
  const loadedRef = useRef(false);
  const screenRef = useRef<HTMLDivElement>(null);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai-canvas-starred");
      if (saved) setStarredIds(new Set(JSON.parse(saved)));
    } catch {}
    try {
      const saved = localStorage.getItem("ai-canvas-custom");
      if (saved) setCustomCards(JSON.parse(saved));
    } catch {}
    loadedRef.current = true;
  }, []);

  // Persist starred (only after initial load)
  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem("ai-canvas-starred", JSON.stringify([...starredIds]));
    } catch {}
  }, [starredIds]);

  // Persist custom cards (only after initial load)
  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem("ai-canvas-custom", JSON.stringify(customCards));
    } catch {}
  }, [customCards]);

  function goTo(screen: Screen) {
    setPrevScreens((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
  }

  function goBack() {
    setPrevScreens((prev) => {
      const stack = [...prev];
      const last = stack.pop();
      if (last !== undefined) {
        setCurrentScreen(last);
      }
      return stack;
    });
  }

  function switchTab(tab: string) {
    setCurrentScreen(tab as Screen);
    setPrevScreens([]);
  }

  const toggleStar = useCallback((id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function handleCardClick(card: PromptCard) {
    setActiveCard(card);
    goTo("detail");
  }

  const handleCardScanned = useCallback(
    (cardId: string) => {
      const allCards = [...customCards, ...CARDS];
      const card = allCards.find(
        (c) => c.id.toUpperCase() === cardId.toUpperCase()
      );
      if (card) {
        setFlash(true);
        setTimeout(() => setFlash(false), 120);
        setActiveCard(card);
        // Replace scan in the navigation stack
        setPrevScreens((prev) => {
          const stack = [...prev];
          // Remove scan from stack if it's there
          const idx = stack.lastIndexOf("scan");
          if (idx !== -1) stack.splice(idx, 1);
          stack.push("home");
          return stack;
        });
        setCurrentScreen("detail");
      }
    },
    [customCards]
  );

  const [customPrompt, setCustomPrompt] = useState<string | undefined>(undefined);

  function handleChat(card: PromptCard, prompt?: string) {
    setActiveCard(card);
    setCustomPrompt(prompt);
    goTo("chat");
  }

  function handleSaveCanvasCard(card: PromptCard) {
    setCustomCards((prev) => [card, ...prev]);
  }

  const showTabBar = !["scan", "detail", "chat", "skills"].includes(currentScreen);

  function screenClass(id: Screen) {
    return `screen${currentScreen === id ? " active" : ""}`;
  }

  return (
    <>
      <div className={`flash-overlay${flash ? " on" : ""}`} />

      <div className="app" ref={screenRef}>
        {/* HOME */}
        <div className={screenClass("home")} style={{ background: "var(--bg)" }}>
          <HomeScreen
            cards={CARDS}
            customCards={customCards}
            starredIds={starredIds}
            onCardClick={handleCardClick}
            onToggleStar={toggleStar}
            onScan={() => goTo("scan")}
            onSkills={() => goTo("skills")}
          />
        </div>

        {/* LIBRARY */}
        <div className={screenClass("library")} style={{ background: "var(--bg)" }}>
          <LibraryScreen
            cards={CARDS}
            customCards={customCards}
            starredIds={starredIds}
            onCardClick={handleCardClick}
            onToggleStar={toggleStar}
            allCards={[...customCards, ...CARDS]}
          />
        </div>

        {/* CANVAS */}
        <div className={screenClass("canvas")} style={{ background: "var(--bg)" }}>
          <CanvasScreen
            customCards={customCards}
            starredIds={starredIds}
            onCardClick={handleCardClick}
            onToggleStar={toggleStar}
            onSaveCard={handleSaveCanvasCard}
          />
        </div>

        {/* SCAN */}
        <div className={screenClass("scan")} style={{ background: "#000" }}>
          {currentScreen === "scan" && (
            <ScanScreen
              onCardScanned={handleCardScanned}
              onBack={goBack}
              allCards={[...customCards, ...CARDS]}
            />
          )}
        </div>

        {/* DETAIL */}
        <div className={screenClass("detail")} style={{ background: "#f8f8f5" }}>
          {activeCard && currentScreen === "detail" && (
            <CardDetail
              card={activeCard}
              starred={starredIds.has(activeCard.id)}
              onToggleStar={toggleStar}
              onBack={goBack}
              onChat={handleChat}
              onCardClick={handleCardClick}
            />
          )}
        </div>

        {/* CHAT */}
        <div className={screenClass("chat")} style={{ background: "var(--bg)" }}>
          {activeCard && currentScreen === "chat" && (
            <ChatScreen card={activeCard} onBack={goBack} customPrompt={customPrompt} />
          )}
        </div>

        {/* SKILLS */}
        <div className={screenClass("skills")} style={{ background: "var(--bg)" }}>
          {currentScreen === "skills" && (
            <SkillsRunner onBack={goBack} />
          )}
        </div>

        {/* TAB BAR */}
        {showTabBar && (
          <TabBar
            activeTab={currentScreen}
            onTabChange={switchTab}
            onScan={() => goTo("scan")}
          />
        )}
      </div>
    </>
  );
}
