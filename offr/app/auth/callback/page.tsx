"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const handleCallback = useCallback(async () => {
    if (!code) {
      console.error("[Callback] No code provided");
      router.push("/auth?error=no_code");
      return;
    }

    try {
      console.log("[Callback] Exchanging code for session...");
      const supabase = createClient();

      // Exchange the code for a session
      // This will use the PKCE verifier stored in localStorage from the initial OAuth flow
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("[Callback] Code exchange failed:", exchangeError);
        router.push("/auth?error=code_exchange_failed");
        return;
      }

      console.log("[Callback] Code exchange successful");

      // Get the session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user?.id) {
        console.error("[Callback] Session error:", sessionError || "No session after code exchange");
        router.push("/auth?error=no_session");
        return;
      }

      const userId = session.user.id;
      console.log("[Callback] Session established for user:", userId);

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("[Callback] Profile query error:", profileError);
      }

      // Redirect based on profile status
      if (profile?.id) {
        console.log("[Callback] Profile exists, redirecting to /dashboard");
        router.push("/dashboard");
      } else {
        console.log("[Callback] No profile, redirecting to /onboarding");
        router.push("/onboarding");
      }
    } catch (err) {
      console.error("[Callback] Unexpected error:", err);
      router.push("/auth?error=callback_error");
    }
  }, [code, router]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we authenticate you.</p>
      </div>
    </div>
  );
}