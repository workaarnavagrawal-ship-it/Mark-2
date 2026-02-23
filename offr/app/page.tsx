import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-6 flex items-center justify-between border-b border-zinc-800/50">
        <span className="text-2xl font-semibold tracking-tight">offr</span>
        <Link href="/auth" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
          Sign in →
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-sm text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            2024–25 real applicant data · Free · No card needed
          </div>

          <h1 className="text-7xl md:text-8xl leading-none tracking-tight font-semibold mb-6">
            Will you<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-600">
              get in?
            </span>
          </h1>

          <p className="text-xl text-zinc-400 leading-relaxed mb-10 max-w-lg mx-auto">
            Build your academic profile once. Get honest, data-driven offer predictions across all your UCAS choices.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth"
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950 px-10 py-4 text-base font-semibold hover:bg-white hover:scale-105 active:scale-95 transition-all">
              Build my profile →
            </Link>
            <Link href="/explore"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 px-10 py-4 text-base text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-all">
              Explore courses
            </Link>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: "🎓", label: "IB & A-Levels" },
              { icon: "📊", label: "Real applicant data" },
              { icon: "📝", label: "PS reviewed" },
              { icon: "📍", label: "5 UCAS choices tracked" },
            ].map(({ icon, label }) => (
              <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-sm text-zinc-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
