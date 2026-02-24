"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCourseDetail, getCourses } from "@/lib/api";
import type { CourseDetail, CourseListItem } from "@/lib/types";

// ─── Curated courses (vibe + tags + hidden gem flag) ──────────────────────────
const CURATED: CuratedMeta[] = [
  { full: "Philosophy, Politics & Economics", short: "PPE", vibe: "The classic route to politics, journalism or finance.", tags: ["Politics", "Economics", "Philosophy"], hidden: false },
  { full: "Liberal Arts & Sciences", short: "Liberal Arts", vibe: "Design your own degree. Mix humanities, social science and natural science.", tags: ["History", "Philosophy", "Sociology"], hidden: true },
  { full: "Maths, Operational Research, Stats & Economics", short: "MORSE", vibe: "One of the most employable degrees in the UK. Maths meets the real world.", tags: ["Mathematics", "Economics"], hidden: true },
  { full: "Human Sciences", short: "Human Sciences", vibe: "Biology, psychology, anthropology and evolution combined.", tags: ["Biology", "Psychology"], hidden: true },
  { full: "Management", short: "Management", vibe: "Not MBA. Proper academic business with quantitative edge.", tags: ["Business", "Economics", "Mathematics"], hidden: false },
  { full: "International Relations", short: "IR", vibe: "Geopolitics, diplomacy, global economics. Great for law or international careers.", tags: ["Politics", "History", "Economics"], hidden: false },
  { full: "Cognitive Science", short: "Cognitive Science", vibe: "Brain, mind, AI and language. One of the most underrated degrees.", tags: ["Psychology", "Computer Science", "Philosophy"], hidden: true },
  { full: "History & Economics", short: "History & Econ", vibe: "More analytical than straight history, more contextual than straight econ.", tags: ["History", "Economics"], hidden: false },
  { full: "Computer Science & Philosophy", short: "CS & Philosophy", vibe: "Ethics, AI and logic. Rare combination that stands out.", tags: ["Computer Science", "Philosophy"], hidden: true },
  { full: "Biomedical Sciences", short: "Biomedical Sciences", vibe: "Medicine-adjacent without the clinical commitment. Strong for research.", tags: ["Biology", "Chemistry"], hidden: false },
  { full: "Architecture", short: "Architecture", vibe: "Art meets engineering meets planning. A lifestyle degree.", tags: ["Art & Design", "Mathematics"], hidden: false },
  { full: "Global Health & Social Medicine", short: "Global Health", vibe: "Medicine's policy and social side. Underrated and unusual.", tags: ["Biology", "Sociology"], hidden: true },
  { full: "Economics & Politics", short: "Economics & Politics", vibe: "Everything you need for policy, consultancy or finance.", tags: ["Economics", "Politics"], hidden: false },
  { full: "Linguistics", short: "Linguistics", vibe: "Language, cognition, structure. Massively underrated for tech careers.", tags: ["Philosophy", "Computer Science"], hidden: true },
  { full: "Management Science", short: "Management Science", vibe: "Quantitative business. Loved by consulting firms.", tags: ["Mathematics", "Business", "Economics"], hidden: true },
  { full: "War Studies", short: "War Studies", vibe: "Conflict, security, strategy. The world's leading department for it.", tags: ["Politics", "History"], hidden: true },
  { full: "Political Economy", short: "Political Economy", vibe: "Where markets and institutions meet. Rare and sharp.", tags: ["Economics", "Politics"], hidden: true },
  { full: "International Development", short: "Intl Development", vibe: "Global inequality, aid, sustainability. Strong for NGOs and policy.", tags: ["Politics", "Sociology"], hidden: true },
  { full: "Social Sciences", short: "Social Sciences", vibe: "Systems, society, institutions. Flexible and underrated.", tags: ["Sociology", "Politics"], hidden: true },
  { full: "Data Analytics for Business & Finance", short: "Data Analytics", vibe: "Data meets finance. Loved by quant-focused banks and consultancies.", tags: ["Mathematics", "Business", "Economics"], hidden: true },
  { full: "Culture Media & Creative Industries", short: "CMCI", vibe: "The business of art, film, fashion and music. Rare and creative.", tags: ["Art & Design", "Business"], hidden: true },
];

