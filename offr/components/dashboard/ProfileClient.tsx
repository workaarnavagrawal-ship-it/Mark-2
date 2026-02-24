"use client";

import { useState } from "react";
import { upsertProfile, upsertSubjects } from "@/lib/profile";
import type { Profile, SubjectEntry } from "@/lib/types";

const INTERESTS = [
  "Economics","Law","Computer Science","Medicine","Engineering","Mathematics",
  "History","Philosophy","Politics","Psychology","Business","Architecture",
  "Biology","Chemistry","Physics","Literature","Art & Design","Music",
  "Geography","Sociology","Education","Environmental Science",
];

const EXTRACURRICULAR = [
  "Sports","Tennis","Football","Basketball","Rowing","Cricket","Athletics",
  "Gaming","Music","Photography","Debate","Model UN","Drama","Art","Coding",
  "Startups","Volunteering","Clubs","Drawing","Writing","Dancing","Chess",
];

const IB_SUBJECTS = [
  "Math AA HL","Math AI HL","Math AA SL","Math AI SL","Economics","Business Management",
  "History","Geography","Psychology","Philosophy","English A Lang & Lit","English A Literature",
  "English B","Physics","Chemistry","Biology","Computer Science","French B","Spanish B",
  "Spanish ab initio","French ab initio","Global Politics","Design Technology","Visual Arts","Theatre","Music",
];
const ALEVEL_SUBJECTS = [
  "Mathematics","Further Mathematics","Economics","Business","History","Geography",
  "Politics","Psychology","Sociology","Philosophy","English Literature","English Language",
  "Physics","Chemistry","Biology","Computer Science","Art","Design & Technology","Media Studies","Law","Statistics",
];
const IB_GRADES = [7,6,5,4,3,2,1];
const A_GRADES = ["A*","A","B","C","D","E"];

const inp = "w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-base text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors";
const tog = (a: boolean) => `rounded-xl px-5 py-2.5 text-sm border transition-all ${a ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold" : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600"}`;

