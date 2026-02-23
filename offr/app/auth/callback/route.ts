import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as any;

  console.log("AUTH CALLBACK:", { code: !!code, token_hash: !!token_hash, type });

  const supabase = createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    console.log("verifyOtp error:", error);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
        if (!profile) return NextResponse.redirect(`${origin}/onboarding`);
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("exchangeCodeForSession error:", error);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
        if (!profile) return NextResponse.redirect(`${origin}/onboarding`);
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }
    return NextResponse.redirect(`${origin}/auth?error=${error?.message || "exchange_failed"}`);
  }

  return NextResponse.redirect(`${origin}/auth?error=no_code`);
}