"use client";

import { useState, useCallback } from "react";

type SkillMode = "menu" | "research" | "report" | "pipeline";
type PipelineStep = 1 | 2 | 3;

const NOTES_KEY = "ai-canvas-notes";

interface SavedNote {
  content: string;
  cardId: string;
  cardTitle: string;
  model: string;
  timestamp: number;
}

interface SkillsRunnerProps {
  onBack: () => void;
}

export default function SkillsRunner({ onBack }: SkillsRunnerProps) {
  const [mode, setMode] = useState<SkillMode>("menu");
  const [topic, setTopic] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedToNotes, setSavedToNotes] = useState(false);

  // Pipeline state
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>(1);
  const [pipelineResearch, setPipelineResearch] = useState("");
  const [pipelineContext, setPipelineContext] = useState("");
  const [pipelineReport, setPipelineReport] = useState("");
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineSaved, setPipelineSaved] = useState(false);

  const runResearch = useCallback(async (searchTopic: string) => {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/skills/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: searchTopic, model: "gemini" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.content);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }, []);

  const runReport = useCallback(async (content: string) => {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/skills/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, model: "gemini" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.content);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }, []);

  // Pipeline functions
  const runPipelineResearch = useCallback(async () => {
    setPipelineLoading(true);
    setError("");
    try {
      const res = await fetch("/api/skills/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, model: "gemini" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPipelineResearch(data.content);
        setPipelineContext(data.content);
        setPipelineStep(2);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setPipelineLoading(false);
  }, [topic]);

  const runPipelineReport = useCallback(async () => {
    setPipelineLoading(true);
    setError("");
    try {
      const res = await fetch("/api/skills/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: pipelineContext, model: "gemini" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPipelineReport(data.content);
        setPipelineStep(3);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setPipelineLoading(false);
  }, [pipelineContext]);

  function saveResultToNotes(content: string, title: string) {
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      const notes: SavedNote[] = raw ? JSON.parse(raw) : [];
      notes.push({
        content,
        cardId: "skill-result",
        cardTitle: title,
        model: "gemini",
        timestamp: Date.now(),
      });
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }

  function handleSaveResult() {
    if (mode === "research") {
      saveResultToNotes(result, `Research: ${topic}`);
    } else if (mode === "report") {
      saveResultToNotes(result, "Formatted Report");
    }
    setSavedToNotes(true);
    setTimeout(() => setSavedToNotes(false), 2000);
  }

  function handleSavePipelineResult() {
    saveResultToNotes(pipelineReport, `Pipeline: ${topic}`);
    setPipelineSaved(true);
    setTimeout(() => setPipelineSaved(false), 2000);
  }

  function handleBackFromSkill() {
    setMode("menu");
    setResult("");
    setError("");
    setTopic("");
    setReportContent("");
    setSavedToNotes(false);
    setPipelineStep(1);
    setPipelineResearch("");
    setPipelineContext("");
    setPipelineReport("");
    setPipelineSaved(false);
  }

  // Render the menu screen
  if (mode === "menu") {
    return (
      <>
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
          <span className="topbar-title">Skills</span>
          <div className="topbar-right" />
        </div>

        <div className="scroll-body">
          <div style={{ padding: "20px 20px 8px" }}>
            <div className="home-label">AI Workflows</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: "#1a1a1a", marginBottom: 6 }}>
              Run a Skill
            </div>
            <div style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", lineHeight: 1.5, marginBottom: 20 }}>
              Pre-built AI workflows that produce structured output. Choose a skill or run the full pipeline.
            </div>
          </div>

          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Research Assistant Card */}
            <div className="skill-card" onClick={() => setMode("research")}>
              <div className="skill-card-icon" style={{ background: "rgba(66,133,244,0.1)", borderColor: "rgba(66,133,244,0.25)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="skill-card-body">
                <div className="skill-card-name">Research Assistant</div>
                <div className="skill-card-desc">Enter a topic and get structured findings with evidence and analysis</div>
              </div>
              <div className="skill-card-arrow">&rsaquo;</div>
            </div>

            {/* Report Generator Card */}
            <div className="skill-card" onClick={() => setMode("report")}>
              <div className="skill-card-icon" style={{ background: "rgba(16,163,127,0.1)", borderColor: "rgba(16,163,127,0.25)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10a37f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="skill-card-body">
                <div className="skill-card-name">Report Generator</div>
                <div className="skill-card-desc">Paste content and get a polished, structured report</div>
              </div>
              <div className="skill-card-arrow">&rsaquo;</div>
            </div>

            {/* Full Pipeline Card */}
            <div className="skill-card skill-card-pipeline" onClick={() => setMode("pipeline")}>
              <div className="skill-card-icon" style={{ background: "linear-gradient(135deg, rgba(66,133,244,0.12), rgba(16,163,127,0.12))", borderColor: "rgba(66,133,244,0.25)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#skillGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="skillGrad" x1="0" y1="0" x2="24" y2="24">
                      <stop offset="0%" stopColor="#4285f4" />
                      <stop offset="100%" stopColor="#10a37f" />
                    </linearGradient>
                  </defs>
                  <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
              </div>
              <div className="skill-card-body">
                <div className="skill-card-name">Full Pipeline</div>
                <div className="skill-card-desc">Research, review, then generate a report — 3 steps with human review</div>
                <div className="skill-card-badge">Layer 3</div>
              </div>
              <div className="skill-card-arrow">&rsaquo;</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Pipeline mode
  if (mode === "pipeline") {
    return (
      <>
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
            <button className="icon-btn" onClick={handleBackFromSkill}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
          <span className="topbar-title">Full Pipeline</span>
          <div className="topbar-right" />
        </div>

        <div className="scroll-body" style={{ paddingBottom: 120 }}>
          {/* Step Indicator */}
          <div className="skill-steps">
            {[1, 2, 3].map((step) => (
              <div key={step} className="skill-step-item">
                <div className={`skill-step-dot${pipelineStep >= step ? " active" : ""}`}>
                  {pipelineStep > step ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <div className={`skill-step-label${pipelineStep >= step ? " active" : ""}`}>
                  {step === 1 ? "Research" : step === 2 ? "Review" : "Report"}
                </div>
                {step < 3 && <div className={`skill-step-line${pipelineStep > step ? " active" : ""}`} />}
              </div>
            ))}
          </div>

          <div style={{ padding: "0 20px" }}>
            {error && (
              <div className="skill-error">{error}</div>
            )}

            {/* Step 1: Enter topic */}
            {pipelineStep === 1 && (
              <div className="skill-input-section">
                <div className="det-section-label">Step 1: Research Topic</div>
                <p style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", marginBottom: 14, lineHeight: 1.5 }}>
                  Enter a topic to research. The AI will produce structured findings with evidence.
                </p>
                <textarea
                  className="skill-textarea"
                  placeholder="e.g., AI-powered design tools adoption in enterprise teams"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                />
                <button
                  className="skill-run-btn"
                  onClick={runPipelineResearch}
                  disabled={!topic.trim() || pipelineLoading}
                >
                  {pipelineLoading ? (
                    <>
                      <div className="skill-btn-spinner" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      Run Research
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Review & Edit */}
            {pipelineStep === 2 && (
              <div className="skill-input-section">
                <div className="det-section-label">Step 2: Review & Add Context</div>
                <p style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", marginBottom: 14, lineHeight: 1.5 }}>
                  Review the research output below. Edit or add context before generating the final report.
                </p>

                {/* Show raw research as read-only */}
                <div className="det-section-label" style={{ marginTop: 8 }}>Research Results</div>
                <div className="skill-result-box" style={{ maxHeight: 250, overflowY: "auto", marginBottom: 16 }}>
                  <div className="skill-result-text">{pipelineResearch}</div>
                </div>

                <div className="det-section-label">Your Additions (optional)</div>
                <textarea
                  className="skill-textarea"
                  placeholder="Add additional context, notes, or edits..."
                  value={pipelineContext.length > pipelineResearch.length ? pipelineContext.slice(pipelineResearch.length) : ""}
                  onChange={(e) => {
                    const additions = e.target.value;
                    setPipelineContext(additions.trim() ? `${pipelineResearch}\n\nAdditional context from reviewer:\n${additions}` : pipelineResearch);
                  }}
                  rows={4}
                />
                <button
                  className="skill-run-btn"
                  onClick={runPipelineReport}
                  disabled={pipelineLoading}
                >
                  {pipelineLoading ? (
                    <>
                      <div className="skill-btn-spinner" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Final Report */}
            {pipelineStep === 3 && (
              <div className="skill-input-section">
                <div className="det-section-label">Step 3: Final Report</div>
                <p style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", marginBottom: 14, lineHeight: 1.5 }}>
                  Your research has been formatted into a structured report.
                </p>
                <div className="skill-result-box">
                  <div className="skill-result-text">{pipelineReport}</div>
                </div>
                <button
                  className={`skill-save-btn${pipelineSaved ? " saved" : ""}`}
                  onClick={handleSavePipelineResult}
                  disabled={pipelineSaved}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={pipelineSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {pipelineSaved ? "Saved to Notes" : "Save to Notes"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Processing overlay */}
        <div className={`processing-overlay${pipelineLoading ? " show" : ""}`}>
          <div className="processing-spinner" />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
            {pipelineStep === 1 ? "Running Research..." : "Generating Report..."}
          </div>
          <div style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>
            This may take a moment
          </div>
        </div>
      </>
    );
  }

  // Research or Report mode
  return (
    <>
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
          <button className="icon-btn" onClick={handleBackFromSkill}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
        <span className="topbar-title">
          {mode === "research" ? "Research Assistant" : "Report Generator"}
        </span>
        <div className="topbar-right" />
      </div>

      <div className="scroll-body" style={{ paddingBottom: 120 }}>
        <div style={{ padding: "20px" }}>
          {error && (
            <div className="skill-error">{error}</div>
          )}

          {!result && (
            <div className="skill-input-section">
              <div className="det-section-label">
                {mode === "research" ? "Research Topic" : "Content to Format"}
              </div>
              <p style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", marginBottom: 14, lineHeight: 1.5 }}>
                {mode === "research"
                  ? "Enter a topic and the AI will produce structured findings with evidence and analysis."
                  : "Paste your content below and the AI will format it into a polished, structured report."}
              </p>
              <textarea
                className="skill-textarea"
                placeholder={
                  mode === "research"
                    ? "e.g., Impact of generative AI on UX design workflows"
                    : "Paste your raw notes, findings, or data here..."
                }
                value={mode === "research" ? topic : reportContent}
                onChange={(e) =>
                  mode === "research"
                    ? setTopic(e.target.value)
                    : setReportContent(e.target.value)
                }
                rows={mode === "research" ? 3 : 8}
              />
              <button
                className="skill-run-btn"
                onClick={() =>
                  mode === "research"
                    ? runResearch(topic)
                    : runReport(reportContent)
                }
                disabled={
                  loading ||
                  (mode === "research" ? !topic.trim() : !reportContent.trim())
                }
              >
                {loading ? (
                  <>
                    <div className="skill-btn-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    {mode === "research" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                    {mode === "research" ? "Run Research" : "Generate Report"}
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <div className="skill-input-section">
              <div className="det-section-label">Results</div>
              <div className="skill-result-box">
                <div className="skill-result-text">{result}</div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  className={`skill-save-btn${savedToNotes ? " saved" : ""}`}
                  onClick={handleSaveResult}
                  disabled={savedToNotes}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={savedToNotes ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {savedToNotes ? "Saved to Notes" : "Save to Notes"}
                </button>
                <button
                  className="skill-reset-btn"
                  onClick={() => {
                    setResult("");
                    setError("");
                    setSavedToNotes(false);
                  }}
                >
                  Run Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing overlay */}
      <div className={`processing-overlay${loading ? " show" : ""}`}>
        <div className="processing-spinner" />
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
          {mode === "research" ? "Running Research..." : "Generating Report..."}
        </div>
        <div style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>
          This may take a moment
        </div>
      </div>
    </>
  );
}
