"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  initialPrompt: string;
  promptTitle: string;
  onBack: () => void;
}

const MODELS = [
  { id: "gemini-flash", name: "Gemini Flash", description: "Fast & smart" },
  { id: "gemini-pro", name: "Gemini Lite", description: "Quick responses" },
];

export default function ChatInterface({
  initialPrompt,
  promptTitle,
  onBack,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "user", content: initialPrompt },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState("gemini-flash");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Send the initial prompt automatically
  useEffect(() => {
    if (hasSentInitial.current) return;
    hasSentInitial.current = true;
    sendToAPI([{ role: "user" as const, content: initialPrompt }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendToAPI(msgs: Message[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, model }),
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

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 font-medium"
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 truncate text-sm">
            {promptTitle}
          </h2>
        </div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="text-sm border rounded-lg px-2 py-1.5 bg-gray-50 text-gray-700"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-white text-gray-800 shadow-sm border rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-3 shrink-0">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your follow-up..."
            className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
