"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/assess", label: "Offer Chances" },
  { href: "/dashboard/tracker", label: "Offer Tracker" },
  { href: "/dashboard/explore", label: "Explore Courses" },
  { href: "/dashboard/profile", label: "My Profile" },
  { href: "/dashboard/faq", label: "FAQs" },
];

export function DashboardNav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100vh", width: "220px",
      background: "var(--s1)", borderRight: "1px solid var(--b)",
      display: "flex", flexDirection: "column", zIndex: 50,
    }}>
      {/* Wordmark */}
      <div style={{ padding: "32px 24px 28px", borderBottom: "1px solid var(--b)" }}>
        <span style={{
          fontFamily: "var(--font-garamond, var(--serif))",
          fontSize: "24px", fontWeight: 400, letterSpacing: "-0.03em",
          color: "var(--t)", fontStyle: "italic",
        }}>offr</span>
      </div>

      {/* User chip */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--b)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: "var(--s3)", border: "1px solid var(--b-strong)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-garamond, var(--serif))",
            fontSize: "14px", color: "var(--t2)", flexShrink: 0,
          }}>
            {name?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "13px", color: "var(--t)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
            <div style={{ fontSize: "11px", color: "var(--t3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Student</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              style={{
                display: "block", padding: "9px 12px", borderRadius: "10px",
                background: active ? "var(--acc)" : "transparent",
                color: active ? "var(--t-inv)" : "var(--t3)",
                textDecoration: "none", fontSize: "14px",
                fontWeight: active ? 500 : 400,
                transition: "all 150ms ease",
                letterSpacing: active ? "0" : "0.01em",
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "var(--s3)"; (e.currentTarget as HTMLElement).style.color = "var(--t2)"; }}}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--t3)"; }}}>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--b)" }}>
        <button onClick={signOut} style={{
          width: "100%", padding: "9px 12px", borderRadius: "10px",
          background: "transparent", border: "none",
          color: "var(--t3)", fontSize: "13px", cursor: "pointer",
          textAlign: "left", fontFamily: "var(--font-dm, var(--sans))",
          transition: "all 150ms ease",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--s3)"; (e.currentTarget as HTMLElement).style.color = "var(--t2)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--t3)"; }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
