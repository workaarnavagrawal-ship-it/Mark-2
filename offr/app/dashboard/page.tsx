import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrimaryCtaLink, SecondaryCtaLinks } from "@/components/dashboard/DashboardLinks";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
  if (!profile) redirect("/onboarding");

  const { data: assessments } = await supabase.from("assessments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
  const { data: subjects } = await supabase.from("subjects").select("*").eq("profile_id", profile.id);

  const ibTotal = subjects?.filter(s => s.level !== "A_LEVEL").reduce((s: number, x: { predicted_grade: string }) => s + Number(x.predicted_grade), 0) || 0;
  const ibWithCore = ibTotal + (profile.core_points || 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const bandCounts = { Safe: 0, Target: 0, Reach: 0 };
  assessments?.forEach((a: { band: string }) => { if (a.band in bandCounts) bandCounts[a.band as keyof typeof bandCounts]++; });

  interface BandStyleEntry { bg: string; color: string; border: string; }
  const BAND_STYLE: Record<string, BandStyleEntry> = {
    Safe: { bg: "var(--safe-bg)", color: "var(--safe-t)", border: "1px solid var(--safe-b)" },
    Target: { bg: "var(--tgt-bg)", color: "var(--tgt-t)", border: "1px solid var(--tgt-b)" },
    Reach: { bg: "var(--rch-bg)", color: "var(--rch-t)", border: "1px solid var(--rch-b)" },
  };

  return (
    <div style={{ padding: "52px 56px", maxWidth: "880px" }}>

      {/* Greeting */}
      <div style={{ marginBottom: "52px" }}>
        <p className="label" style={{ marginBottom: "10px" }}>{greeting}</p>
        <h1 style={{
          fontFamily: "var(--font-garamond, var(--serif))",
          fontSize: "52px", fontWeight: 400, letterSpacing: "-0.025em",
          color: "var(--t)", lineHeight: 1.05, marginBottom: "14px",
        }}>
          {profile.name}
        </h1>
        <p style={{ color: "var(--t3)", fontSize: "14px" }}>
          Year {profile.year} · {profile.curriculum === "IB" ? "IB Diploma" : "A Levels"} · {profile.home_or_intl === "intl" ? "International" : "Domestic"} applicant
        </p>
      </div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "12px" }}>
        {/* Score */}
        <div className="card">
          <p className="label">{profile.curriculum === "IB" ? "Predicted score" : "Top grades"}</p>
          {profile.curriculum === "IB" ? (
            <>
              <p style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "48px", fontWeight: 400, color: "var(--t)", lineHeight: 1, marginBottom: "6px" }}>{ibWithCore}</p>
              <p className="muted">of 45 points</p>
            </>
          ) : (
            <p style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "30px", color: "var(--t)", lineHeight: 1.2 }}>
              {subjects?.slice(0, 3).map((s: { predicted_grade: string }) => s.predicted_grade).join("  ·  ") || "—"}
            </p>
          )}
        </div>

        {/* Choices */}
        <div className="card">
          <p className="label">Choices assessed</p>
          <p style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "48px", fontWeight: 400, color: "var(--t)", lineHeight: 1, marginBottom: "6px" }}>{assessments?.length || 0}</p>
          <p className="muted">of 5 UCAS slots</p>
        </div>

        {/* Interests */}
        <div className="card">
          <p className="label">Interests</p>
          {profile.interests?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "4px" }}>
              {profile.interests.slice(0, 3).map((i: string) => (
                <span key={i} style={{ fontSize: "14px", color: "var(--t2)" }}>{i}</span>
              ))}
            </div>
          ) : (
            <Link href="/dashboard/profile" style={{ fontSize: "13px", color: "var(--t3)", textDecoration: "none" }}>Add interests →</Link>
          )}
        </div>
      </div>

      {/* Primary CTA */}
      <PrimaryCtaLink />

      {/* Secondary cards */}
      <SecondaryCtaLinks itemsData={[
        { href: "/dashboard/tracker", label: "Offer Tracker", desc: "All 5 UCAS choices in one view.", badge: assessments?.length ? `${assessments.length} saved` : null },
        { href: "/dashboard/explore", label: "Explore Courses", desc: "Discover degrees you didn't know existed.", badge: null },
      ]} />

      {/* Recent assessments */}
      {assessments && assessments.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "20px", fontWeight: 400, color: "var(--t)" }}>Recent assessments</h3>
            <Link href="/dashboard/tracker" style={{ fontSize: "13px", color: "var(--t3)", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {assessments.slice(0, 3).map((a: { id: string; band: string; course_name: string; university_name: string; chance_percent: number }) => {
              const bs = BAND_STYLE[a.band] || BAND_STYLE.Reach;
              return (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", background: "var(--s1)", border: "1px solid var(--b)", borderRadius: "12px",
                }}>
                  <div>
                    <p style={{ fontSize: "14px", color: "var(--t)", fontWeight: 500, marginBottom: "2px" }}>{a.course_name}</p>
                    <p style={{ fontSize: "12px", color: "var(--t3)" }}>{a.university_name}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "24px", color: "var(--t)" }}>{a.chance_percent}%</span>
                    <span className="pill" style={{ background: bs.bg, color: bs.color, border: bs.border }}>{a.band}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
