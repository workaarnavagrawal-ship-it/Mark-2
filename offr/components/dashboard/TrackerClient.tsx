"use client";

import { useState } from "react";
import Link from "next/link";
import { updateTrackerLabel, deleteTrackerEntry } from "@/lib/profile";
import type { TrackerEntry } from "@/lib/types";

const LABELS = ["Firm", "Insurance", "Backup", "Wildcard", "Undecided"];

const BAND = {
  Safe: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300", bar: "bg-emerald-400" },
  Target: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-300", bar: "bg-amber-400" },
  Reach: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-300", bar: "bg-red-400" },
};

export function TrackerClient({ initialAssessments }: { initialAssessments: TrackerEntry[] }) {
  const [entries, setEntries] = useState<TrackerEntry[]>(initialAssessments);
  const [labelEditing, setLabelEditing] = useState<string | null>(null);

  async function handleLabel(id: string, label: string) {
    await updateTrackerLabel(id, label);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, label } : e));
    setLabelEditing(null);
  }

  async function handleDelete(id: string) {
    await deleteTrackerEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const summary = { Safe: 0, Target: 0, Reach: 0 };
  entries.forEach(e => { summary[e.band]++; });

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Offer Tracker</h1>
        <p className="text-zinc-500">Track all your UCAS choices in one place. You can save up to 5.</p>
      </div>

      {/* Summary */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(["Safe","Target","Reach"] as const).map(band => (
            <div key={band} className={`rounded-2xl border p-5 ${BAND[band].bg} ${BAND[band].border}`}>
              <div className={`text-3xl font-semibold ${BAND[band].text}`}>{summary[band]}</div>
              <div className="text-sm text-zinc-500 mt-1">{band} choice{summary[band] !== 1 ? "s" : ""}</div>
            </div>
          ))}
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 border-dashed p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-2">No choices yet</h3>
          <p className="text-zinc-500 mb-6">Run an assessment and it'll automatically appear here.</p>
          <Link href="/dashboard/assess"
            className="inline-flex rounded-2xl bg-zinc-100 text-zinc-950 px-8 py-3 font-semibold hover:bg-white transition">
            Check offer chances →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => {
            const b = BAND[entry.band];
            return (
              <div key={entry.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold">{entry.course_name}</h3>
                      <span className={`text-xs rounded-full border px-3 py-1 ${b.bg} ${b.border} ${b.text}`}>
                        {entry.band}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">{entry.university_name}</p>

                    {/* Chance bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div className={`h-full rounded-full ${b.bar}`}
                          style={{ width: `${entry.chance_percent}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-zinc-300 w-10 text-right">{entry.chance_percent}%</span>
                    </div>
                  </div>

                  {/* Label + delete */}
                  <div className="flex flex-col items-end gap-2">
                    {labelEditing === entry.id ? (
                      <div className="flex flex-col gap-1.5">
                        {LABELS.map(l => (
                          <button key={l} onClick={() => handleLabel(entry.id!, l)}
                            className="text-xs text-left px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition">
                            {l}
                          </button>
                        ))}
                        <button onClick={() => setLabelEditing(null)}
                          className="text-xs text-zinc-600 hover:text-zinc-400 transition px-3 py-1">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setLabelEditing(entry.id!)}
                          className="text-xs border border-zinc-800 rounded-full px-3 py-1 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition">
                          {entry.label || "Set label"} ▾
                        </button>
                        <button onClick={() => handleDelete(entry.id!)}
                          className="text-xs text-zinc-700 hover:text-red-400 transition">
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
            <Link href="/dashboard/assess"
              className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 border-dashed p-5 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all">
              + Add another choice ({5 - entries.length} remaining)
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
