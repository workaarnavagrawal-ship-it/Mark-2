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
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code);
    if (error) {
      redirect("/auth?error=code_exchange_failed");
    }
  }

  // Get the session (which should now be established after code exchange)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    redirect("/auth?error=no_session");
  }

  const userId = session.user.id;

  // Check if profile exists
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      redirect("/onboarding");
    }

    if (profile?.id) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  } catch {
    redirect("/onboarding");
  }
}