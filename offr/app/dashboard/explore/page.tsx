import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExploreClient } from "@/components/dashboard/ExploreClient";

export default async function ExplorePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase.from("profiles").select("interests").eq("user_id", user.id).single();

  // Fetch real courses from API
  let courses = [];
  let universities = [];
  try {
    const [coursesRes, unisRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://mark-2-nu.vercel.app"}/api/py/courses`, { cache: "no-store" }),
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://mark-2-nu.vercel.app"}/api/py/universities`, { cache: "no-store" }),
    ]);
    if (coursesRes.ok) courses = await coursesRes.json();
    if (unisRes.ok) universities = await unisRes.json();
  } catch (e) {
    console.error("Failed to fetch courses:", e);
  }

  return <ExploreClient interests={profile?.interests || []} courses={courses} universities={universities} />;
}