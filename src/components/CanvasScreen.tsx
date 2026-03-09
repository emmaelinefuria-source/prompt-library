"use client";

import { useState, useRef, useMemo } from "react";
import { PromptCard, CATEGORIES } from "@/data/prompts";
import CardRow from "./CardRow";

interface CanvasScreenProps {
  customCards: PromptCard[];
  starredIds: Set<string>;
  onCardClick: (card: PromptCard) => void;
  onToggleStar: (id: string) => void;
  onSaveCard: (card: PromptCard) => void;
}

const CANVAS_SECTIONS = [
  { key: "persona", label: "Persona", color: "#4285f4", question: "Who should the AI be for this task?", prefix: "You are" },
  { key: "task", label: "Task", color: "#10a37f", question: "What is it being asked to do?", prefix: "Task:" },
  { key: "context", label: "Context", color: "#c4885a", question: "What does it need to know?", prefix: "Context:" },
  { key: "output", label: "Output", color: "#7c5fcf", question: "What should the response look like?", prefix: "Output:" },
  { key: "audience", label: "Audience", color: "#e86e1a", question: "Who is this for?", prefix: "Audience:" },
  { key: "steps", label: "Step-by-Step", color: "#d4357a", question: "What process should it follow?", prefix: "Step-by-Step:" },
  { key: "references", label: "References", color: "#f9c74f", question: "What sources or examples to consider?", prefix: "References:" },
  { key: "tonality", label: "Tonality", color: "#4285f4", question: "What tone and style?", prefix: "Tonality:" },
] as const;

type SectionKey = typeof CANVAS_SECTIONS[number]["key"];

const CATEGORY_OPTIONS = Object.entries(CATEGORIES).filter(
  ([k]) => k !== "starred"
);

