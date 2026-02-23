"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        router.push("/auth?error=" + encodeURIComponent(error.message));
        return;
      }

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .single();
        router.push(profile ? "/dashboard" : "/onboarding");
        return;
      }

      // No session yet — wait for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", session.user.id)
            .single();
          router.push(profile ? "/dashboard" : "/onboarding");
        } else if (event === "SIGNED_OUT") {
          subscription.unsubscribe();
          router.push("/auth?error=sign_in_failed");
        }
      });
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500">Signing you in…</p>
      </div>
    </div>
  );
}
