"use client";

import { useState, useEffect } from "react";
import type { Profile } from "@/lib/types";

interface LineFeedback {
  line: string;
  lineNumber: number;
  score: number; // 1-10
  verdict: "strong" | "weak" | "improve" | "neutral";
  feedback: string;
  suggestion?: string;
}

interface PSAnalysis {
  overallScore: number;
  band: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  lineFeedback: LineFeedback[];
  topPriority: string;
}

function splitIntoLines(text: string): string[] {
  // Split by sentence endings or natural breaks, keeping ~1-3 sentences per chunk
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = "";
  sentences.forEach((s, i) => {
    current += s.trim() + " ";
    if ((i + 1) % 2 === 0 || i === sentences.length - 1) {
      const trimmed = current.trim();
      if (trimmed) chunks.push(trimmed);
      current = "";
    }
  });
  return chunks.filter(c => c.length > 10);
}

const VERDICT_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  strong:  { bg: "var(--safe-bg)",  color: "var(--safe-t)",  border: "var(--safe-b)",  label: "Strong" },
  weak:    { bg: "var(--rch-bg)",   color: "var(--rch-t)",   border: "var(--rch-b)",   label: "Weak" },
  improve: { bg: "var(--tgt-bg)",   color: "var(--tgt-t)",   border: "var(--tgt-b)",   label: "Improve" },
  neutral: { bg: "var(--s3)",       color: "var(--t3)",       border: "var(--b)",        label: "Neutral" },
};

function ScoreDot({ score }: { score: number }) {
  const color = score >= 8 ? "var(--safe-t)" : score >= 5 ? "var(--tgt-t)" : "var(--rch-t)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{
          width: "5px", height: "5px", borderRadius: "50%",
          background: i < score ? color : "var(--s3)",
          transition: "background 150ms",
        }} />
      ))}
    </div>
  );
}

