"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr(""); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <a href="/" className="block text-2xl font-semibold tracking-tight mb-12 hover:text-zinc-300 transition-colors">offr</a>

        {sent ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Check your inbox</h2>
            <p className="text-sm text-zinc-500">We sent a magic link to <span className="text-zinc-300">{email}</span>. Click it to sign in — no password needed.</p>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-semibold mb-2">Sign in</h1>
            <p className="text-zinc-500 mb-8 text-base">No password. We'll email you a magic link.</p>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-4 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              {err && <p className="text-sm text-red-400">{err}</p>}
              <button onClick={submit} disabled={!email || loading}
                className="w-full rounded-xl bg-zinc-100 text-zinc-950 py-4 text-base font-semibold hover:bg-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
                {loading ? "Sending…" : "Send magic link →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
