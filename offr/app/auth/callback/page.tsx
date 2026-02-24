import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; token_hash?: string; type?: string };
}) {
  const supabase = createClient();

  try {
    // Exchange the OAuth code for a session on the server side
    if (searchParams.code) {
      console.log("Exchanging OAuth code for session");
      const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code);
      if (error) {
        console.error("Code exchange error:", error);
        redirect("/auth?error=code_exchange_failed");
      }
    }

    // Verify we have a session now
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User fetch error:", userError);
      redirect("/auth?error=no_user");
    }

    console.log("User authenticated:", user.id);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile query error:", profileError);
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
    console.error("Callback error:", err);
    redirect("/auth?error=callback_error");
  }

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