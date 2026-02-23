import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const BAND_COLOR = {
  Safe: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  Target: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  Reach: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("profile_id", profile.id);

  const ibTotal = subjects?.filter(s => s.level !== "A_LEVEL")
    .reduce((sum, s) => sum + Number(s.predicted_grade), 0) || 0;
  const ibWithCore = ibTotal + (profile.core_points || 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const bandCounts = { Safe: 0, Target: 0, Reach: 0 };
  assessments?.forEach(a => { bandCounts[a.band as keyof typeof bandCounts]++; });

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <p className="text-zinc-500 text-base mb-1">{greeting},</p>
        <h1 className="text-5xl font-semibold tracking-tight">{profile.name} 👋</h1>
        <p className="mt-2 text-zinc-500">
          Year {profile.year} · {profile.curriculum === "IB" ? "IB Diploma" : "A Levels"} · {profile.home_or_intl === "intl" ? "International" : "Domestic"} applicant
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">
            {profile.curriculum === "IB" ? "Predicted total" : "Top subjects"}
          </div>
          {profile.curriculum === "IB" ? (
            <>
              <div className="text-4xl font-semibold">{ibWithCore}</div>
              <div className="text-sm text-zinc-600 mt-1">out of 45</div>
            </>
          ) : (
            <div className="text-2xl font-semibold">
              {subjects?.slice(0,3).map(s => s.predicted_grade).join(" · ") || "—"}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Choices assessed</div>
          <div className="text-4xl font-semibold">{assessments?.length || 0}</div>
          <div className="text-sm text-zinc-600 mt-1">of 5 UCAS choices</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Profile</div>
          <div className="text-sm text-zinc-300 space-y-1">
            {profile.interests?.slice(0,3).map((i: string) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-zinc-600" />
                {i}
              </div>
            ))}
            {(!profile.interests || profile.interests.length === 0) && (
              <Link href="/dashboard/profile" className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs">
                Add interests →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main feature cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Offer chances - primary */}
        <Link href="/dashboard/assess"
          className="col-span-2 group rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 p-7 hover:border-zinc-600 transition-all hover:scale-[1.01]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl mb-3">🎯</div>
              <h2 className="text-2xl font-semibold mb-2">Check offer chances</h2>
              <p className="text-zinc-500 text-base">Your profile is loaded. Pick a course and get an instant prediction.</p>
            </div>
            <span className="text-zinc-600 group-hover:text-zinc-300 transition-colors text-2xl mt-1">→</span>
          </div>
        </Link>

        <Link href="/dashboard/tracker"
          className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 transition-all hover:scale-[1.01]">
          <div className="text-2xl mb-3">📍</div>
          <h3 className="text-xl font-semibold mb-2">Offer Tracker</h3>
          <p className="text-zinc-500 text-sm">Track all 5 choices. See your full UCAS picture at a glance.</p>
          {assessments && assessments.length > 0 && (
            <div className="mt-4 flex gap-2">
              {Object.entries(bandCounts).map(([band, count]) => count > 0 && (
                <span key={band} className={`text-xs rounded-full px-3 py-1 border ${BAND_COLOR[band as keyof typeof BAND_COLOR].bg} ${BAND_COLOR[band as keyof typeof BAND_COLOR].border} ${BAND_COLOR[band as keyof typeof BAND_COLOR].text}`}>
                  {count} {band}
                </span>
              ))}
            </div>
          )}
        </Link>

        <Link href="/dashboard/explore"
          className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 transition-all hover:scale-[1.01]">
          <div className="text-2xl mb-3">🔭</div>
          <h3 className="text-xl font-semibold mb-2">Explore Courses</h3>
          <p className="text-zinc-500 text-sm">Discover courses you didn't know existed. PPE, Liberal Arts, and more.</p>
          {profile.interests?.length > 0 && (
            <p className="mt-3 text-xs text-zinc-600">Based on: {profile.interests.join(", ")}</p>
          )}
        </Link>
      </div>

      {/* Recent assessments */}
      {assessments && assessments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent assessments</h3>
            <Link href="/dashboard/tracker" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {assessments.slice(0,3).map(a => {
              const bc = BAND_COLOR[a.band as keyof typeof BAND_COLOR];
              return (
                <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{a.course_name}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{a.university_name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-zinc-100">{a.chance_percent}%</span>
                    <span className={`text-xs rounded-full border px-3 py-1 ${bc.bg} ${bc.border} ${bc.text}`}>{a.band}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {assessments?.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 border-dashed p-10 text-center">
          <div className="text-3xl mb-3">📭</div>
          <p className="text-zinc-500">No assessments yet. Check your first course above.</p>
        </div>
      )}
    </div>
  );
}
