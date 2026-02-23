"use client";
import { useState } from "react";

const FAQS = [
  { q: "How accurate are the predictions?", a: "offr scores are built on published entry requirements combined with real 2024–25 self-reported data from over 4,000 applicants. Your grades, personal statement quality, and applicant status are all factored in. It's a strong signal — not a guarantee." },
  { q: "What's the difference between Reach, Target and Safe?", a: "Safe (>70%) means you're comfortably above threshold and competitive in the real applicant pool. Target (40–70%) means it could genuinely go either way. Reach (<40%) means there's a significant gap to close." },
  { q: "Why does my personal statement matter?", a: "Our data shows a clear correlation between personal statement quality and offer rates — especially at selective universities. Students with stronger statements consistently outperform those with similar grades who have weaker ones." },
  { q: "What is the real applicant pool data?", a: "We collected self-reported offer data from 4,000+ students who applied in 2024–25. We use this to show how your grades compare to people who actually received offers — not just the published minimum. It gives a much more honest picture." },
  { q: "Is my personal statement stored securely?", a: "Yes. Your profile is stored with row-level security — only you can access your data. Your PS is never shared or used for any other purpose." },
  { q: "Can I use offr for A-Levels as well as IB?", a: "Yes. offr supports both. Your predicted grades are compared against real offer holder profiles for each course." },
  { q: "How does the offer tracker work?", a: "Every time you run an assessment, it's automatically saved to your tracker. You can label each choice (Firm, Insurance, Backup) and view your full UCAS picture in one place. You can also delete or re-run any entry." },
  { q: "What are hidden gems on the explore page?", a: "Hidden gems are courses that are genuinely excellent and career-relevant but less well-known. Things like MORSE, Cognitive Science, or Liberal Arts. They often have less competition too." },
  { q: "Can I update my grades or PS later?", a: "Yes — go to My Profile anytime and edit. All future assessments will automatically use your updated information." },
  { q: "Is offr free?", a: "Yes, completely free. No credit card, no premium tier." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">FAQs</h1>
        <p className="text-zinc-500">Everything you need to know about how offr works.</p>
      </div>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
              <span className="text-base font-medium text-zinc-200 pr-4">{faq.q}</span>
              <span className={`text-zinc-500 transition-transform duration-200 shrink-0 ${open === i ? "rotate-180" : ""}`}>▾</span>
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-base text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-4">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}