interface CuratedMeta {
  full: string;
  short: string;
  vibe: string;
  tags: string[];
  hidden: boolean;
}

interface UniEntry {
  university_id: string;
  university_name: string;
  course_id: string;
  typical_offer?: string;
}

interface GroupedCourse {
  course_name: string;
  degree_type: string;
  faculty: string;
  unis: UniEntry[];
  // Enriched from curated
  short_name?: string;
  vibe?: string;
  tags?: string[];
  hidden?: boolean;
}

function normName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchCurated(courseName: string): CuratedMeta | undefined {
  const cn = normName(courseName);
  return CURATED.find(c => {
    const cf = normName(c.full);
    return cn === cf || cn.startsWith(cf) || cn.includes(cf) || cf.includes(cn);
  });
}

function groupCourses(raw: CourseListItem[]): GroupedCourse[] {
  const map = new Map<string, GroupedCourse>();
  for (const c of raw) {
    const key = c.course_name;
    if (!map.has(key)) {
      const curated = matchCurated(c.course_name);
      map.set(key, {
        course_name: c.course_name,
        degree_type: c.degree_type || "",
        faculty: c.faculty || "",
        unis: [],
        short_name: curated?.short,
        vibe: curated?.vibe,
        tags: curated?.tags,
        hidden: curated?.hidden,
      });
    }
    map.get(key)!.unis.push({
      university_id: c.university_id,
      university_name: c.university_name || c.university_id,
      course_id: c.course_id,
      typical_offer: c.typical_offer,
    });
  }
  return [...map.values()];
}

const ALL_TAGS = [...new Set(CURATED.flatMap(c => c.tags))].sort();

