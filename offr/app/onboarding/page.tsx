"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { upsertProfile, upsertSubjects } from "@/lib/profile";
import type { Curriculum, HomeOrIntl, SubjectEntry, YearGroup } from "@/lib/types";

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
  "Physics","Chemistry","Biology","Computer Science","Art","Design & Technology",
  "Media Studies","Law","Statistics",
];

const IB_GRADES = [7,6,5,4,3,2,1];
const A_GRADES = ["A*","A","B","C","D","E"];

type Step = 1|2|3|4|5|6|7;

const STEPS = [
  { num: 1, label: "Hey, what's your name?" },
  { num: 2, label: "What's your situation?" },
  { num: 3, label: "What are you into?" },
  { num: 4, label: "Tell us about yourself" },
  { num: 5, label: "Your subjects & grades" },
  { num: 6, label: "Track your predicted grades?" },
  { num: 7, label: "Your personal statement" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Step 1
  const [name, setName] = useState("");
  // Step 2
  const [year, setYear] = useState<YearGroup>("12");
  const [curriculum, setCurriculum] = useState<Curriculum>("IB");
  const [homeOrIntl, setHomeOrIntl] = useState<HomeOrIntl>("intl");
  const [corePoints, setCorePoints] = useState(2);
  // Step 3
  const [interests, setInterests] = useState<string[]>([]);
  // Step 4
  const [academicContext, setAcademicContext] = useState("");
  const [extracurricular, setExtracurricular] = useState<string[]>([]);
  // Step 5
  // Step 5
  const [hl, setHl] = useState<SubjectEntry[]>([
    { subject: "Math AA HL", level: "HL", predicted_grade: "6" },
    { subject: "Economics", level: "HL", predicted_grade: "6" },
    { subject: "History", level: "HL", predicted_grade: "6" },
  ]);
  const [sl, setSl] = useState<SubjectEntry[]>([
    { subject: "English A Lang & Lit", level: "SL", predicted_grade: "6" },
    { subject: "Physics", level: "SL", predicted_grade: "6" },
    { subject: "Spanish B", level: "SL", predicted_grade: "6" },
  ]);
  const [aLevels, setALevels] = useState<SubjectEntry[]>([
    { subject: "Mathematics", level: "A_LEVEL", predicted_grade: "A*" },
    { subject: "Economics", level: "A_LEVEL", predicted_grade: "A" },
    { subject: "History", level: "A_LEVEL", predicted_grade: "A" },
  ]);
  // Step 6
  const [wantsPredictedGrades, setWantsPredictedGrades] = useState(false);
  // Step 7
  const [psFormat, setPsFormat] = useState<"UCAS_3Q"|"LEGACY">("UCAS_3Q");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [statement, setStatement] = useState("");

  const toggleInterest = (i: string) => {
    setInterests(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 3 ? [...prev, i] : prev
    );
  };

  const toggleExtracurricular = (e: string) => {
    setExtracurricular(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    );
  };

  const inp = "w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-base text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors";
  const sel = inp;
  const tog = (active: boolean) => `rounded-xl px-6 py-3 text-base border transition-all duration-200 ${active ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold" : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600"}`;

  async function finish() {
    setErr(""); setSaving(true);
    try {
      const subjects = curriculum === "IB" ? [...hl, ...sl] : aLevels;
      console.log("Starting profile save...");
      
      const profile = await upsertProfile({
        name, year, curriculum, home_or_intl: homeOrIntl,
        interests, academic_context: academicContext, extracurricular_interests: extracurricular,
        wants_predicted_grades: wantsPredictedGrades,
        core_points: curriculum === "IB" ? corePoints : undefined,
        ps_format: psFormat, ps_q1: q1, ps_q2: q2, ps_q3: q3, ps_statement: statement,
      });

      if (!profile) {
        throw new Error("Failed to save profile - please try again");
      }

      await upsertSubjects(profile.id, subjects);
      router.push("/dashboard");
    } catch (e: unknown) {
      const err = e as { message?: string; error_description?: string };
      const errorMsg = err?.message || err?.error_description || "Something went wrong";
      if (errorMsg.includes("column") || errorMsg.includes("relation")) {
        setErr("alter table");  // Trigger the SQL display format
      } else {
        setErr(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  }

  const meta = STEPS[step - 1];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-2xl font-semibold tracking-tight mb-10">offr</div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {([1,2,3,4,5,6,7] as Step[]).map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? "bg-zinc-100" : "bg-zinc-800"}`} />
          ))}
        </div>

        <h1 className="text-4xl font-semibold tracking-tight mb-2">{meta.label}</h1>
        <p className="text-zinc-500 text-base mb-8">Step {step} of 7</p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-7 space-y-5">

          {step === 1 && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">First name</label>
              <input className={inp} placeholder="e.g. Aryan" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Year group</label>
                <div className="flex gap-3">
                  {(["11","12"] as YearGroup[]).map(y => (
                    <button key={y} onClick={() => setYear(y)} className={tog(year === y)}>Year {y}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Curriculum</label>
                <div className="flex gap-3">
                  <button onClick={() => setCurriculum("IB")} className={tog(curriculum === "IB")}>🎓 IB Diploma</button>
                  <button onClick={() => setCurriculum("A_LEVELS")} className={tog(curriculum === "A_LEVELS")}>📚 A Levels</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Student type</label>
                <div className="flex gap-3">
                  <button onClick={() => setHomeOrIntl("intl")} className={tog(homeOrIntl === "intl")}>🌍 International</button>
                  <button onClick={() => setHomeOrIntl("home")} className={tog(homeOrIntl === "home")}>🏠 Domestic</button>
                </div>
              </div>
              {curriculum === "IB" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Core points (EE + TOK)</label>
                  <select className={sel} value={corePoints} onChange={e => setCorePoints(Number(e.target.value))}>
                    {[0,1,2,3].map(c => <option key={c} value={c}>{c} point{c !== 1 ? "s" : ""}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">Pick up to 3 interests</label>
              <p className="text-sm text-zinc-600 mb-4">We'll use these to personalise your explore page.</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => {
                  const active = interests.includes(i);
                  const maxed = interests.length >= 3 && !active;
                  return (
                    <button key={i} onClick={() => toggleInterest(i)} disabled={maxed}
                      className={`rounded-full border px-4 py-2 text-sm transition-all ${active ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-medium" : "border-zinc-800 text-zinc-400 hover:border-zinc-600 disabled:opacity-30"}`}>
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">What do you love studying?</label>
                <textarea className={`${inp} min-h-[80px] resize-none`} placeholder="e.g. I'm fascinated by philosophy and how ideas shape the world. I love reading theory and debating big questions..." value={academicContext} onChange={e => setAcademicContext(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">What do you enjoy outside of class?</label>
                <p className="text-sm text-zinc-600 mb-4">Select everything that applies — sports, games, clubs, hobbies, etc.</p>
                <div className="flex flex-wrap gap-2">
                  {EXTRACURRICULAR.map(e => {
                    const active = extracurricular.includes(e);
                    return (
                      <button key={e} onClick={() => toggleExtracurricular(e)}
                        className={`rounded-full border px-4 py-2 text-sm transition-all ${active ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-medium" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>
                        {e}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 5 && curriculum === "IB" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">HL Subjects</label>
                <div className="space-y-3">
                  {hl.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_90px] gap-3">
                      <select className={sel} value={row.subject} onChange={e => setHl(prev => prev.map((x,idx) => idx===i ? {...x, subject: e.target.value} : x))}>
                        {IB_SUBJECTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <select className={sel} value={row.predicted_grade} onChange={e => setHl(prev => prev.map((x,idx) => idx===i ? {...x, predicted_grade: e.target.value} : x))}>
                        {IB_GRADES.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">SL Subjects</label>
                <div className="space-y-3">
                  {sl.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_90px] gap-3">
                      <select className={sel} value={row.subject} onChange={e => setSl(prev => prev.map((x,idx) => idx===i ? {...x, subject: e.target.value} : x))}>
                        {IB_SUBJECTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <select className={sel} value={row.predicted_grade} onChange={e => setSl(prev => prev.map((x,idx) => idx===i ? {...x, predicted_grade: e.target.value} : x))}>
                        {IB_GRADES.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && curriculum === "A_LEVELS" && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Predicted grades</label>
              <div className="space-y-3">
                {aLevels.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_90px] gap-3">
                    <select className={sel} value={row.subject} onChange={e => setALevels(prev => prev.map((x,idx) => idx===i ? {...x, subject: e.target.value} : x))}>
                      {ALEVEL_SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select className={sel} value={row.predicted_grade} onChange={e => setALevels(prev => prev.map((x,idx) => idx===i ? {...x, predicted_grade: e.target.value} : x))}>
                      {A_GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-400 mb-4">Would you like to track your predicted grades as they develop during the year? This helps us give you more accurate assessments over time.</p>
                <div className="flex gap-3">
                  <button onClick={() => setWantsPredictedGrades(true)} className={tog(wantsPredictedGrades === true)}>Yes, track my grades</button>
                  <button onClick={() => setWantsPredictedGrades(false)} className={tog(wantsPredictedGrades === false)}>Not right now</button>
                </div>
              </div>
              {wantsPredictedGrades && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
                  <p className="text-sm text-zinc-300">Great! You can update your predicted grades anytime in your profile. We'll factor in your progress to give you better offer predictions as the year goes on.</p>
                </div>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">PS format</label>
                <div className="flex gap-3">
                  <button onClick={() => setPsFormat("UCAS_3Q")} className={tog(psFormat === "UCAS_3Q")}>UCAS 3 questions</button>
                  <button onClick={() => setPsFormat("LEGACY")} className={tog(psFormat === "LEGACY")}>Single text</button>
                </div>
              </div>
              {psFormat === "UCAS_3Q" ? (
                <div className="space-y-4">
                  {[
                    { label: "Q1 — Why this course?", val: q1, set: setQ1 },
                    { label: "Q2 — Academic preparation", val: q2, set: setQ2 },
                    { label: "Q3 — Supercurricular & value", val: q3, set: setQ3 },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-xs text-zinc-500 mb-2">{label}</label>
                      <textarea value={val} onChange={e => set(e.target.value)}
                        className={`${inp} min-h-[90px] resize-none`}
                        placeholder="Optional — you can fill this in later" />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <textarea value={statement} onChange={e => setStatement(e.target.value)}
                    className={`${inp} min-h-[180px] resize-none`}
                    placeholder="Paste your personal statement here — optional, you can add it later" />
                </div>
              )}
              <p className="text-xs text-zinc-600">Your PS is used to assess offer chances more accurately. You can edit this anytime in your profile.</p>
            </div>
          )}
        </div>

        {err && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
            {err.includes("alter table") ? (
              <div className="space-y-2">
                <p className="text-sm text-red-300 font-medium">Database setup needed:</p>
                <p className="text-sm text-red-200">Go to your Supabase SQL editor and run this:</p>
                <pre className="bg-zinc-950 p-3 rounded border border-zinc-800 text-xs text-red-100 overflow-x-auto">
                  <code>{`alter table profiles
  add column if not exists academic_context text,
  add column if not exists extracurricular_interests text[] default '{}',
  add column if not exists wants_predicted_grades boolean default false;`}</code>
                </pre>
                <p className="text-xs text-red-300">Then close this tab and sign in again.</p>
              </div>
            ) : (
              <p className="text-sm text-red-300">{err}</p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => setStep(s => Math.max(1, s-1) as Step)} disabled={step === 1 || saving}
            className="rounded-xl border border-zinc-800 px-6 py-3 text-base text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 disabled:opacity-30 transition-all">
            ← Back
          </button>
          {step < 7 ? (
            <button onClick={() => setStep(s => Math.min(7, s+1) as Step)}
              disabled={(step === 1 && !name.trim()) || saving}
              className="rounded-xl bg-zinc-100 text-zinc-950 px-8 py-3 text-base font-semibold hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-40 transition-all">
              Continue →
            </button>
          ) : (
            <button onClick={finish} disabled={saving}
              className="rounded-xl bg-zinc-100 text-zinc-950 px-8 py-3 text-base font-semibold hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-40 transition-all">
              {saving ? "Saving…" : "Build my dashboard 🎯"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
