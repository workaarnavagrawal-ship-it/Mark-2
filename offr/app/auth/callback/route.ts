import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * OAuth callback Route Handler.
 *
 * Must be a Route Handler (not a Server Component page) so that
 * `exchangeCodeForSession` can write the session cookies to the response.
 * In a Server Component, `cookies().set()` is read-only and silently fails,
 * meaning the session is never persisted and every login attempt redirects
 * straight back to /auth.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // exchangeCodeForSession updates the in-memory client state; use
      // getUser() (not getSession()) to read the now-authenticated user.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Route to onboarding if first-time user, dashboard otherwise.
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        const destination = profile?.id ? "/dashboard" : "/onboarding";
        return NextResponse.redirect(new URL(destination, origin));
      }
    }
  }

  // Fall-through: code missing, exchange failed, or no user — send back to auth.
  return NextResponse.redirect(new URL("/auth?error=auth_failed", origin));
}
