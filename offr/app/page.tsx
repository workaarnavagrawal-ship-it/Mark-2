import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { code?: string; token_hash?: string; type?: string };
}) {
  if (searchParams.code) redirect(`/auth/callback?code=${searchParams.code}`);
  if (searchParams.token_hash && searchParams.type) redirect(`/auth/callback?token_hash=${searchParams.token_hash}&type=${searchParams.type}`);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <nav style={{ padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b)" }}>
        <span style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "22px", fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.02em" }}>offr</span>
        <Link href="/auth" style={{ fontSize: "14px", color: "var(--t3)", textDecoration: "none", transition: "color 150ms" }}>Sign in →</Link>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 48px" }}>
        <div style={{ maxWidth: "640px", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            border: "1px solid var(--b)", borderRadius: "var(--r-pill)",
            padding: "6px 16px", fontSize: "13px", color: "var(--t3)", marginBottom: "48px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--safe-t)", display: "inline-block", animation: "pulse 2s infinite" }} />
            2024–25 real applicant data · Free
          </div>

          <h1 style={{
            fontFamily: "var(--font-garamond, var(--serif))",
            fontSize: "72px", fontWeight: 400, letterSpacing: "-0.03em",
            color: "var(--t)", lineHeight: 1, marginBottom: "28px",
            fontStyle: "italic",
          }}>
            Will you<br />get in?
          </h1>

          <p style={{ fontSize: "18px", color: "var(--t3)", lineHeight: 1.7, marginBottom: "48px", maxWidth: "460px", margin: "0 auto 48px" }}>
            Build your profile once. Get honest, data-driven offer predictions across all your UCAS choices.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/auth" className="btn-primary" style={{ padding: "14px 32px", fontSize: "15px" }}>
              Build my profile →
            </Link>
            <Link href="/auth" className="btn-ghost" style={{ padding: "14px 32px", fontSize: "15px" }}>
              Sign in
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "80px" }}>
            {[
              { label: "IB & A-Levels" },
              { label: "Real applicant data" },
              { label: "PS analysis" },
              { label: "5 choices tracked" },
            ].map(({ label }) => (
              <div key={label} style={{ border: "1px solid var(--b)", borderRadius: "12px", padding: "16px 12px", background: "var(--s1)" }}>
                <p style={{ fontSize: "13px", color: "var(--t3)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
