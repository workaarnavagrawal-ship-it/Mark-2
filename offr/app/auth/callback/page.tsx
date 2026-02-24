import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const cookieStore = cookies();
  const code = searchParams.code;

  if (!code) {
    console.error("[Callback] No code provided");
    return NextResponse.redirect(new URL("/auth?error=no_code", process.env.NEXT_PUBLIC_SUPABASE_URL!));
  }

  // Create a response object that we'll return with cookies
  let response = NextResponse.next();
  
  // Create server client with proper cookie handling that updates our response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          // Set cookies in the cookie store
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
          // Also set them on our response object
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange the code for a session
  console.log("[Callback] Exchanging code for session...");
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  
  if (exchangeError) {
    console.error("[Callback] Code exchange failed:", exchangeError);
    return NextResponse.redirect(new URL("/auth?error=code_exchange_failed", process.env.NEXT_PUBLIC_SUPABASE_URL!));
  }

  console.log("[Callback] Code exchange successful");

  // Verify session was created
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.id) {
    console.error("[Callback] No session after code exchange");
    return NextResponse.redirect(new URL("/auth?error=no_session", process.env.NEXT_PUBLIC_SUPABASE_URL!));
  }

  console.log("[Callback] Session created for user:", session.user.id);

  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("[Callback] Profile query error:", profileError);
  }

  // Redirect based on profile status
  if (profile?.id) {
    console.log("[Callback] Profile exists, redirecting to /dashboard");
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_SUPABASE_URL!));
  } else {
    console.log("[Callback] No profile, redirecting to /onboarding");
    return NextResponse.redirect(new URL("/onboarding", process.env.NEXT_PUBLIC_SUPABASE_URL!));
  }
}