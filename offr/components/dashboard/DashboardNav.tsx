"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/dashboard/assess", label: "Offer Chances", icon: "🎯" },
  { href: "/dashboard/tracker", label: "Offer Tracker", icon: "📍" },
  { href: "/dashboard/explore", label: "Explore Courses", icon: "🔭" },
  { href: "/dashboard/profile", label: "My Profile", icon: "👤" },
  { href: "/dashboard/faq", label: "FAQs", icon: "💬" },
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
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800/60 bg-zinc-950/95 backdrop-blur-sm flex flex-col">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-zinc-800/60">
        <span className="text-2xl font-semibold tracking-tight">offr</span>
      </div>

      {/* User */}
      <div className="px-6 py-5 border-b border-zinc-800/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300">
            {name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-200">{name}</div>
            <div className="text-xs text-zinc-600">Student</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                active
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}>
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-zinc-800/60">
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900 transition-all">
          <span>↩</span> Sign out
        </button>
      </div>
    </aside>
  );
}
