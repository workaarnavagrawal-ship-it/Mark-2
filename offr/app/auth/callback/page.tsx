"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const handleAuth = async () => {
      // 1. Check if we already have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        router.push("/auth?error=session_error");
        return;
      }

      if (session) {
        return processUser(session.user.id);
      }

      // 2. If no session, set up the listener for the SIGNED_IN event
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth Event:", event); // Debugging: See if this fires
        
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          await processUser(session.user.id);
        }
      });

      // Cleanup listener if component unmounts
      return () => subscription.unsubscribe();
    };

    const processUser = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle(); // Use maybeSingle() to avoid error if not found

        if (profile) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } catch (err) {
        console.error("Processing error:", err);
        router.push("/onboarding"); // Default to onboarding if query fails
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500">Signing you in...</p>
      </div>
    </div>
  );
}