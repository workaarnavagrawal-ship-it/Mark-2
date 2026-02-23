"use client";
import { useState } from "react";

const FAQS = [
  { q: "How accurate are the predictions?", a: "offr uses published university entry requirements combined with real 2024–25 self-reported applicant data from over 4,000 students. Our scoring weights your grades, personal statement quality, and whether you're an international or domestic applicant. It's a strong signal, not a guarantee." },
  { q: "What's the difference between Reach, Target and Safe?", a: "Safe (>70%) means you're comfortably above threshold and competitive in the real applicant pool. Target (40–70%) means it genuinely could go either way. Reach (<40%) means there's a significant gap — possible, but you'd need an exceptional PS or other factors in your favour." },
  { q: "Why does my personal statement affect the score so much?", a: "At top universities (Oxford, Cambridge, LSE, Imperial, UCL), admissions tutors read every statement carefully. A weak PS is often why strong-grade applicants get rejected. offr weights PS impact based on the selectivity of the university — lighter for Bath or QMUL, heavier for the top five." },
  { q: "What is the real applicant pool data?", a: "We collected self-reported offer data from students who applied in 2024–25, across 14 universities. We use this to show you how your grades compare to real people who received offers — not just the official minimum. This gives you a much more honest picture." },
  { q: "Is my personal statement stored securely?", a: "Yes. Your entire profile is stored in Supabase with row-level security — only you can access your data. Your PS is never shared or used for training purposes." },
  { q: "Can I use offr for A-Levels as well as IB?", a: "Yes. offr supports both. A-Level scoring compares your predicted grades against the typical offer published for each course." },
  { q: "How do I save multiple UCAS choices?", a: "Every time you run an assessment, it's automatically saved to your Offer Tracker. You can label each choice (Firm, Insurance, Backup) and view your full UCAS picture in one place." },
  { q: "What does 'hidden gem' mean in Explore?", a: "Hidden gems are courses that are genuinely excellent and career-relevant but less well-known than the obvious options. Things like MORSE at Warwick, Cognitive Science at Edinburgh, or Liberal Arts at UCL. They often have lower competition too." },
  { q: "Can I update my grades or PS later?", a: "Yes — go to My Profile anytime and edit. All future assessments will use your updated information automatically." },
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
            <button
              onClick={() => setOpen(open === i ? null : i)}
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