function parseSignals(text: string): string[] {
  if (!text) return [];
  return text
    .split(/[;.\n]+/)
    .map(s => s.replace(/^[-•\s]+/, "").trim())
    .filter(s => s.length > 4)
    .slice(0, 6);
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function CourseModal({ course, onClose }: { course: GroupedCourse; onClose: () => void }) {
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!course.unis[0]) return;
    setLoadingDetail(true);
    getCourseDetail(course.unis[0].course_id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false));
  }, [course]);

  const signals = detail?.ps_expected_signals ? parseSignals(detail.ps_expected_signals) : [];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />

      {/* Panel */}
      <div
        style={{
          position: "relative", zIndex: 1,
          background: "var(--s1)", border: "1px solid var(--b)",
          borderRadius: "20px", padding: "32px",
          width: "100%", maxWidth: "600px",
          maxHeight: "85vh", overflowY: "auto",
          animation: "modalIn 0.2s ease",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            {course.hidden && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "11px", color: "var(--acc)", background: "rgba(232,223,200,0.08)", border: "1px solid rgba(232,223,200,0.2)", borderRadius: "100px", padding: "3px 10px" }}>
                ✦ Hidden gem
              </div>
            )}
            <h2 style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "26px", fontWeight: 400, color: "var(--t)", lineHeight: 1.2, marginBottom: "6px" }}>
              {course.short_name || course.course_name}
            </h2>
            {course.short_name && (
              <p style={{ fontSize: "13px", color: "var(--t3)" }}>{course.course_name}</p>
            )}
            <p style={{ fontSize: "12px", color: "var(--t3)", marginTop: "4px" }}>
              {course.degree_type}{course.faculty ? ` · ${course.faculty}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--b)", background: "transparent", color: "var(--t3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
          >
            ×
          </button>
        </div>

        {/* About */}
        {course.vibe && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "11px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>About this course</p>
            <p style={{ fontSize: "15px", color: "var(--t2)", lineHeight: 1.65 }}>{course.vibe}</p>
          </div>
        )}

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "24px" }}>
            {course.tags.map(t => (
              <span key={t} style={{ fontSize: "11px", border: "1px solid var(--b)", borderRadius: "100px", padding: "3px 10px", color: "var(--t3)" }}>{t}</span>
            ))}
          </div>
        )}

        {/* What admissions looks for */}
        {(loadingDetail || signals.length > 0) && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "11px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>What admissions looks for</p>
            {loadingDetail ? (
              <p style={{ fontSize: "13px", color: "var(--t3)" }}>Loading…</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {signals.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", color: "var(--t2)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--t3)", flexShrink: 0 }}>·</span>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Universities */}
        <div>
          <p style={{ fontSize: "11px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
            Universities offering this course · {course.unis.length}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {course.unis.map(u => (
              <div
                key={u.course_id}
                style={{
                  background: "var(--s2)", border: "1px solid var(--b)",
                  borderRadius: "12px", padding: "14px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", color: "var(--t)", fontWeight: 500, marginBottom: "3px" }}>{u.university_name}</p>
                  {u.typical_offer && (
                    <p style={{ fontSize: "12px", color: "var(--t3)", lineHeight: 1.4 }}>
                      {u.typical_offer.length > 60 ? u.typical_offer.slice(0, 60) + "…" : u.typical_offer}
                    </p>
                  )}
                </div>
                <Link
                  href={`/dashboard/assess?query=${encodeURIComponent(course.course_name)}`}
                  style={{
                    flexShrink: 0, fontSize: "12px", color: "var(--t3)",
                    border: "1px solid var(--b)", borderRadius: "100px",
                    padding: "5px 12px", textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--t)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--b-strong)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--t3)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--b)"; }}
                >
                  Check chances →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, onClick }: { course: GroupedCourse; onClick: () => void }) {
  const isHidden = !!course.hidden;
  const uniCount = course.unis.length;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: "16px",
        border: isHidden ? "1px solid rgba(232,223,200,0.25)" : "1px solid var(--b)",
        background: isHidden ? "rgba(232,223,200,0.04)" : "var(--s1)",
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        boxShadow: isHidden ? "0 0 24px rgba(232,223,200,0.06)" : "none",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = isHidden ? "rgba(232,223,200,0.4)" : "var(--b-strong)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = isHidden ? "rgba(232,223,200,0.25)" : "var(--b)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Badge row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        {isHidden ? (
          <span style={{ fontSize: "10px", color: "var(--acc)", background: "rgba(232,223,200,0.08)", border: "1px solid rgba(232,223,200,0.2)", borderRadius: "100px", padding: "2px 8px", letterSpacing: "0.04em" }}>
            ✦ Hidden gem
          </span>
        ) : (
          <span style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {course.degree_type || "Degree"}
          </span>
        )}
        <span style={{ fontSize: "11px", color: "var(--t3)" }}>
          {uniCount} {uniCount === 1 ? "uni" : "unis"}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--t)", marginBottom: "4px", lineHeight: 1.3 }}>
        {course.short_name || course.course_name}
      </h3>
      {course.short_name && (
        <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "8px" }}>{course.course_name}</p>
      )}

      {/* Vibe */}
      {course.vibe && (
        <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.55, marginBottom: "12px" }}>{course.vibe}</p>
      )}

      {/* Faculty (for non-curated) */}
      {!course.vibe && course.faculty && (
        <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "12px" }}>{course.faculty}</p>
      )}

      {/* Tags */}
      {course.tags && course.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
          {course.tags.map(t => (
            <span key={t} style={{ fontSize: "10px", border: "1px solid var(--b)", borderRadius: "100px", padding: "2px 8px", color: "var(--t3)" }}>{t}</span>
          ))}
        </div>
      )}

      {/* University pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {course.unis.slice(0, 4).map(u => (
          <span key={u.university_id} style={{ fontSize: "10px", border: "1px solid var(--b)", borderRadius: "100px", padding: "2px 8px", color: "var(--t3)" }}>
            {u.university_name.replace("University of ", "").replace(" University", "").replace("London School of Economics and Political Science", "LSE")}
          </span>
        ))}
        {course.unis.length > 4 && (
          <span style={{ fontSize: "10px", color: "var(--t3)" }}>+{course.unis.length - 4} more</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ExploreClient({ interests }: { interests: string[] }) {
  const [allCourses, setAllCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [selected, setSelected] = useState<GroupedCourse | null>(null);

  useEffect(() => {
    getCourses()
      .then(setAllCourses)
      .catch(() => setAllCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => groupCourses(allCourses), [allCourses]);

  const suggested = useMemo(() => {
    if (!interests.length || !grouped.length) return [];
    return grouped.filter(c => c.tags?.some(t => interests.includes(t)));
  }, [grouped, interests]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return grouped.filter(c => {
      if (showHiddenOnly && !c.hidden) return false;
      if (activeTag && !c.tags?.includes(activeTag)) return false;
      if (q) {
        const hay = [c.course_name, c.short_name || "", c.vibe || "", c.faculty || "", ...(c.tags || [])].join(" ").toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [grouped, search, activeTag, showHiddenOnly]);

  const hiddenCount = grouped.filter(c => c.hidden).length;

  return (
    <div style={{ padding: "48px 48px 80px", maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <p className="label" style={{ marginBottom: "10px" }}>Course discovery</p>
        <h1 style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "40px", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--t)", marginBottom: "10px" }}>
          Find a Course
        </h1>
        <p style={{ fontSize: "14px", color: "var(--t3)", lineHeight: 1.6 }}>
          {loading
            ? "Loading courses…"
            : `${grouped.length} courses across ${new Set(allCourses.map(c => c.university_id)).size} universities · ${hiddenCount} hidden gems`
          }
        </p>
      </div>

      {/* Suggested */}
      {!loading && suggested.length > 0 && !search && !activeTag && (
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "14px" }}>
            Based on your interests · {interests.join(", ")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {suggested.slice(0, 4).map(c => (
              <CourseCard key={c.course_name} course={c} onClick={() => setSelected(c)} />
            ))}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          style={{
            width: "100%", background: "var(--s1)", border: "1px solid var(--b)",
            borderRadius: "12px", padding: "13px 16px",
            fontSize: "14px", color: "var(--t)", outline: "none",
            transition: "border-color 0.15s",
          }}
          placeholder="Search any course — e.g. economics, architecture, war studies…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--b-strong)"}
          onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--b)"}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{
                borderRadius: "100px", border: "1px solid",
                borderColor: activeTag === tag ? "var(--t)" : "var(--b)",
                background: activeTag === tag ? "var(--t)" : "transparent",
                color: activeTag === tag ? "var(--bg)" : "var(--t3)",
                padding: "5px 12px", fontSize: "12px", cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tag}
            </button>
          ))}
          <button
            onClick={() => setShowHiddenOnly(v => !v)}
            style={{
              marginLeft: "auto", borderRadius: "100px", border: "1px solid",
              borderColor: showHiddenOnly ? "rgba(232,223,200,0.4)" : "var(--b)",
              background: showHiddenOnly ? "rgba(232,223,200,0.08)" : "transparent",
              color: showHiddenOnly ? "var(--acc)" : "var(--t3)",
              padding: "5px 12px", fontSize: "12px", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {showHiddenOnly ? "✦ Showing hidden gems" : "✦ Hidden gems"}
          </button>
        </div>
      </div>

      {/* Results count */}
      {(search || activeTag || showHiddenOnly) && !loading && (
        <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "16px" }}>
          {filtered.length} {filtered.length === 1 ? "course" : "courses"} found
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: "16px", border: "1px solid var(--b)", background: "var(--s1)", padding: "20px", height: "120px", opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Course grid */}
      {!loading && (
        <>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--t3)", fontSize: "14px" }}>
              No courses match your filters.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {filtered.map(c => (
              <CourseCard key={c.course_name} course={c} onClick={() => setSelected(c)} />
            ))}
          </div>
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <CourseModal course={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
