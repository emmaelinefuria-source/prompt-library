"use client";

import { useState, useRef, useEffect } from "react";
import { PromptCard, MODELS } from "@/data/prompts";

interface Message {
  role: "user" | "assistant";
  content: string;
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
}

const MODEL_ORDER = ["gemini", "claude", "chatgpt", "perplexity"];

export default function ChatScreen({ card, onBack }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "user", content: card.prompt },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(card.tool);
  const [modelAvailability, setModelAvailability] = useState<ModelAvailability[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasSentInitial = useRef(false);

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
    sendToAPI([{ role: "user" as const, content: card.prompt }], card.tool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <button className="icon-btn" onClick={onBack}>
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
        <div className="topbar-right" />
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
            className={`chat-bubble ${msg.role}`}
          >
            {msg.content}
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
    </>
  );
}
