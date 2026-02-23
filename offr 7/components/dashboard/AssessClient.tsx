"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCourseDetail, getCourses, getUniversities, postOfferAssess } from "@/lib/api";
import { saveAssessment } from "@/lib/storage";
import { saveTrackerEntry } from "@/lib/profile";
import type { CourseListItem, OfferAssessRequest, Profile, SubjectEntry, UniversityItem } from "@/lib/types";

function norm(s: string) {
  return (s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function scoreMatch(q: string, n: string) {
  const qn = norm(q), nn = norm(n);
  if (!qn) return 0;
  if (nn === qn) return 100;
  if (nn.startsWith(qn)) return 80;
  if (nn.includes(qn)) return 60;
  const qt = qn.split(" "), nt = new Set(nn.split(" "));
  return qt.filter(t => t && nt.has(t)).length * 8;
}

const inp = "w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-base text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors";

export function AssessClient({ profile, subjects }: { profile: Profile; subjects: SubjectEntry[] }) {
  const router = useRouter();
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [universityId, setUniversityId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [showCourses, setShowCourses] = useState(false);
  const [uniOpen, setUniOpen] = useState(false);
  const [courseDetail, setCourseDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const uniRef = useRef<HTMLDivElement>(null);

  const hl = subjects.filter(s => s.level === "HL");
  const sl = subjects.filter(s => s.level === "SL");
  const al = subjects.filter(s => s.level === "A_LEVEL");

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!uniRef.current?.contains(e.target as Node)) setUniOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    getUniversities().then(u => { setUniversities(u); setUniversityId(u[0]?.university_id || ""); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!universityId) return;
    setLoading(true);
    getCourses(universityId).then(c => { setCourses(c); setLoading(false); }).catch(() => setLoading(false));
  }, [universityId]);

  useEffect(() => {
    if (!courseId) { setCourseDetail(null); return; }
    getCourseDetail(courseId).then(setCourseDetail).catch(() => {});
  }, [courseId]);

  const suggestions = useMemo(() => {
    return courses
      .map(c => ({ c, s: scoreMatch(courseQuery, c.course_name) }))
      .filter(x => courseQuery ? x.s > 0 : true)
      .sort((a, b) => b.s - a.s)
      .slice(0, 10)
      .map(x => x.c);
  }, [courses, courseQuery]);

  const selectedUni = universities.find(u => u.university_id === universityId);

  async function submit() {
    if (!courseId) { setErr("Pick a course first"); return; }
    setErr(""); setSubmitting(true);
    try {
      const payload: OfferAssessRequest = {
        course_id: courseId,
        home_or_intl: profile.home_or_intl,
        curriculum: profile.curriculum,
        ps: (profile.ps_q1 || profile.ps_q2 || profile.ps_q3 || profile.ps_statement) ? {
          format: profile.ps_format || "UCAS_3Q",
          q1: profile.ps_q1, q2: profile.ps_q2, q3: profile.ps_q3,
          statement: profile.ps_statement,
        } : null,
      };

      if (profile.curriculum === "IB") {
        const total = [...hl, ...sl].reduce((s, x) => s + Number(x.predicted_grade), 0) + (profile.core_points || 0);
        payload.ib = {
          core_points: profile.core_points || 0,
          hl: hl.map(x => ({ subject: x.subject, grade: Number(x.predicted_grade) })),
          sl: sl.map(x => ({ subject: x.subject, grade: Number(x.predicted_grade) })),
          total_points: total,
        };
      } else {
        payload.a_levels = { predicted: al.map(x => ({ subject: x.subject, grade: x.predicted_grade })) };
      }

      const res = await postOfferAssess(payload);
      saveAssessment(res);

      // Auto-save to tracker
      await saveTrackerEntry({
        user_id: profile.user_id,
        course_id: courseId,
        course_name: res.course.course_name || courseQuery,
        university_id: universityId,
        university_name: selectedUni?.university_name || universityId,
        band: res.band,
        chance_percent: res.chance_percent,
        result_json: res,
      });

      router.push("/dashboard/result");
    } catch (e: any) {
      setErr(e.message || "Assessment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">Check offer chances</h1>
        <p className="mt-2 text-zinc-500">Your grades and PS are loaded from your profile. Just pick a course.</p>
      </div>

      {/* Profile summary */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 px-5 py-4">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Using your profile</div>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
          <span>{profile.curriculum === "IB" ? "IB Diploma" : "A Levels"}</span>
          <span>·</span>
          <span>{profile.home_or_intl === "intl" ? "International" : "Domestic"}</span>
          {profile.curriculum === "IB" && (
            <>
              <span>·</span>
              <span>{[...hl, ...sl].reduce((s,x) => s + Number(x.predicted_grade), 0) + (profile.core_points||0)} points predicted</span>
            </>
          )}
          {profile.curriculum === "A_LEVELS" && (
            <>
              <span>·</span>
              <span>{al.map(s => s.predicted_grade).join(", ")}</span>
            </>
          )}
          <span>·</span>
          <span className={(profile.ps_q1||profile.ps_statement) ? "text-emerald-400" : "text-zinc-600"}>
            {(profile.ps_q1||profile.ps_statement) ? "✓ PS included" : "No PS saved"}
          </span>
        </div>
      </div>

      {/* University picker */}
      <div className="space-y-4 mb-6" ref={uniRef}>
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">University</label>
          <button onClick={() => setUniOpen(v => !v)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-4 text-base flex items-center justify-between hover:border-zinc-700 transition-colors">
            <span className="text-zinc-100">{selectedUni?.university_name || "Select a university"}</span>
            <span className={`text-zinc-500 transition-transform ${uniOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
          {uniOpen && (
            <div className="mt-1 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 z-10 relative">
              <div className="max-h-64 overflow-auto">
                {universities.map(u => (
                  <button key={u.university_id}
                    onClick={() => { setUniversityId(u.university_id); setUniOpen(false); setCourseId(""); setCourseQuery(""); }}
                    className={`w-full text-left px-5 py-3 text-sm border-b border-zinc-900 hover:bg-zinc-900/60 transition ${universityId === u.university_id ? "bg-zinc-900/40" : ""}`}>
                    <div className="text-zinc-100">{u.university_name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Course</label>
          <input className={inp}
            placeholder={loading ? "Loading courses…" : "Search — e.g. economics, law, cs…"}
            value={courseQuery}
            onChange={e => { setCourseQuery(e.target.value); setShowCourses(true); }}
            onFocus={() => setShowCourses(true)} />
          {showCourses && (
            <div className="mt-1 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 z-10 relative">
              <div className="max-h-64 overflow-auto">
                {suggestions.map(c => (
                  <button key={c.course_id}
                    onClick={() => { setCourseId(c.course_id); setCourseQuery(c.course_name); setShowCourses(false); }}
                    className={`w-full text-left px-5 py-3 text-sm border-b border-zinc-900 hover:bg-zinc-900/60 transition ${courseId === c.course_id ? "bg-zinc-900/40" : ""}`}>
                    <div className="text-zinc-100">{c.course_name}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{c.faculty}</div>
                  </button>
                ))}
                {!suggestions.length && <div className="px-5 py-4 text-sm text-zinc-600">No matches</div>}
              </div>
            </div>
          )}
          {courseDetail?.typical_offer && (
            <div className="mt-2 px-4 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-sm text-zinc-500">
              Typical offer: <span className="text-zinc-300">{courseDetail.typical_offer}</span>
            </div>
          )}
        </div>
      </div>

      {err && <p className="mb-4 text-sm text-red-400">{err}</p>}

      {submitting && (
        <div className="mb-4 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
          Analysing your profile…
        </div>
      )}

      <button onClick={submit} disabled={!courseId || submitting}
        className="w-full rounded-2xl bg-zinc-100 text-zinc-950 py-4 text-base font-semibold hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-40 transition-all">
        {submitting ? "Assessing…" : "Get my prediction 🎯"}
      </button>
    </div>
  );
}
