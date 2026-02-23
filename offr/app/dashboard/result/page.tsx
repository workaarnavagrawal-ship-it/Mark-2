"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAssessment } from "@/lib/storage";
import type { OfferAssessResponse } from "@/lib/types";

const BAND: Record<string, { bg: string; color: string; border: string; barColor: string }> = {
  Safe: { bg: "var(--safe-bg)", color: "var(--safe-t)", border: "var(--safe-b)", barColor: "var(--safe-t)" },
  Target: { bg: "var(--tgt-bg)", color: "var(--tgt-t)", border: "var(--tgt-b)", barColor: "var(--tgt-t)" },
  Reach: { bg: "var(--rch-bg)", color: "var(--rch-t)", border: "var(--rch-b)", barColor: "var(--rch-t)" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "12px" }}>
      <p className="label" style={{ marginBottom: "16px" }}>{title}</p>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items?.length) return <p style={{ color: "var(--t3)", fontSize: "14px" }}>—</p>;
  return (
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
      {items.map((x, i) => (
        <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px", color: "var(--t2)", lineHeight: 1.6 }}>
          <span style={{ color: "var(--b-strong)", flexShrink: 0, marginTop: "2px" }}>·</span>
          {x}
        </li>
      ))}
    </ul>
  );
}

export default function ResultPage() {
  const [data, setData] = useState<OfferAssessResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); setData(loadAssessment()); }, []);
  if (!mounted) return null;

  if (!data) return (
    <div style={{ padding: "52px 56px" }}>
      <p style={{ color: "var(--t3)", fontSize: "14px", marginBottom: "24px" }}>No result yet.</p>
      <Link href="/dashboard/assess" className="btn-primary">Run an assessment →</Link>
    </div>
  );

  const bs = BAND[data.band] || BAND.Reach;
  const MSG: Record<string, string> = {
    Safe: "You're comfortably above threshold and competitive in the real applicant pool.",
    Target: "It genuinely could go either way. Your PS and interview (if applicable) will matter.",
    Reach: "There's a meaningful gap to close. Strong elsewhere in your application matters here.",
  };

  return (
    <div style={{ padding: "52px 56px", maxWidth: "760px" }}>
      {/* Hero */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <span className="pill" style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.border}`, marginBottom: "20px", display: "inline-flex" }}>{data.band}</span>
            <p style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "72px", fontWeight: 400, color: "var(--t)", lineHeight: 1, marginBottom: "12px", letterSpacing: "-0.03em" }}>
              {data.chance_percent}<span style={{ fontSize: "36px", color: "var(--t3)" }}>%</span>
            </p>
            <p style={{ fontSize: "16px", color: "var(--t2)", marginBottom: "6px", fontFamily: "var(--font-garamond, var(--serif))" }}>{data.verdict}</p>
            {data.course.course_name && <p style={{ fontSize: "13px", color: "var(--t3)" }}>{data.course.course_name} · {data.course.faculty}</p>}
          </div>
          <Link href="/dashboard/assess" style={{ fontSize: "13px", color: "var(--t3)", textDecoration: "none", marginTop: "4px" }}>New →</Link>
        </div>

        <p style={{ fontSize: "14px", color: "var(--t3)", marginBottom: "20px", lineHeight: 1.6 }}>{MSG[data.band]}</p>

        {/* Bar */}
        <div style={{ height: "4px", borderRadius: "2px", background: "var(--s3)", overflow: "hidden", marginBottom: "8px" }}>
          <div style={{ height: "100%", borderRadius: "2px", background: bs.barColor, width: `${Math.max(2, Math.min(100, data.chance_percent))}%`, transition: "width 1s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--t3)" }}>
          <span>Reach &lt;40%</span><span>Target 40–70%</span><span>Safe &gt;70%</span>
        </div>
      </div>

      {/* Applicant context */}
      {data.applicant_context && (
        <Section title="Real applicant pool · 2024–25">
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "40px", color: "var(--t)", fontWeight: 400 }}>
              Top {100 - data.applicant_context.percentile}%
            </span>
            <span style={{ fontSize: "14px", color: "var(--t3)" }}>of offer holders</span>
          </div>
          <div style={{ height: "3px", borderRadius: "2px", background: "var(--s3)", overflow: "hidden", marginBottom: "12px" }}>
            <div style={{ height: "100%", borderRadius: "2px", background: "var(--acc)", width: `${data.applicant_context.percentile}%`, opacity: 0.6 }} />
          </div>
          <p style={{ fontSize: "14px", color: "var(--t3)", lineHeight: 1.6 }}>
            Your grade profile ranks in the top {100 - data.applicant_context.percentile}% of {data.applicant_context.n} self-reported offer holders at this university from 2024–25.
          </p>
        </Section>
      )}

      {/* Checks */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <Section title="Passed checks"><Bullets items={data.checks.passed} /></Section>
        <Section title="Areas of concern"><Bullets items={data.checks.failed} /></Section>
      </div>

      {/* Counsellor */}
      <Section title="Admissions analysis">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "24px" }}>
          <div>
            <p style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Strengths</p>
            <Bullets items={data.counsellor.strengths} />
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Risks</p>
            <Bullets items={data.counsellor.risks} />
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--b)", paddingTop: "20px" }}>
          <p style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>What to do next</p>
          <Bullets items={data.counsellor.what_to_do_next} />
        </div>
      </Section>

      {/* PS */}
      {data.ps_analysis && (
        <Section title="Personal statement">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span className="pill" style={{ background: "var(--s3)", color: "var(--t2)", border: "1px solid var(--b)" }}>{data.ps_analysis.scores?.band}</span>
            <span style={{ fontSize: "14px", color: "var(--t3)" }}>{data.ps_analysis.scores?.weighted_total}/100</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <p style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Strengths</p>
              <Bullets items={data.ps_analysis.strengths?.slice(0, 3) || []} />
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>To improve</p>
              <Bullets items={[...(data.ps_analysis.risks || []), ...(data.ps_analysis.red_flags || [])].slice(0, 3)} />
            </div>
          </div>
        </Section>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <Link href="/dashboard/assess" className="btn-primary">Try another →</Link>
        <Link href="/dashboard/tracker" className="btn-ghost">View tracker</Link>
      </div>
    </div>
  );
}
