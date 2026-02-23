import type { CourseDetail, CourseListItem, OfferAssessRequest, OfferAssessResponse, UniversityItem } from "./types";

const BASE = "/api/py";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const getUniversities = () => apiFetch<UniversityItem[]>("/universities");
export const getCourses = (university_id?: string) =>
  apiFetch<CourseListItem[]>(`/courses${university_id ? `?university_id=${university_id}` : ""}`);
export const getCourseDetail = (course_id: string) =>
  apiFetch<CourseDetail>(`/course/${course_id}`);
export const postOfferAssess = (body: OfferAssessRequest) =>
  apiFetch<OfferAssessResponse>("/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