export function ProfileClient({ profile, subjects }: { profile: Profile; subjects: SubjectEntry[] }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState(profile.name);
  const [year, setYear] = useState(profile.year);
  const [homeOrIntl, setHomeOrIntl] = useState(profile.home_or_intl);
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [academicContext, setAcademicContext] = useState(profile.academic_context || "");
  const [extracurricular, setExtracurricular] = useState<string[]>(profile.extracurricular_interests || []);
  const [wantsPredictedGrades, setWantsPredictedGrades] = useState(profile.wants_predicted_grades || false);
  const [corePoints, setCorePoints] = useState(profile.core_points || 2);
  const [psFormat, setPsFormat] = useState<"UCAS_3Q"|"LEGACY">(profile.ps_format || "UCAS_3Q");
  const [q1, setQ1] = useState(profile.ps_q1 || "");
  const [q2, setQ2] = useState(profile.ps_q2 || "");
  const [q3, setQ3] = useState(profile.ps_q3 || "");
  const [statement, setStatement] = useState(profile.ps_statement || "");

  const [hl, setHl] = useState<SubjectEntry[]>(subjects.filter(s => s.level === "HL").length > 0
    ? subjects.filter(s => s.level === "HL")
    : [{ subject: "Math AA HL", level: "HL", predicted_grade: "6" },
       { subject: "Economics", level: "HL", predicted_grade: "6" },
       { subject: "History", level: "HL", predicted_grade: "6" }]
  );
  const [sl, setSl] = useState<SubjectEntry[]>(subjects.filter(s => s.level === "SL").length > 0
    ? subjects.filter(s => s.level === "SL")
    : [{ subject: "English A Lang & Lit", level: "SL", predicted_grade: "6" },
       { subject: "Physics", level: "SL", predicted_grade: "6" },
       { subject: "Spanish B", level: "SL", predicted_grade: "6" }]
  );
  const [al, setAl] = useState<SubjectEntry[]>(subjects.filter(s => s.level === "A_LEVEL").length > 0
    ? subjects.filter(s => s.level === "A_LEVEL")
    : [{ subject: "Mathematics", level: "A_LEVEL", predicted_grade: "A*" },
       { subject: "Economics", level: "A_LEVEL", predicted_grade: "A" },
       { subject: "History", level: "A_LEVEL", predicted_grade: "A" }]
  );

  const toggleInterest = (i: string) => setInterests(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 3 ? [...prev, i] : prev
  );

  const toggleExtracurricular = (e: string) => setExtracurricular(prev =>
    prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
  );

  async function save() {
    setErr(""); setSaving(true); setSaved(false);
    try {
      console.log("Saving profile with:", { name, year, home_or_intl: homeOrIntl, interests, academic_context: academicContext, extracurricular_interests: extracurricular, wants_predicted_grades: wantsPredictedGrades });
      const p = await upsertProfile({ name, year, home_or_intl: homeOrIntl, interests, academic_context: academicContext, extracurricular_interests: extracurricular, wants_predicted_grades: wantsPredictedGrades, core_points: corePoints, ps_format: psFormat, ps_q1: q1, ps_q2: q2, ps_q3: q3, ps_statement: statement });
      if (!p) throw new Error("Save failed - no profile returned");
      console.log("Profile saved:", p);
      const subs = profile.curriculum === "IB" ? [...hl, ...sl] : al;
      await upsertSubjects(p.id, subs);
      console.log("Subjects saved");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { 
      console.error("Save error:", e);
      setErr(e.message || "Failed to save profile"); 
    }
    finally { setSaving(false); }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight mb-2">My Profile</h1>
          <p className="text-zinc-500">Your saved grades and PS pre-fill every assessment automatically.</p>
        </div>
        <button onClick={save} disabled={saving}
          className="rounded-xl bg-zinc-100 text-zinc-950 px-6 py-3 text-sm font-semibold hover:bg-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
        </button>
      </div>

      {err && <p className="mb-4 text-sm text-red-400">{err}</p>}

      <div className="space-y-6">
        {/* Basic */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Basic info</div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">First name</label>
            <input className={inp} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Year group</label>
            <div className="flex gap-3">
              {(["11","12"] as const).map(y => <button key={y} onClick={() => setYear(y)} className={tog(year === y)}>Year {y}</button>)}
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Student type</label>
            <div className="flex gap-3">
              <button onClick={() => setHomeOrIntl("intl")} className={tog(homeOrIntl === "intl")}>🌍 International</button>
              <button onClick={() => setHomeOrIntl("home")} className={tog(homeOrIntl === "home")}>🏠 Domestic</button>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Interests (up to 3)</div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(i => {
              const active = interests.includes(i);
              return (
                <button key={i} onClick={() => toggleInterest(i)}
                  disabled={interests.length >= 3 && !active}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all ${active ? "bg-zinc-100 text-zinc-950 border-zinc-100" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 disabled:opacity-30"}`}>
                  {i}
                </button>
              );
            })}
          </div>
        </div>

        {/* Academic Context & Extracurricular */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">About you</div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">What do you love studying?</label>
            <textarea className={`${inp} min-h-[70px] resize-none`} placeholder="E.g. I'm fascinated by philosophy and how ideas shape the world..." value={academicContext} onChange={e => setAcademicContext(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Outside of class — sports, gaming, clubs, etc.</label>
            <div className="flex flex-wrap gap-2">
              {EXTRACURRICULAR.map(e => {
                const active = extracurricular.includes(e);
                return (
                  <button key={e} onClick={() => toggleExtracurricular(e)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-all ${active ? "bg-zinc-100 text-zinc-950 border-zinc-100" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"}`}>
                    {e}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Track predicted grades as they develop?</label>
            <div className="flex gap-3">
              <button onClick={() => setWantsPredictedGrades(true)} className={tog(wantsPredictedGrades)}>Yes, track my grades</button>
              <button onClick={() => setWantsPredictedGrades(false)} className={tog(!wantsPredictedGrades)}>Not right now</button>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
            {profile.curriculum === "IB" ? "IB subjects & predicted grades" : "A-Level predicted grades"}
          </div>
          {profile.curriculum === "IB" ? (
            <>
              {corePoints !== undefined && (
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Core points (EE + TOK)</label>
                  <select className={inp} value={corePoints} onChange={e => setCorePoints(Number(e.target.value))}>
                    {[0,1,2,3].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-zinc-500 mb-2">HL</label>
                {hl.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px] gap-2 mb-2">
                    <select className={inp} value={row.subject} onChange={e => setHl(p => p.map((x,idx) => idx===i ? {...x, subject: e.target.value} : x))}>
                      {IB_SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select className={inp} value={row.predicted_grade} onChange={e => setHl(p => p.map((x,idx) => idx===i ? {...x, predicted_grade: e.target.value} : x))}>
                      {IB_GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-2">SL</label>
                {sl.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px] gap-2 mb-2">
                    <select className={inp} value={row.subject} onChange={e => setSl(p => p.map((x,idx) => idx===i ? {...x, subject: e.target.value} : x))}>
                      {IB_SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select className={inp} value={row.predicted_grade} onChange={e => setSl(p => p.map((x,idx) => idx===i ? {...x, predicted_grade: e.target.value} : x))}>
                      {IB_GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </>
          ) : (
            al.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px] gap-2 mb-2">
                <select className={inp} value={row.subject} onChange={e => setAl(p => p.map((x,idx) => idx===i ? {...x, subject: e.target.value} : x))}>
                  {ALEVEL_SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className={inp} value={row.predicted_grade} onChange={e => setAl(p => p.map((x,idx) => idx===i ? {...x, predicted_grade: e.target.value} : x))}>
                  {A_GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            ))
          )}
        </div>

        {/* PS */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Personal statement</div>
          <div className="flex gap-3">
            <button onClick={() => setPsFormat("UCAS_3Q")} className={tog(psFormat === "UCAS_3Q")}>UCAS 3 questions</button>
            <button onClick={() => setPsFormat("LEGACY")} className={tog(psFormat === "LEGACY")}>Single text</button>
          </div>
          {psFormat === "UCAS_3Q" ? (
            <div className="space-y-4">
              {[{label:"Q1 — Why this course?", val:q1, set:setQ1},{label:"Q2 — Academic preparation", val:q2, set:setQ2},{label:"Q3 — Supercurricular & value", val:q3, set:setQ3}].map(({label,val,set}) => (
                <div key={label}>
                  <label className="block text-xs text-zinc-500 mb-2">{label}</label>
                  <textarea value={val} onChange={e => set(e.target.value)} className={`${inp} min-h-[90px] resize-none`} />
                </div>
              ))}
            </div>
          ) : (
            <textarea value={statement} onChange={e => setStatement(e.target.value)} className={`${inp} min-h-[180px] resize-none`} />
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={save} disabled={saving}
          className="rounded-xl bg-zinc-100 text-zinc-950 px-8 py-4 text-base font-semibold hover:bg-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
