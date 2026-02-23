"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Course {
  course_id: string;
  course_name: string;
  faculty: string;
  university_id: string;
  degree_type?: string;
}

interface University {
  university_id: string;
  university_name: string;
}

const HIDDEN_GEMS = [
  "MORSE", "Liberal Arts", "PPE", "Human Sciences", "Cognitive Science",
  "Global Health", "Management Science", "Law with", "History & Economics",
  "Computer Science & Philosophy", "Linguistics"
];

const FACULTIES = [
  "Economics & Business", "Law", "Computer Science", "Engineering",
  "Mathematics", "Natural Sciences", "Humanities", "Social Sciences",
  "Medicine & Health", "Arts & Design", "Education", "Architecture"
];

export function ExploreClient({
  interests,
  courses,
  universities,
}: {
  interests: string[];
  courses: Course[];
  universities: University[];
}) {
  const [search, setSearch] = useState("");
  const [activeFaculty, setActiveFaculty] = useState<string | null>(null);
  const [activeUni, setActiveUni] = useState<string | null>(null);
  const [showGems, setShowGems] = useState(false);

  const uniMap = useMemo(() => {
    const m: Record<string, string> = {};
    universities.forEach(u => { m[u.university_id] = u.university_name; });
    return m;
  }, [universities]);

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (search && !c.course_name.toLowerCase().includes(search.toLowerCase()) &&
          !c.faculty?.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeFaculty && c.faculty !== activeFaculty) return false;
      if (activeUni && c.university_id !== activeUni) return false;
      if (showGems && !HIDDEN_GEMS.some(g => c.course_name.includes(g))) return false;
      return true;
    }).slice(0, 50);
  }, [courses, search, activeFaculty, activeUni, showGems]);

  const suggested = useMemo(() => {
    if (!interests.length) return [];
    return courses.filter(c =>
      interests.some(i => c.course_name.toLowerCase().includes(i.toLowerCase()) ||
        c.faculty?.toLowerCase().includes(i.toLowerCase()))
    ).slice(0, 4);
  }, [courses, interests]);

  const isGem = (name: string) => HIDDEN_GEMS.some(g => name.includes(g));

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Explore Courses</h1>
        <p className="text-zinc-500">
          {courses.length > 0 ? `${courses.length} real courses from your database.` : "Loading courses…"}
          {" "}Discover degrees you might not have considered.
        </p>
      </div>

      {/* Suggested */}
      {suggested.length > 0 && (
        <div className="mb-8">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">
            Based on your interests · {interests.join(", ")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {suggested.map(c => (
              <div key={c.course_id} className="rounded-2xl border border-zinc-700 bg-zinc-900/40 p-5 hover:border-zinc-600 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div className="text-base font-semibold leading-snug">{c.course_name}</div>
                  {isGem(c.course_name) && <span className="text-xs text-amber-500 shrink-0 ml-2">✦</span>}
                </div>
                <p className="text-xs text-zinc-500 mb-3">{uniMap[c.university_id] || c.university_id}</p>
                <p className="text-xs text-zinc-600">{c.faculty}</p>
                <Link href={`/dashboard/assess?query=${encodeURIComponent(c.course_name)}&uni=${c.university_id}`}
                  className="mt-3 inline-block text-xs text-zinc-500 hover:text-zinc-300 transition border border-zinc-800 hover:border-zinc-700 rounded-full px-3 py-1">
                  Check chances →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        <input
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          placeholder="Search courses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* University filter */}
        <select
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-base text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
          value={activeUni || ""}
          onChange={e => setActiveUni(e.target.value || null)}>
          <option value="">All universities</option>
          {universities.map(u => (
            <option key={u.university_id} value={u.university_id}>{u.university_name}</option>
          ))}
        </select>

        {/* Faculty tags */}
        <div className="flex flex-wrap gap-2 items-center">
          {FACULTIES.map(f => (
            <button key={f} onClick={() => setActiveFaculty(activeFaculty === f ? null : f)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${activeFaculty === f ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-medium" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"}`}>
              {f}
            </button>
          ))}
          <button onClick={() => setShowGems(v => !v)}
            className={`ml-auto rounded-full border px-3 py-1.5 text-xs transition-all ${showGems ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "border-zinc-800 text-zinc-600 hover:border-zinc-700"}`}>
            ✦ Hidden gems
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {courses.length === 0 && (
          <div className="text-center py-10 text-zinc-600">Loading courses from database…</div>
        )}
        {courses.length > 0 && filtered.length === 0 && (
          <div className="text-center py-10 text-zinc-600">No courses match your filters.</div>
        )}
        {filtered.map(c => (
          <div key={c.course_id} className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-5 py-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base font-medium text-zinc-200">{c.course_name}</span>
                  {isGem(c.course_name) && <span className="text-xs text-amber-500">✦</span>}
                </div>
                <div className="text-sm text-zinc-500">{uniMap[c.university_id] || c.university_id} · {c.faculty}</div>
              </div>
              <Link href={`/dashboard/assess?query=${encodeURIComponent(c.course_name)}&uni=${c.university_id}`}
                className="text-xs text-zinc-600 hover:text-zinc-300 transition border border-zinc-800 hover:border-zinc-700 rounded-full px-3 py-1 shrink-0">
                Check →
              </Link>
            </div>
          </div>
        ))}
        {filtered.length === 50 && (
          <p className="text-center text-xs text-zinc-700 pt-2">Showing first 50 results — use search to narrow down.</p>
        )}
      </div>
    </div>
  );
}