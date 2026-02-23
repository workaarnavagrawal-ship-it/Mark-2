"use client";

import { useState } from "react";
import Link from "next/link";

const COURSES = [
  { name: "PPE", full: "Philosophy, Politics & Economics", unis: ["Oxford","Warwick","UCL","Durham"], vibe: "The classic route to politics, journalism or finance.", tags: ["Politics","Economics","Philosophy"], hidden: false },
  { name: "Liberal Arts", full: "Liberal Arts & Sciences", unis: ["UCL","King's College London","Exeter"], vibe: "Design your own degree. Mix humanities, social science and natural science.", tags: ["History","Philosophy","Sociology"], hidden: true },
  { name: "MORSE", full: "Maths, Operational Research, Stats & Economics", unis: ["Warwick"], vibe: "One of the most employable degrees in the UK. Maths meets the real world.", tags: ["Mathematics","Economics"], hidden: true },
  { name: "Human Sciences", full: "Human Sciences", unis: ["Oxford","UCL"], vibe: "Biology, psychology, anthropology and evolution combined.", tags: ["Biology","Psychology"], hidden: true },
  { name: "Management", full: "Management with Finance/Marketing", unis: ["LSE","Bath","Warwick"], vibe: "Not MBA. Proper academic business with quantitative edge.", tags: ["Business","Economics","Mathematics"], hidden: false },
  { name: "International Relations", full: "International Relations", unis: ["LSE","Warwick","St Andrews","Edinburgh"], vibe: "Geopolitics, diplomacy, global economics. Great for law or international careers.", tags: ["Politics","History","Economics"], hidden: false },
  { name: "Cognitive Science", full: "Cognitive Science", unis: ["Edinburgh","Sussex"], vibe: "Brain, mind, AI and language. One of the most underrated degrees.", tags: ["Psychology","Computer Science","Philosophy"], hidden: true },
  { name: "History & Economics", full: "History & Economics", unis: ["LSE","Warwick","Durham"], vibe: "More analytical than straight history, more contextual than straight econ.", tags: ["History","Economics"], hidden: false },
  { name: "Computer Science & Philosophy", full: "Computer Science & Philosophy", unis: ["Oxford","Edinburgh","King's College London"], vibe: "Ethics, AI and logic. Rare combination that stands out.", tags: ["Computer Science","Philosophy"], hidden: true },
  { name: "Biomedical Sciences", full: "Biomedical Sciences", unis: ["UCL","Imperial","King's College London","Edinburgh"], vibe: "Medicine-adjacent without the clinical commitment. Strong for research.", tags: ["Biology","Chemistry"], hidden: false },
  { name: "Architecture", full: "Architecture (B.Arch / BA)", unis: ["UCL","Edinburgh","Manchester","Bath"], vibe: "Art meets engineering meets planning. A lifestyle degree.", tags: ["Art & Design","Mathematics"], hidden: false },
  { name: "Law with another subject", full: "Law with French/German/Philosophy/Criminology", unis: ["UCL","Edinburgh","Warwick","Durham"], vibe: "Differentiates you in training contract apps. Broader skills.", tags: ["Law"], hidden: true },
  { name: "Global Health", full: "Global Health & Social Medicine", unis: ["King's College London"], vibe: "Medicine's policy and social side. Underrated and unusual.", tags: ["Biology","Sociology"], hidden: true },
  { name: "Economics & Politics", full: "Economics & Politics", unis: ["Warwick","Bristol","Edinburgh","Bath"], vibe: "Everything you need for policy, consultancy or finance.", tags: ["Economics","Politics"], hidden: false },
  { name: "Linguistics", full: "Linguistics", unis: ["Cambridge","Edinburgh","UCL"], vibe: "Language, cognition, structure. Massively underrated for tech careers.", tags: ["Philosophy","Computer Science"], hidden: true },
  { name: "Management Science", full: "Management Science / Decision Science", unis: ["Warwick","LSE","Bath"], vibe: "Quantitative business. Loved by consulting firms.", tags: ["Mathematics","Business","Economics"], hidden: true },
];

const ALL_TAGS = [...new Set(COURSES.flatMap(c => c.tags))].sort();

export function ExploreClient({ interests }: { interests: string[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = COURSES.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.full.toLowerCase().includes(search.toLowerCase()) &&
        !c.vibe.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTag && !c.tags.includes(activeTag)) return false;
    if (!showHidden && c.hidden) return false;
    return true;
  });

  const suggested = interests.length > 0
    ? COURSES.filter(c => c.tags.some(t => interests.includes(t)))
    : [];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Explore Courses</h1>
        <p className="text-zinc-500">Discover degrees you might not have considered. Some of the best courses are the least obvious.</p>
      </div>

      {/* Suggested based on interests */}
      {suggested.length > 0 && (
        <div className="mb-8">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">
            Based on your interests · {interests.join(", ")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {suggested.slice(0, 4).map(c => (
              <div key={c.name} className="rounded-2xl border border-zinc-700 bg-zinc-900/40 p-5 hover:border-zinc-600 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-base font-semibold">{c.name}</div>
                  {c.hidden && <span className="text-xs text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">Hidden gem</span>}
                </div>
                <p className="text-xs text-zinc-500 mb-3">{c.full}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{c.vibe}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.unis.slice(0,3).map(u => (
                    <span key={u} className="text-xs border border-zinc-800 rounded-full px-2 py-0.5 text-zinc-600">{u}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="mb-6 space-y-4">
        <input
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          placeholder="Search courses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 items-center">
          {ALL_TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${activeTag === tag ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-medium" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"}`}>
              {tag}
            </button>
          ))}
          <button onClick={() => setShowHidden(v => !v)}
            className={`ml-auto rounded-full border px-3 py-1.5 text-xs transition-all ${showHidden ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "border-zinc-800 text-zinc-600 hover:border-zinc-700"}`}>
            {showHidden ? "✦ Showing hidden gems" : "Show hidden gems"}
          </button>
        </div>
      </div>

      {/* All courses */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-zinc-600">No courses match your filters.</div>
        )}
        {filtered.map(c => (
          <div key={c.name} className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  {c.hidden && <span className="text-xs text-amber-500 border border-amber-500/20 bg-amber-500/10 rounded-full px-2 py-0.5">Hidden gem ✦</span>}
                </div>
                <p className="text-sm text-zinc-500 mb-2">{c.full}</p>
                <p className="text-base text-zinc-400">{c.vibe}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              {c.unis.map(u => (
                <span key={u} className="text-xs border border-zinc-800 rounded-full px-2.5 py-1 text-zinc-500">{u}</span>
              ))}
              <Link href={`/dashboard/assess?query=${encodeURIComponent(c.full)}`}
                className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition border border-zinc-800 hover:border-zinc-700 rounded-full px-3 py-1">
                Check my chances →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