export default function CanvasScreen({
  customCards,
  starredIds,
  onCardClick,
  onToggleStar,
  onSaveCard,
}: CanvasScreenProps) {
  // Mode: "scan" or "digital"
  const [mode, setMode] = useState<"scan" | "digital">("scan");

  // --- Scan mode state (existing) ---
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [pendingCard, setPendingCard] = useState<PromptCard | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Digital mode state ---
  const [sections, setSections] = useState<Record<SectionKey, string>>({
    persona: "",
    task: "",
    context: "",
    output: "",
    audience: "",
    steps: "",
    references: "",
    tonality: "",
  });
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["persona"])
  );
  const [digitalTitle, setDigitalTitle] = useState("");
  const [digitalCategory, setDigitalCategory] = useState("canvas");

  // Assemble prompt from filled sections
  const assembledPrompt = useMemo(() => {
    const parts: string[] = [];
    for (const sec of CANVAS_SECTIONS) {
      const val = sections[sec.key].trim();
      if (val) {
        if (sec.key === "persona") {
          parts.push(`You are ${val}.`);
        } else {
          parts.push(`${sec.prefix} ${val}`);
        }
      }
    }
    return parts.join("\n\n");
  }, [sections]);

  const filledCount = useMemo(
    () => CANVAS_SECTIONS.filter((s) => sections[s.key].trim()).length,
    [sections]
  );

  function toggleSection(key: SectionKey) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function updateSection(key: SectionKey, value: string) {
    setSections((prev) => ({ ...prev, [key]: value }));
  }

  function generateDigitalCard() {
    if (!assembledPrompt.trim()) return;
    const card: PromptCard = {
      id: "DC" + Date.now().toString().slice(-5),
      cat: digitalCategory,
      title: digitalTitle.trim() || "Digital Canvas Prompt",
      tool: "claude",
      level: 1,
      tagline: sections.task.trim().slice(0, 80) || "Built with Digital Canvas",
      prompt: assembledPrompt,
      custom: true,
      sections: { ...sections },
      created: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
    onSaveCard(card);
    // Reset
    setSections({
      persona: "",
      task: "",
      context: "",
      output: "",
      audience: "",
      steps: "",
      references: "",
      tonality: "",
    });
    setDigitalTitle("");
    setDigitalCategory("canvas");
    setExpandedSections(new Set(["persona"]));
  }

  // --- Scan mode handlers (existing) ---
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setUploading(true);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function analyseCanvas() {
    if (!preview) return;
    setProcessing(true);
    setProcessingMsg("Reading your handwriting...");
    setError("");

    try {
      const b64 = preview.split(",")[1];
      const res = await fetch("/api/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyse canvas");
      }

      const card = await res.json();
      card.id = "CV" + Date.now().toString().slice(-5);
      card.cat = "canvas";
      card.custom = true;
      card.created = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      setPendingCard(card);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setProcessing(false);
    }
  }

  function saveCard() {
    if (!pendingCard) return;
    onSaveCard(pendingCard);
    setPendingCard(null);
    setPreview(null);
    setUploading(false);
  }

  function discard() {
    setPendingCard(null);
    setPreview(null);
    setUploading(false);
  }

  return (
    <>
      {/* Processing overlay */}
      {processing && (
        <div className="processing-overlay show">
          <div className="processing-spinner" />
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>
            {processingMsg}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(0,0,0,0.45)",
              textAlign: "center",
              maxWidth: 240,
              lineHeight: 1.5,
            }}
          >
            AI is analysing each section of the canvas and assembling your prompt card
          </div>
        </div>
      )}

      <div className="topbar">
        <div className="topbar-left">
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              paddingLeft: 4,
            }}
          >
            Canvas
          </div>
        </div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 0 }}>
        {/* Mode toggle tabs */}
        <div className="canvas-mode-tabs">
          <button
            className={`canvas-mode-tab${mode === "scan" ? " active" : ""}`}
            onClick={() => setMode("scan")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Scan Canvas
          </button>
          <button
            className={`canvas-mode-tab${mode === "digital" ? " active" : ""}`}
            onClick={() => setMode("digital")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Build Digitally
          </button>
        </div>

        {/* ===================== SCAN MODE ===================== */}
        {mode === "scan" && (
          <>
            <div style={{ padding: "16px 20px 0" }}>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                Print and fill in the A3 Prompt Canvas poster by hand. Upload a photo here — AI reads
                your handwriting and turns it into a reusable prompt card.
              </div>
            </div>

            {/* Pending result */}
            {pendingCard && (
              <div style={{ padding: "0 20px 16px" }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color: "#10a37f",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  &#10022; Review & save
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(16,163,127,0.25)",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 12,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 10px",
                      borderRadius: 100,
                      marginBottom: 10,
                      background: "rgba(16,163,127,0.1)",
                      border: "1px solid rgba(16,163,127,0.2)",
                      color: "#10a37f",
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    &#10022; Canvas Generated
                  </div>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      marginBottom: 6,
                      color: "#1a1a1a",
                    }}
                  >
                    {pendingCard.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(0,0,0,0.45)",
                      lineHeight: 1.7,
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical" as const,
                      overflow: "hidden",
                    }}
                  >
                    {pendingCard.prompt}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={saveCard}
                    style={{
                      flex: 1,
                      padding: 13,
                      borderRadius: 13,
                      border: "none",
                      background: "linear-gradient(135deg,#10a37f,#0c8a6a)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    Save to Library
                  </button>
                  <button
                    onClick={discard}
                    style={{
                      padding: "13px 16px",
                      borderRadius: 13,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-2)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Upload area */}
            {!pendingCard && (
              <div style={{ padding: "0 20px" }}>
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFile}
                />

                {!uploading ? (
                  <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 18,
                        background: "rgba(66,133,244,0.1)",
                        border: "1px solid rgba(66,133,244,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                      }}
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4285f4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                      Tap to choose photo
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                      Take a new photo or pick one from your library.
                      <br />
                      Make sure your filled-in poster is fully visible.
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-3)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        marginBottom: 10,
                      }}
                    >
                      YOUR PHOTO
                    </div>
                    <div
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview || ""}
                        alt="Canvas preview"
                        style={{
                          width: "100%",
                          display: "block",
                          maxHeight: 340,
                          objectFit: "contain",
                          background: "#000",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={analyseCanvas}
                        disabled={processing}
                        style={{
                          flex: 1,
                          padding: 15,
                          borderRadius: 14,
                          border: "none",
                          background: "linear-gradient(135deg,#4285f4,#10a37f)",
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        Read Handwriting & Build Card
                      </button>
                      <button
                        onClick={() => fileRef.current?.click()}
                        style={{
                          padding: "15px 16px",
                          borderRadius: 14,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          color: "var(--text-2)",
                          fontSize: 13,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      background: "rgba(249,115,22,0.08)",
                      border: "1px solid rgba(249,115,22,0.25)",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 12,
                      fontSize: 12,
                      color: "#f97316",
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* How it works */}
            <div
              style={{
                padding: "0 20px 6px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-3)",
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
              }}
            >
              How it works
            </div>
            <div className="canvas-steps">
              {[
                {
                  n: "1",
                  bg: "rgba(66,133,244,0.12)",
                  c: "#4285f4",
                  t: "Print & Fill",
                  s: "Print the A3 Prompt Canvas poster and write in each section by hand",
                },
                {
                  n: "2",
                  bg: "rgba(16,163,127,0.12)",
                  c: "#10a37f",
                  t: "Upload Photo",
                  s: "Tap above, take a photo of your poster or pick from your library",
                },
                {
                  n: "3",
                  bg: "rgba(212,165,116,0.12)",
                  c: "#d4a574",
                  t: "AI Builds Your Prompt",
                  s: "Gemini reads your handwriting and assembles all sections into a structured prompt",
                },
                {
                  n: "4",
                  bg: "rgba(167,139,250,0.12)",
                  c: "#a78bfa",
                  t: "Save to Library",
                  s: "Review the generated card and save it — it appears in your Library under Canvas",
                },
              ].map((step) => (
                <div className="canvas-step" key={step.n}>
                  <div
                    className="canvas-step-num"
                    style={{ background: step.bg, color: step.c }}
                  >
                    {step.n}
                  </div>
                  <div>
                    <div className="canvas-step-title">{step.t}</div>
                    <div className="canvas-step-sub">{step.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===================== DIGITAL MODE ===================== */}
        {mode === "digital" && (
          <div style={{ padding: "16px 20px 0" }}>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-2)",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Fill in the 8 canvas sections below to build a structured AI prompt. Expand each section, type your input, and preview the assembled prompt at the bottom.
            </div>

            {/* Progress indicator */}
            <div className="digital-progress">
              <div className="digital-progress-bar">
                <div
                  className="digital-progress-fill"
                  style={{ width: `${(filledCount / 8) * 100}%` }}
                />
              </div>
              <span className="digital-progress-label">
                {filledCount} of 8 sections filled
              </span>
            </div>

            {/* Section cards */}
            <div className="digital-sections">
              {CANVAS_SECTIONS.map((sec, i) => {
                const isExpanded = expandedSections.has(sec.key);
                const isFilled = sections[sec.key].trim().length > 0;
                return (
                  <div
                    key={sec.key}
                    className={`digital-section-card${isExpanded ? " expanded" : ""}${isFilled ? " filled" : ""}`}
                    style={{
                      animationDelay: `${i * 30}ms`,
                    }}
                  >
                    <button
                      className="digital-section-header"
                      onClick={() => toggleSection(sec.key)}
                    >
                      <div className="digital-section-header-left">
                        <span
                          className="digital-section-label"
                          style={{
                            background: `${sec.color}14`,
                            color: sec.color,
                            borderColor: `${sec.color}30`,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span className="digital-section-name">{sec.label}</span>
                        {isFilled && (
                          <span className="digital-section-check">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10a37f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <span className={`digital-section-chevron${isExpanded ? " open" : ""}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>

                    <div className={`digital-section-body${isExpanded ? " show" : ""}`}>
                      <div className="digital-section-question">{sec.question}</div>
                      <textarea
                        className="digital-section-textarea"
                        placeholder={`Enter ${sec.label.toLowerCase()} details...`}
                        value={sections[sec.key]}
                        onChange={(e) => updateSection(sec.key, e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Title and category */}
            {filledCount > 0 && (
              <div className="digital-meta-section">
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color: "var(--text-3)",
                    marginBottom: 10,
                  }}
                >
                  Card details
                </div>
                <input
                  type="text"
                  className="digital-title-input"
                  placeholder="Give your prompt a title..."
                  value={digitalTitle}
                  onChange={(e) => setDigitalTitle(e.target.value)}
                />
                <div className="digital-category-row">
                  {CATEGORY_OPTIONS.map(([key, label]) => (
                    <button
                      key={key}
                      className={`digital-cat-pill${digitalCategory === key ? " active" : ""}`}
                      onClick={() => setDigitalCategory(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live prompt preview */}
            {assembledPrompt && (
              <div className="digital-preview">
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color: "var(--text-3)",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Live preview
                </div>
                <div className="digital-preview-box">
                  <div className="digital-preview-text">{assembledPrompt}</div>
                </div>
              </div>
            )}

            {/* Generate button */}
            {filledCount > 0 && (
              <button
                className="digital-generate-btn"
                onClick={generateDigitalCard}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Generate Card
              </button>
            )}

            <div style={{ height: 24 }} />
          </div>
        )}

        {/* Saved canvas cards */}
        <div
          style={{
            padding: "4px 20px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>My Canvas Cards</div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
            {customCards.length} saved
          </div>
        </div>
        <div className="card-list" style={{ paddingBottom: 20 }}>
          {customCards.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "28px 20px",
                color: "var(--text-3)",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              No canvas cards yet.
              <br />
              Scan your first poster or build one digitally to get started.
            </div>
          ) : (
            customCards.map((card, i) => (
              <CardRow
                key={card.id}
                card={card}
                starred={starredIds.has(card.id)}
                onToggleStar={onToggleStar}
                onClick={() => onCardClick(card)}
                style={{ animationDelay: `${i * 15}ms` }}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
