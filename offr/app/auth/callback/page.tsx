import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; token_hash?: string; type?: string };
}) {
  const supabase = createClient();

  // Exchange the OAuth code for a session on the server side
  if (searchParams.code) {
    console.log("Exchanging OAuth code for session");
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code);
    if (error) {
      console.error("Code exchange error:", error);
      redirect("/auth?error=code_exchange_failed");
    }
  }

  // Get the session (which should now be established after code exchange)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session || !session.user) {
    console.error("Session error:", sessionError || "No session found after code exchange");
    redirect("/auth?error=no_session");
  }

  const userId = session.user.id;
  console.log("Session established for user:", userId);

  // Check if profile exists
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Profile query error:", profileError);
      // Even if profile query fails, still redirect to onboarding
      redirect("/onboarding");
    }

    if (profile?.id) {
      console.log("Profile found, redirecting to dashboard");
      redirect("/dashboard");
    } else {
      console.log("No profile found, redirecting to onboarding");
      redirect("/onboarding");
    }
  } catch (err) {
    console.error("Profile check error:", err);
    // Default to onboarding if anything goes wrong
    redirect("/onboarding");
  }
}