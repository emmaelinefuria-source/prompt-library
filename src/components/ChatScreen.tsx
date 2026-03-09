"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PromptCard, MODELS } from "@/data/prompts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SavedNote {
  content: string;
  cardId: string;
  cardTitle: string;
  model: string;
  timestamp: number;
}

interface Feedback {
  cardId: string;
  cardTitle: string;
  model: string;
  rating: "up" | "down";
  comment: string;
  timestamp: number;
}

interface ModelAvailability {
  id: string;
  name: string;
  desc: string;
  available: boolean;
}

interface ChatScreenProps {
  card: PromptCard;
  onBack: () => void;
  customPrompt?: string;
}

const MODEL_ORDER = ["gemini", "claude", "chatgpt", "perplexity"];

const NOTES_KEY = "ai-canvas-notes";
const FEEDBACK_KEY = "ai-canvas-feedback";

export default function ChatScreen({ card, onBack, customPrompt }: ChatScreenProps) {
  const initialPrompt = customPrompt || card.prompt;
  const [messages, setMessages] = useState<Message[]>([
    { role: "user", content: initialPrompt },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(card.tool);
  const [modelAvailability, setModelAvailability] = useState<ModelAvailability[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasSentInitial = useRef(false);

  // Feature 1: Session Notes
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());

  // Feature 2: Export toast
  const [showExportToast, setShowExportToast] = useState(false);

  // Feature 3: Feedback overlay
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<"up" | "down" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, loading]);

  // Fetch model availability
  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        if (data.models) setModelAvailability(data.models);
      })
      .catch(() => {});
  }, []);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send the initial prompt automatically on mount
  useEffect(() => {
    if (hasSentInitial.current) return;
    hasSentInitial.current = true;
    sendToAPI([{ role: "user" as const, content: initialPrompt }], card.tool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved note indexes for this card on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      if (raw) {
        const notes: SavedNote[] = JSON.parse(raw);
        const indexes = new Set<number>();
        messages.forEach((msg, i) => {
          if (
            msg.role === "assistant" &&
            notes.some(
              (n) => n.content === msg.content && n.cardId === card.id
            )
          ) {
            indexes.add(i);
          }
        });
        setSavedIndexes(indexes);
      }
    } catch {
      // ignore
    }
  }, [messages, card.id]);

  async function sendToAPI(msgs: Message[], model?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, model: model || selectedModel }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }
    setLoading(false);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    await sendToAPI(newMessages);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Check if a model is available
  function isAvailable(modelId: string): boolean {
    const m = modelAvailability.find((x) => x.id === modelId);
    return m ? m.available : false;
  }

  // Feature 1: Save note
  function handleSaveNote(msgIndex: number) {
    const msg = messages[msgIndex];
    if (!msg || msg.role !== "assistant") return;

    try {
      const raw = localStorage.getItem(NOTES_KEY);
      const notes: SavedNote[] = raw ? JSON.parse(raw) : [];

      const alreadySaved = notes.some(
        (n) => n.content === msg.content && n.cardId === card.id
      );

      if (alreadySaved) {
        // Unsave: remove the note
        const filtered = notes.filter(
          (n) => !(n.content === msg.content && n.cardId === card.id)
        );
        localStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
        setSavedIndexes((prev) => {
          const next = new Set(prev);
          next.delete(msgIndex);
          return next;
        });
      } else {
        // Save the note
        const note: SavedNote = {
          content: msg.content,
          cardId: card.id,
          cardTitle: card.title,
          model: selectedModel,
          timestamp: Date.now(),
        };
        notes.push(note);
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
        setSavedIndexes((prev) => new Set(prev).add(msgIndex));
      }
    } catch {
      // ignore storage errors
    }
  }

  // Feature 2: Export chat to clipboard
  const handleExport = useCallback(async () => {
    const modelName = MODELS[selectedModel]?.name || selectedModel;
    let text = `${card.title}\nModel: ${modelName}\n${"—".repeat(40)}\n\n`;

    messages.forEach((msg) => {
      const label = msg.role === "user" ? "You" : "Assistant";
      text += `[${label}]\n${msg.content}\n\n`;
    });

    try {
      await navigator.clipboard.writeText(text.trim());
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text.trim();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 2200);
  }, [messages, selectedModel, card.title]);

  // Feature 3: Handle back with feedback
  function handleBack() {
    if (messages.some((m) => m.role === "assistant")) {
      setShowFeedback(true);
    } else {
      onBack();
    }
  }

  function handleFeedbackSave() {
    if (!feedbackRating) return;

    try {
      const raw = localStorage.getItem(FEEDBACK_KEY);
      const feedbacks: Feedback[] = raw ? JSON.parse(raw) : [];
      feedbacks.push({
        cardId: card.id,
        cardTitle: card.title,
        model: selectedModel,
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        timestamp: Date.now(),
      });
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks));
    } catch {
      // ignore
    }

    setShowFeedback(false);
    onBack();
  }

  function handleFeedbackSkip() {
    setShowFeedback(false);
    onBack();
  }

  const currentModelName = MODELS[selectedModel]?.name || selectedModel;

  return (
    <>
      {/* Top bar */}
      <div
        className="topbar"
        style={{
          background: "rgba(248,248,245,0.94)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div className="topbar-left">
          <button className="icon-btn" onClick={handleBack}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
        <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
          <span
            className="topbar-title"
            style={{
              display: "block",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {card.title}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>
            {currentModelName}
          </span>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" onClick={handleExport} title="Copy conversation to clipboard">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Export toast */}
      <div className={`export-toast${showExportToast ? " show" : ""}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Conversation copied to clipboard
      </div>

      {/* Model picker */}
      <div className="model-picker">
        {MODEL_ORDER.map((id) => {
          const info = MODELS[id];
          if (!info) return null;
          const available = isAvailable(id);
          const isSelected = selectedModel === id;
          const isRecommended = card.tool === id;

          return (
            <button
              key={id}
              className={`model-pill${isSelected ? " selected" : ""}${!available ? " unavailable" : ""}`}
              onClick={() => {
                if (available && !loading) setSelectedModel(id);
              }}
              disabled={loading || !available}
            >
              {info.name}
              {isRecommended && <span className="model-rec">★</span>}
            </button>
          );
        })}
      </div>

      {/* Messages area */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble-wrap ${msg.role}`}
          >
            <div className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>
            {msg.role === "assistant" && (
              <button
                className={`note-save-btn${savedIndexes.has(i) ? " saved" : ""}`}
                onClick={() => handleSaveNote(i)}
                title={savedIndexes.has(i) ? "Remove from notes" : "Save to notes"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={savedIndexes.has(i) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="chat-bubble assistant">
            <div className="typing-dots">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>

      {/* Feature 3: Feedback overlay */}
      {showFeedback && (
        <div className="feedback-overlay">
          <div className="feedback-card">
            <h3 className="feedback-title">How was this response?</h3>
            <div className="feedback-thumbs">
              <button
                className={`feedback-thumb${feedbackRating === "up" ? " active-up" : ""}`}
                onClick={() => setFeedbackRating("up")}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill={feedbackRating === "up" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </button>
              <button
                className={`feedback-thumb${feedbackRating === "down" ? " active-down" : ""}`}
                onClick={() => setFeedbackRating("down")}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill={feedbackRating === "down" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                </svg>
              </button>
            </div>
            <textarea
              className="feedback-input"
              placeholder="What worked / What to improve?"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              rows={3}
            />
            <div className="feedback-actions">
              <button className="feedback-skip" onClick={handleFeedbackSkip}>
                Skip
              </button>
              <button
                className="feedback-save"
                onClick={handleFeedbackSave}
                disabled={!feedbackRating}
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
