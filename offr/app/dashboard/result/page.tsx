"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAssessment } from "@/lib/storage";
import type { OfferAssessResponse } from "@/lib/types";

function Band({ band }: { band: "Safe"|"Target"|"Reach" }) {
  const cls = band === "Safe" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
    : band === "Target" ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
    : "bg-red-500/10 border-red-500/20 text-red-300";
  return <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${cls}`}>{band}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 mb-4">
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">{title}</div>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-sm text-zinc-700">—</p>;
  return (
    <ul className="space-y-3">
      {items.map((x, i) => (
        <li key={i} className="flex gap-3 text-base text-zinc-400">
          <span className="text-zinc-700 shrink-0 mt-0.5">·</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

const EMOJI = { Safe: "🎉", Target: "🤔", Reach: "😬" };
const MSG = { Safe: "Strong chance of an offer.", Target: "Could go either way.", Reach: "It's a stretch, but not impossible." };

export default function ResultPage() {
  const [data, setData] = useState<OfferAssessResponse | null>(null);
  useEffect(() => { setData(loadAssessment()); }, []);

  if (!data) return (
    <div className="p-8 text-center">
      <div className="text-4xl mb-4">🤷</div>
      <p className="text-zinc-500 mb-6">No result yet.</p>
      <Link href="/dashboard/assess" className="inline-flex rounded-2xl bg-zinc-100 text-zinc-950 px-8 py-3 font-semibold hover:bg-white transition">
        Run an assessment →
      </Link>
    </div>
  );

  const bandColor = data.band === "Safe" ? "text-emerald-400" : data.band === "Target" ? "text-amber-400" : "text-red-400";
  const barColor = data.band === "Safe" ? "bg-emerald-400" : data.band === "Target" ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="p-8 max-w-2xl">
      {/* Hero */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4"><Band band={data.band} /></div>
            <div className={`text-6xl font-semibold mb-2 ${bandColor}`}>{data.chance_percent}%</div>
            <h1 className="text-2xl font-semibold">{data.verdict}</h1>
            <p className="mt-1 text-zinc-500">{EMOJI[data.band]} {MSG[data.band]}</p>
            {data.course.course_name && (
              <p className="mt-2 text-sm text-zinc-600">{data.course.course_name} · {data.course.faculty}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/assess" className="text-sm text-zinc-600 hover:text-zinc-300 transition">New →</Link>
          </div>
        </div>
      </div>

      {/* Bar */}
      <Section title="Offer chance">
        <div className="h-3 rounded-full bg-zinc-900 overflow-hidden mb-3">
          <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${Math.max(2, Math.min(100, data.chance_percent))}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-700">
          <span>Reach (&lt;40%)</span><span>Target (40–70%)</span><span>Safe (&gt;70%)</span>
        </div>
        {data.competitiveness.threshold_used != null && (
          <div className="mt-4 flex gap-6 text-sm pt-4 border-t border-zinc-800">
            <span className="text-zinc-600">Threshold: <span className="text-zinc-300">{data.competitiveness.threshold_used}</span></span>
            {data.competitiveness.margin != null && (
              <span className="text-zinc-600">Margin: <span className={data.competitiveness.margin >= 0 ? "text-emerald-400" : "text-red-400"}>
                {data.competitiveness.margin > 0 ? "+" : ""}{data.competitiveness.margin}
              </span></span>
            )}
          </div>
        )}
      </Section>

      {/* Applicant context */}
      {data.applicant_context && (
        <Section title="Real applicant pool · 2024–25">
          <div className="flex items-end gap-3 mb-4">
            <div className="text-4xl font-semibold">Top {100 - data.applicant_context.percentile}<span className="text-xl text-zinc-500">%</span></div>
            <div className="text-sm text-zinc-500 mb-1">of offer holders at this university</div>
          </div>
          <div className="h-2 rounded-full bg-zinc-900 overflow-hidden mb-3">
            <div className="h-full rounded-full bg-gradient-to-r from-zinc-600 to-zinc-300 transition-all duration-1000"
              style={{ width: `${data.applicant_context.percentile}%` }} />
          </div>
          <p className="text-sm text-zinc-400">Your grade profile puts you in the top {100 - data.applicant_context.percentile}% of {data.applicant_context.n} reported offer holders at this university.</p>
          <p className="mt-2 text-xs text-zinc-600">Based on self-reported 2024–25 data. Grades alone don't determine your chances.</p>
        </Section>
      )}

      {/* Checks */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Section title="✅ Passed"><Bullets items={data.checks.passed} /></Section>
        <Section title="⚠️ Concern"><Bullets items={data.checks.failed} /></Section>
      </div>

      {/* Counsellor */}
      <Section title="Admissions analysis">
        <div className="grid grid-cols-2 gap-6">
          <div><div className="text-sm font-medium text-zinc-400 mb-3">Strengths</div><Bullets items={data.counsellor.strengths} /></div>
          <div><div className="text-sm font-medium text-zinc-400 mb-3">Risks</div><Bullets items={data.counsellor.risks} /></div>
          <div className="col-span-2"><div className="text-sm font-medium text-zinc-400 mb-3">What to do next</div><Bullets items={data.counsellor.what_to_do_next} /></div>
        </div>
      </Section>

      {/* PS */}
      {data.ps_analysis && (
        <Section title="Personal statement review">
          <div className="flex items-center gap-3 mb-5">
            <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              data.ps_analysis.scores?.band === "Exceptional" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : data.ps_analysis.scores?.band === "Strong" ? "bg-blue-500/10 border-blue-500/20 text-blue-300"
              : "bg-amber-500/10 border-amber-500/20 text-amber-300"
            }`}>{data.ps_analysis.scores?.band}</span>
            <span className="text-zinc-500">{data.ps_analysis.scores?.weighted_total}/100</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><div className="text-sm font-medium text-zinc-400 mb-3">Strengths</div><Bullets items={data.ps_analysis.strengths?.slice(0,4) || []} /></div>
            <div><div className="text-sm font-medium text-zinc-400 mb-3">Areas to improve</div><Bullets items={[...(data.ps_analysis.risks||[]),...(data.ps_analysis.red_flags||[])].slice(0,4)} /></div>
          </div>
        </Section>
      )}

      <div className="flex gap-4 mt-2">
        <Link href="/dashboard/assess" className="inline-flex rounded-2xl bg-zinc-100 text-zinc-950 px-8 py-4 font-semibold hover:bg-white hover:scale-105 active:scale-95 transition-all">
          Try another →
        </Link>
        <Link href="/dashboard/tracker" className="inline-flex rounded-2xl border border-zinc-800 px-8 py-4 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all">
          View tracker
        </Link>
      </div>
    </div>
  );
}
