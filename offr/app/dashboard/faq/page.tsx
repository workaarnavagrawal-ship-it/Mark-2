"use client";
import { useState } from "react";

const FAQS = [
  { q: "How accurate are the predictions?", a: "offr scores are built on published entry requirements and real 2024–25 self-reported data from over 4,000 applicants. Your grades, personal statement quality, and applicant status are all weighted. It's a strong signal — not a guarantee, but far more grounded than published minimums alone." },
  { q: "What's the difference between Reach, Target and Safe?", a: "Safe (>70%) means you're comfortably above threshold and competitive in the real applicant pool. Target (40–70%) means it could genuinely go either way. Reach (<40%) means there's a significant gap — possible, but exceptional supporting material would be needed." },
  { q: "Why does my personal statement matter?", a: "Our data shows a clear correlation between PS quality and offer rates, particularly at selective universities. Students with stronger statements consistently outperform those with similar grades but weaker ones. offr weights PS impact based on institutional selectivity." },
  { q: "What is the real applicant pool data?", a: "We gathered self-reported offer data from students who applied in 2024–25, across 14 universities. This lets us compare your grades to people who actually received offers — not just the published floor. It's a more honest picture of what admission really looks like." },
  { q: "Is my data secure?", a: "Yes. Your entire profile is stored in Supabase with row-level security — only you can access your data. Your personal statement is never shared or used outside of your own assessments." },
  { q: "Can I use offr for A-Levels as well as IB?", a: "Yes. offr supports both. Your predicted grades are compared against real offer holder profiles for each course." },
  { q: "How does the Offer Tracker work?", a: "Every time you run an assessment, it's saved automatically. You can label each choice (Firm, Insurance, Backup), view your full UCAS picture in one place, and delete or re-run any entry at any time." },
  { q: "What are hidden gems in Explore?", a: "Hidden gems are courses that are genuinely excellent and career-relevant, but less well-known than the obvious options — things like MORSE at Warwick, or Liberal Arts at UCL. They often have lower competition too." },
  { q: "Can I update my profile later?", a: "Yes — go to My Profile anytime and edit your grades, personal statement, or interests. All future assessments will use your updated information." },
  { q: "Is offr free?", a: "Yes, completely. No credit card, no premium tier." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ padding: "52px 56px", maxWidth: "680px" }}>
      <div style={{ marginBottom: "48px" }}>
        <p className="label" style={{ marginBottom: "12px" }}>Support</p>
        <h1 style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "44px", fontWeight: 400, letterSpacing: "-0.025em", color: "var(--t)", marginBottom: "14px" }}>
          Frequently asked questions
        </h1>
        <p style={{ fontSize: "15px", color: "var(--t3)", lineHeight: 1.6 }}>Everything you need to know about how offr works.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ background: "var(--s1)", border: "1px solid var(--b)", borderRadius: "var(--r-card)", overflow: "hidden" }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px", background: "transparent", border: "none",
              cursor: "pointer", textAlign: "left", gap: "16px",
              transition: "background 150ms ease",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--s2)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <span style={{ fontSize: "15px", color: "var(--t)", fontWeight: 400, lineHeight: 1.4, fontFamily: "var(--font-dm, var(--sans))" }}>{faq.q}</span>
              <span style={{ color: "var(--t3)", fontSize: "13px", flexShrink: 0, transition: "transform 200ms", display: "inline-block", transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </button>
            {open === i && (
              <div style={{ padding: "0 24px 20px", borderTop: "1px solid var(--b)" }}>
                <p style={{ fontSize: "14px", color: "var(--t3)", lineHeight: 1.75, paddingTop: "16px" }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
