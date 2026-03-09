"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PromptCard } from "@/data/prompts";
import { CARDS, COLORS, CATEGORIES } from "@/data/prompts";

interface ScanScreenProps {
  onCardScanned: (cardId: string) => void;
  onBack: () => void;
  allCards: PromptCard[];
}

export default function ScanScreen({ onCardScanned, onBack, allCards }: ScanScreenProps) {
  const [error, setError] = useState<string>("");
  const [flash, setFlash] = useState(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const hasScannedRef = useRef(false);

  const handleDecode = useCallback(
    (decodedText: string) => {
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;

      // Extract card ID — handle both raw ID and URL with ?card= param
      let cardId = decodedText.trim();
      try {
        const url = new URL(decodedText);
        const paramId = url.searchParams.get("card") || url.searchParams.get("id");
        if (paramId) {
          cardId = paramId;
        } else {
          // Try last path segment
          const seg = url.pathname.split("/").filter(Boolean).pop();
          if (seg) cardId = seg;
        }
      } catch {
        // Not a URL — use raw value as card ID
      }

      // Flash effect
      setFlash(true);
      setTimeout(() => {
        if (mountedRef.current) setFlash(false);
      }, 220);

      // Stop scanner then notify parent
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }

      setTimeout(() => {
        onCardScanned(cardId);
      }, 250);
    },
    [onCardScanned]
  );

  useEffect(() => {
    mountedRef.current = true;
    hasScannedRef.current = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mountedRef.current) return;

        const scanner = new Html5Qrcode("scan-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 230, height: 230 },
            aspectRatio: 1,
          },
          (decodedText) => handleDecode(decodedText),
          () => {} // ignore frames without QR
        );
      } catch (err) {
        if (mountedRef.current) {
          setError("Camera access denied. Please allow camera permissions to scan QR codes.");
          console.error("QR scanner error:", err);
        }
      }
    }

    startScanner();

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [handleDecode]);

  // Build demo pills — one card per category
  const demoPills = Object.keys(CATEGORIES)
    .filter((cat) => cat !== "starred" && cat !== "canvas")
    .map((cat) => {
      const card = CARDS.find((c) => c.cat === cat);
      return card ? { card, cat } : null;
    })
    .filter(Boolean) as { card: PromptCard; cat: string }[];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#000" }}>
      {/* Flash overlay */}
      <div className={`flash-overlay${flash ? " on" : ""}`} />

      {/* Camera viewfinder */}
      <div className="scan-viewfinder">
        <div id="scan-reader" style={{ width: "100%", height: "100%" }} />

        {/* Vignette */}
        <div className="scan-vignette" />

        {/* Corner brackets */}
        <div className="finder">
          <div className="fc tl" />
          <div className="fc tr" />
          <div className="fc bl" />
          <div className="fc br" />
          {/* Animated scan line */}
          <div className="finder-line" />
        </div>
      </div>

      {/* Top bar */}
      <div className="scan-topbar">
        <button
          className="icon-btn"
          onClick={() => {
            if (scannerRef.current) {
              scannerRef.current.stop().catch(console.error);
            }
            onBack();
          }}
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "#fff" }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
          Scan Card
        </span>
        <div style={{ width: 34 }} />
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            zIndex: 30,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 18,
              padding: "24px 20px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
              {error}
            </p>
            <button
              onClick={onBack}
              style={{
                marginTop: 16,
                padding: "10px 24px",
                borderRadius: 100,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Bottom panel */}
      <div className="scan-bottom">
        <p className="scan-hint">
          Point your camera at a card&apos;s QR code
          <br />
          or try a demo card below
        </p>

        {/* Demo pills */}
        <div className="demo-row">
          {demoPills.map(({ card, cat }) => {
            const color = COLORS[cat];
            return (
              <button
                key={card.id}
                className="demo-pill"
                onClick={() => {
                  if (scannerRef.current) {
                    scannerRef.current.stop().catch(console.error);
                  }
                  // Flash effect
                  setFlash(true);
                  setTimeout(() => {
                    if (mountedRef.current) setFlash(false);
                  }, 220);
                  setTimeout(() => {
                    onCardScanned(card.id);
                  }, 250);
                }}
                style={{
                  borderColor: color ? `${color.hex}44` : undefined,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: color?.hex || "#999",
                    marginRight: 6,
                  }}
                />
                {card.title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
