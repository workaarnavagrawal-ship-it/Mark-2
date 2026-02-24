import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UCASChoicesClient from "@/components/dashboard/UCASChoicesClient";

export default async function UCASPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <UCASChoicesClient userProfile={profile} />
    </div>
  );
}
