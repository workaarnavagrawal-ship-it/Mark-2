"use client";

import Link from "next/link";

export function PrimaryCtaLink() {
  return (
    <Link href="/dashboard/assess"
      style={{
        display: "block", padding: "28px 32px", marginBottom: "12px",
        background: "var(--s1)", border: "1px solid var(--b-strong)",
        borderRadius: "var(--r-card)", textDecoration: "none", transition: "border-color 160ms ease",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--acc)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--b-strong)"}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p className="label" style={{ marginBottom: "8px" }}>Profile loaded · ready to assess</p>
          <h2 style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "28px", fontWeight: 400, color: "var(--t)", marginBottom: "6px" }}>
            Check your offer chances
          </h2>
          <p style={{ fontSize: "14px", color: "var(--t3)" }}>Pick a course and get an instant, data-driven prediction.</p>
        </div>
        <span style={{ fontSize: "22px", color: "var(--t3)", marginLeft: "32px", flexShrink: 0 }}>→</span>
      </div>
    </Link>
  );
}

export function SecondaryCtaLinks({ itemsData }: { itemsData: Array<{ href: string; label: string; desc: string; badge: string | null }> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "48px" }}>
      {itemsData.map(item => (
        <Link key={item.href} href={item.href} style={{
          display: "block", padding: "22px 24px",
          background: "var(--s1)", border: "1px solid var(--b)",
          borderRadius: "var(--r-card)", textDecoration: "none", transition: "all 160ms ease",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--b-strong)"; (e.currentTarget as HTMLElement).style.background = "var(--s2)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--b)"; (e.currentTarget as HTMLElement).style.background = "var(--s1)"; }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
            <h3 style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "20px", fontWeight: 400, color: "var(--t)" }}>{item.label}</h3>
            {item.badge && <span style={{ fontSize: "11px", color: "var(--t3)", border: "1px solid var(--b)", borderRadius: "var(--r-pill)", padding: "2px 10px", marginLeft: "8px", flexShrink: 0 }}>{item.badge}</span>}
          </div>
          <p style={{ fontSize: "13px", color: "var(--t3)" }}>{item.desc}</p>
        </Link>
      ))}
    </div>
  );
}
