"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        setCurrentUser(session.user.email);
        
        // Check if profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        // Auto-redirect based on profile status
        if (profile?.id) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
      
      setChecking(false);
    };
    checkSession();
  }, [router]);

  async function handleAuthAction() {
    // If already logged in, navigate to dashboard
    if (currentUser) {
      router.push("/dashboard");
      return;
    }

    // Otherwise, sign in with Google
    setErr(""); 
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) { 
      setErr(error.message); 
      setLoading(false); 
    }
  }

  async function signOutAndSwitchAccount() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Reload to clear all state
    window.location.href = "/auth";
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <a href="/" style={{ display: "block", fontFamily: "var(--font-garamond, var(--serif))", fontSize: "22px", fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.02em", color: "var(--t)", textDecoration: "none", marginBottom: "56px" }}>offr</a>

        <h1 style={{ fontFamily: "var(--font-garamond, var(--serif))", fontSize: "36px", fontWeight: 400, color: "var(--t)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          {currentUser ? "Welcome back" : "Get started"}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--t3)", marginBottom: "40px", lineHeight: 1.6 }}>
          {currentUser 
            ? `Signed in as ${currentUser}. Continue or switch to a different account.`
            : "Create a new account or sign in with your Google account."}
        </p>

        {err && <p style={{ fontSize: "13px", color: "var(--rch-t)", marginBottom: "16px", padding: "12px 16px", background: "var(--rch-bg)", border: "1px solid var(--rch-b)", borderRadius: "10px" }}>{err}</p>}

        {!checking && currentUser && (
          <div style={{ marginBottom: "16px", padding: "14px 16px", background: "var(--s2)", border: "1px solid var(--b)", borderRadius: "10px" }}>
            <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "8px" }}>Currently signed in as:</p>
            <p style={{ fontSize: "13px", color: "var(--t)", fontWeight: 500, marginBottom: "12px" }}>{currentUser}</p>
            <button onClick={signOutAndSwitchAccount} disabled={loading}
              style={{
                width: "100%", padding: "8px 12px", fontSize: "12px",
                background: "transparent", border: "1px solid var(--b-strong)", borderRadius: "8px",
                color: "var(--t3)", cursor: "pointer", transition: "all 150ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--t)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--t)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--t3)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--b-strong)"; }}>
              Sign out & use different account
            </button>
          </div>
        )}

        <button onClick={handleAuthAction} disabled={loading || checking} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
          padding: "14px 24px", borderRadius: "var(--r-input)",
          background: "var(--s2)", border: "1px solid var(--b-strong)",
          color: "var(--t)", fontSize: "14px", fontWeight: 500, cursor: "pointer",
          transition: "all 150ms ease", fontFamily: "var(--font-dm, var(--sans))",
          opacity: (loading || checking) ? 0.6 : 1,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--acc)"; (e.currentTarget as HTMLElement).style.background = "var(--s3)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--b-strong)"; (e.currentTarget as HTMLElement).style.background = "var(--s2)"; }}>
          {checking ? (
            <div style={{ width: "18px", height: "18px", border: "1.5px solid var(--b-strong)", borderTopColor: "var(--t2)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : loading ? (
            <div style={{ width: "18px", height: "18px", border: "1.5px solid var(--b-strong)", borderTopColor: "var(--t2)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {checking ? "Loading…" : loading ? "Signing in…" : currentUser ? "Continue to dashboard" : "Continue with Google"}
        </button>

        <p style={{ marginTop: "24px", fontSize: "12px", color: "var(--t3)", textAlign: "center", lineHeight: 1.6 }}>
          By signing in, you agree to our terms. Your data is private and secure.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
}
