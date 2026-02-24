"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const handleAuth = async () => {
      try {
        // 1. First, try to get the session that was just created by OAuth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          router.push("/auth?error=session_error");
          return;
        }

        if (session && session.user.id) {
          console.log("OAuth session found, processing user:", session.user.id);
          return await processUser(session.user.id);
        }

        // 2. If no session immediately, set up a listener for auth state changes
        console.log("No session yet, waiting for SIGNED_IN event...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log("Auth state changed:", event);
          
          if (event === "SIGNED_IN" && newSession?.user?.id) {
            console.log("User signed in:", newSession.user.id);
            subscription.unsubscribe();
            await processUser(newSession.user.id);
          }
        });

        // Set a timeout to avoid hanging forever
        const timeout = setTimeout(() => {
          console.warn("Auth callback timeout - redirecting to auth page");
          subscription.unsubscribe();
          router.push("/auth?error=timeout");
        }, 5000);

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Callback error:", err);
        router.push("/auth?error=callback_error");
      }
    };

    const processUser = async (userId: string) => {
      try {
        console.log("Checking if profile exists for user:", userId);
        const { data: profile, error: queryError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (queryError) {
          console.error("Profile query error:", queryError);
          router.push("/onboarding"); // Default to onboarding
          return;
        }

        if (profile?.id) {
          console.log("Profile found, redirecting to dashboard");
          router.push("/dashboard");
        } else {
          console.log("No profile found, redirecting to onboarding");
          router.push("/onboarding");
        }
      } catch (err) {
        console.error("Processing error:", err);
        router.push("/onboarding");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      flexDirection: "column",
      gap: "16px",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "2px solid var(--b-strong)",
          borderTopColor: "var(--t)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }} />
        <p style={{ color: "var(--t3)", fontSize: "14px" }}>Setting up your account…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
}