"use client";

import { useState, useRef } from "react";
import { PromptCard } from "@/data/prompts";
import CardRow from "./CardRow";

interface CanvasScreenProps {
  customCards: PromptCard[];
  starredIds: Set<string>;
  onCardClick: (card: PromptCard) => void;
  onToggleStar: (id: string) => void;
  onSaveCard: (card: PromptCard) => void;
}

export default function CanvasScreen({
  customCards,
  starredIds,
  onCardClick,
  onToggleStar,
  onSaveCard,
}: CanvasScreenProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [pendingCard, setPendingCard] = useState<PromptCard | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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
              Scan your first poster to get started.
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