export function PSAnalyserClient({ profile }: { profile: Profile }) {
  const [ps, setPs] = useState(
    profile.ps_format === "LEGACY"
      ? (profile.ps_statement || "")
      : [profile.ps_q1, profile.ps_q2, profile.ps_q3].filter(Boolean).join("\n\n")
  );
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PSAnalysis | null>(null);
  const [err, setErr] = useState("");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    setWordCount(ps.trim() ? ps.trim().split(/\s+/).length : 0);
  }, [ps]);

  async function analyse() {
    if (!ps.trim()) { setErr("Please enter your personal statement first."); return; }
    setErr(""); setLoading(true); setAnalysis(null); setActiveIdx(null);

    const lines = splitIntoLines(ps);

    try {
      const res = await fetch("/api/py/analyse_ps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement: ps, lines, format: profile.ps_format || "UCAS_3Q" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Analysis failed (${res.status})`);
      }
      setAnalysis(data);
    } catch (e: any) {
      setErr(e.message || "Analysis failed. Check your API key is set.");
    } finally {
      setLoading(false);
    }
  }

  const overallColor = analysis
    ? analysis.overallScore >= 75 ? "var(--safe-t)"
    : analysis.overallScore >= 50 ? "var(--tgt-t)"
    : "var(--rch-t)"
    : "var(--t)";

  return (
    <div style={{ padding: "52px 56px", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <p className="label" style={{ marginBottom: "12px" }}>Academic writing</p>
        <h1 style={{
          fontFamily: "var(--font-garamond, var(--serif))",
          fontSize: "44px", fontWeight: 400, letterSpacing: "-0.025em",
          color: "var(--t)", marginBottom: "14px",
        }}>
          PS Analyser
        </h1>
        <p style={{ fontSize: "15px", color: "var(--t3)", lineHeight: 1.6, maxWidth: "520px" }}>
          Line-by-line feedback on your personal statement. Powered by real admissions data and AI analysis.
        </p>
      </div>

      {/* Two-column layout when analysis is ready */}
      <div style={{ display: "grid", gridTemplateColumns: analysis ? "1fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>

        {/* Left: Input */}
        <div>
          <div className="card" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <p className="label" style={{ margin: 0 }}>Your personal statement</p>
              <span style={{ fontSize: "12px", color: wordCount > 650 ? "var(--rch-t)" : "var(--t3)" }}>
                {wordCount} words {profile.ps_format === "UCAS_3Q" ? "(UCAS 3Q)" : "(Legacy)"}
              </span>
            </div>
            <textarea
              value={ps}
              onChange={e => setPs(e.target.value)}
              placeholder="Paste your personal statement here…"
              rows={analysis ? 18 : 14}
              style={{
                width: "100%", background: "var(--s2)", border: "1px solid var(--b)",
                borderRadius: "10px", padding: "14px 16px",
                fontSize: "14px", color: "var(--t)", lineHeight: 1.75,
                fontFamily: "var(--font-dm, var(--sans))",
                outline: "none", resize: "vertical",
                transition: "border-color 150ms",
              }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--b-strong)"}
              onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--b)"}
            />
          </div>

          {err && (
            <div style={{ padding: "12px 16px", background: "var(--rch-bg)", border: "1px solid var(--rch-b)", borderRadius: "10px", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", color: "var(--rch-t)" }}>{err}</p>
            </div>
          )}

          <button onClick={analyse} disabled={loading || !ps.trim()} className="btn-primary" style={{ width: "100%", padding: "14px" }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "16px", height: "16px", border: "1.5px solid var(--t-inv)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                Analysing…
              </span>
            ) : "Analyse my PS →"}
          </button>

          {!analysis && (
            <p style={{ fontSize: "12px", color: "var(--t3)", marginTop: "12px", lineHeight: 1.6, textAlign: "center" }}>
              Scores each sentence · Flags weak phrases · Suggests improvements
            </p>
          )}

          {/* Overall score card */}
          {analysis && (
            <div className="card" style={{ marginTop: "12px" }}>
              <p className="label" style={{ marginBottom: "16px" }}>Overall score</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "52px", fontWeight: 400, color: overallColor, lineHeight: 1 }}>
                  {analysis.overallScore}
                </span>
                <span style={{ fontSize: "20px", color: "var(--t3)", fontFamily: "var(--font-garamond, var(--serif))" }}>/100</span>
                <span className="pill" style={{ marginLeft: "8px", background: "var(--s3)", color: "var(--t2)", border: "1px solid var(--b)" }}>{analysis.band}</span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--t3)", lineHeight: 1.65, marginBottom: "20px" }}>{analysis.summary}</p>

              <div style={{ borderTop: "1px solid var(--b)", paddingTop: "16px", marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Top priority</p>
                <p style={{ fontSize: "14px", color: "var(--tgt-t)", lineHeight: 1.6, background: "var(--tgt-bg)", border: "1px solid var(--tgt-b)", borderRadius: "10px", padding: "12px 14px" }}>
                  {analysis.topPriority}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Strengths</p>
                  {analysis.strengths.map((s, i) => (
                    <p key={i} style={{ fontSize: "13px", color: "var(--safe-t)", marginBottom: "6px", lineHeight: 1.5, display: "flex", gap: "8px" }}>
                      <span style={{ flexShrink: 0 }}>·</span>{s}
                    </p>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Weaknesses</p>
                  {analysis.weaknesses.map((w, i) => (
                    <p key={i} style={{ fontSize: "13px", color: "var(--rch-t)", marginBottom: "6px", lineHeight: 1.5, display: "flex", gap: "8px" }}>
                      <span style={{ flexShrink: 0 }}>·</span>{w}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Line-by-line feedback */}
        {analysis && (
          <div>
            <p className="label" style={{ marginBottom: "16px" }}>Line-by-line feedback</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {analysis.lineFeedback.map((lf, idx) => {
                const vs = VERDICT_STYLE[lf.verdict];
                const isActive = activeIdx === idx;
                return (
                  <div key={idx}
                    onClick={() => setActiveIdx(isActive ? null : idx)}
                    style={{
                      background: isActive ? "var(--s2)" : "var(--s1)",
                      border: `1px solid ${isActive ? vs.border : "var(--b)"}`,
                      borderRadius: "12px", padding: "14px 16px", cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "var(--b-strong)"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "var(--b)"; }}>
                    {/* Line header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--t3)", minWidth: "20px" }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="pill" style={{ background: vs.bg, color: vs.color, border: `1px solid ${vs.border}`, fontSize: "11px", padding: "2px 8px" }}>
                          {vs.label}
                        </span>
                      </div>
                      <ScoreDot score={lf.score} />
                    </div>

                    {/* The line itself */}
                    <p style={{
                      fontSize: "13px", color: "var(--t2)", lineHeight: 1.65,
                      marginBottom: isActive ? "12px" : "0",
                      borderLeft: `2px solid ${vs.border}`,
                      paddingLeft: "10px",
                      fontStyle: "italic",
                    }}>
                      "{lf.line.length > 120 ? lf.line.slice(0, 120) + "…" : lf.line}"
                    </p>

                    {/* Expanded feedback */}
                    {isActive && (
                      <div style={{ marginTop: "12px", borderTop: "1px solid var(--b)", paddingTop: "12px" }}>
                        <p style={{ fontSize: "13px", color: "var(--t3)", lineHeight: 1.7, marginBottom: lf.suggestion ? "12px" : "0" }}>
                          {lf.feedback}
                        </p>
                        {lf.suggestion && (
                          <div style={{ background: "var(--s3)", border: "1px solid var(--b-strong)", borderRadius: "8px", padding: "10px 12px" }}>
                            <p style={{ fontSize: "11px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Suggested rewrite</p>
                            <p style={{ fontSize: "13px", color: "var(--acc)", lineHeight: 1.65, fontStyle: "italic" }}>{lf.suggestion}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
}
