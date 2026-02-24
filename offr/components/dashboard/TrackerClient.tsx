"use client";
import { useState } from "react";
import Link from "next/link";
import { updateTrackerLabel, deleteTrackerEntry } from "@/lib/profile";
import type { TrackerEntry } from "@/lib/types";

const LABELS = ["Firm", "Insurance", "Backup", "Wildcard", "Undecided"];

interface BandStyle { bg: string; color: string; border: string; bar: string; }
const BS: Record<string, BandStyle> = {
  Safe: { bg: "var(--safe-bg)", color: "var(--safe-t)", border: "1px solid var(--safe-b)", bar: "var(--safe-t)" },
  Target: { bg: "var(--tgt-bg)", color: "var(--tgt-t)", border: "1px solid var(--tgt-b)", bar: "var(--tgt-t)" },
  Reach: { bg: "var(--rch-bg)", color: "var(--rch-t)", border: "1px solid var(--rch-b)", bar: "var(--rch-t)" },
};

export function TrackerClient({ initialAssessments }: { initialAssessments: TrackerEntry[] }) {
  const [entries, setEntries] = useState<TrackerEntry[]>(initialAssessments);
  const [labelOpen, setLabelOpen] = useState<string | null>(null);

  async function handleLabel(id: string, label: string) {
    await updateTrackerLabel(id, label);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, label } : e));
    setLabelOpen(null);
  }

  async function handleDelete(id: string) {
    await deleteTrackerEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const summary = { Safe: 0, Target: 0, Reach: 0 };
  entries.forEach(e => { if (e.band in summary) summary[e.band as keyof typeof summary]++; });

  return (
    <div style={{ padding: "52px 56px", maxWidth: "800px" }}>
      <div style={{ marginBottom: "48px" }}>
        <p className="label" style={{ marginBottom: "12px" }}>UCAS planning</p>
        <h1 style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "44px", fontWeight: 400, letterSpacing: "-0.025em", color: "var(--t)", marginBottom: "14px" }}>
          Offer Tracker
        </h1>
        <p style={{ fontSize: "15px", color: "var(--t3)", lineHeight: 1.6 }}>Your shortlist, at a glance. Label, review, and refine your five UCAS choices.</p>
      </div>

      {/* Summary */}
      {entries.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
          {(["Safe","Target","Reach"] as const).map(band => (
            <div key={band} className="card" style={{ background: BS[band].bg, border: `1px solid ${BS[band].border.replace("1px solid ", "")}` }}>
              <p style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "40px", fontWeight: 400, color: BS[band].color, lineHeight: 1, marginBottom: "6px" }}>{summary[band]}</p>
              <p style={{ fontSize: "12px", color: BS[band].color, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em" }}>{band} choice{summary[band] !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "64px 32px", borderStyle: "dashed" }}>
          <p style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "22px", color: "var(--t)", marginBottom: "12px" }}>No choices saved yet</p>
          <p style={{ fontSize: "14px", color: "var(--t3)", marginBottom: "28px", lineHeight: 1.6 }}>Run an assessment and it'll appear here automatically.</p>
          <Link href="/dashboard/assess" className="btn-primary">Check offer chances →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {entries.map(entry => {
            const bs = BS[entry.band] || BS.Reach;
            return (
              <div key={entry.id} className="card" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <h3 style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "18px", fontWeight: 400, color: "var(--t)" }}>{entry.course_name}</h3>
                      <span className="pill" style={{ background: bs.bg, color: bs.color, border: bs.border }}>{entry.band}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--t3)", marginBottom: "16px" }}>{entry.university_name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ flex: 1, height: "3px", borderRadius: "2px", background: "var(--s3)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "2px", background: bs.bar, width: `${entry.chance_percent}%`, opacity: 0.8 }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "18px", color: "var(--t)", minWidth: "44px", textAlign: "right" }}>{entry.chance_percent}%</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                    {labelOpen === entry.id ? (
                      <div className="glass-dark" style={{ borderRadius: "12px", padding: "6px", display: "flex", flexDirection: "column", gap: "1px", minWidth: "120px", position: "relative", zIndex: 10 }}>
                        {LABELS.map(l => (
                          <button key={l} onClick={() => handleLabel(entry.id!, l)} style={{
                            background: "transparent", border: "none", color: "var(--t2)", fontSize: "13px",
                            padding: "8px 10px", borderRadius: "8px", cursor: "pointer", textAlign: "left",
                            transition: "background 150ms", fontFamily: "var(--font-dm, var(--sans))",
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--s3)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                            {l}
                          </button>
                        ))}
                        <button onClick={() => setLabelOpen(null)} style={{ background: "transparent", border: "none", color: "var(--t3)", fontSize: "12px", padding: "6px 10px", cursor: "pointer", fontFamily: "var(--font-dm, var(--sans))" }}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setLabelOpen(entry.id!)} style={{
                          background: "transparent", border: "1px solid var(--b)", borderRadius: "var(--r-pill)",
                          color: "var(--t3)", fontSize: "12px", padding: "4px 12px", cursor: "pointer",
                          transition: "all 150ms", fontFamily: "var(--font-dm, var(--sans))",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--b-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--t2)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--b)"; (e.currentTarget as HTMLElement).style.color = "var(--t3)"; }}>
                          {entry.label || "Label ▾"}
                        </button>
                        <button onClick={() => handleDelete(entry.id!)} style={{
                          background: "transparent", border: "none", color: "var(--t3)", fontSize: "12px",
                          cursor: "pointer", transition: "color 150ms", fontFamily: "var(--font-dm, var(--sans))", padding: "2px 4px",
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--rch-t)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--t3)"}>
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {entries.length < 5 && (
            <Link href="/dashboard/assess" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "20px", border: "1px dashed var(--b)", borderRadius: "var(--r-card)",
              color: "var(--t3)", fontSize: "14px", textDecoration: "none",
              transition: "all 150ms ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--b-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--t2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--b)"; (e.currentTarget as HTMLElement).style.color = "var(--t3)"; }}>
              + Add choice ({5 - entries.length} remaining)
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
