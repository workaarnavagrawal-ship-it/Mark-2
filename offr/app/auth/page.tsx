"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function sendOtp() {
    setErr(""); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setStep("otp");
  }

  async function verifyOtp() {
    setErr(""); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (error) { setErr(error.message); setLoading(false); return; }

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

        {step === "email" ? (
          <div>
            <h1 className="text-3xl font-semibold mb-2">Sign in</h1>
            <p className="text-zinc-500 mb-8">We'll send a 6-digit code to your email.</p>
            <div className="space-y-3">
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendOtp()}
                className={inp} autoFocus />
              {err && <p className="text-sm text-red-400">{err}</p>}
              <button onClick={sendOtp} disabled={!email || loading}
                className="w-full rounded-xl bg-zinc-100 text-zinc-950 py-4 text-base font-semibold hover:bg-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
                {loading ? "Sending…" : "Send code →"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-semibold mb-2">Enter your code</h1>
            <p className="text-zinc-500 mb-8">We sent a 6-digit code to <span className="text-zinc-300">{email}</span>.</p>
            <div className="space-y-3">
              <input type="text" inputMode="numeric" placeholder="000000" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && otp.length === 6 && verifyOtp()}
                className={`${inp} text-center text-2xl tracking-widest`} autoFocus />
              {err && <p className="text-sm text-red-400">{err}</p>}
              <button onClick={verifyOtp} disabled={otp.length !== 6 || loading}
                className="w-full rounded-xl bg-zinc-100 text-zinc-950 py-4 text-base font-semibold hover:bg-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
                {loading ? "Verifying…" : "Verify →"}
              </button>
              <button onClick={() => { setStep("email"); setOtp(""); setErr(""); }}
                className="w-full text-sm text-zinc-600 hover:text-zinc-400 transition-colors py-2">
                ← Use a different email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
