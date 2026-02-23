"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr(""); setLoading(true);
    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setErr(error.message); setLoading(false); return; }
      // Auto sign in after sign up
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setErr(signInError.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setErr(error.message); setLoading(false); return; }
    }

    // Check if profile exists
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Something went wrong"); setLoading(false); return; }

    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    router.push(profile ? "/dashboard" : "/onboarding");
  }

  const inp = "w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-4 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <a href="/" className="block text-2xl font-semibold tracking-tight mb-12 hover:text-zinc-300 transition-colors">offr</a>

        <h1 className="text-3xl font-semibold mb-2">{isSignUp ? "Create account" : "Sign in"}</h1>
        <p className="text-zinc-500 mb-8 text-base">{isSignUp ? "Takes 30 seconds." : "Welcome back."}</p>

        <div className="space-y-3">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            className={inp} />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            className={inp} />
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button onClick={submit} disabled={!email || !password || loading}
            className="w-full rounded-xl bg-zinc-100 text-zinc-950 py-4 text-base font-semibold hover:bg-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
            {loading ? "…" : isSignUp ? "Create account →" : "Sign in →"}
          </button>
        </div>

        <button onClick={() => { setIsSignUp(v => !v); setErr(""); }}
          className="mt-6 w-full text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
          {isSignUp ? "Already have an account? Sign in" : "No account? Sign up"}
        </button>
      </div>
    </div>
  );
}
