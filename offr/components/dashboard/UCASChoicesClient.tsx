"use client";

import { useEffect, useState } from "react";
import { getUCASChoices, addUCASChoice, deleteUCASChoice, updateUCASChoice } from "@/lib/profile";
import type { UCASChoice, Profile } from "@/lib/types";

interface Course {
  id: string;
  name: string;
  university: string;
  university_id: string;
}

export default function UCASChoicesClient({ userProfile }: { userProfile: Profile }) {
  const [choices, setChoices] = useState<UCASChoice[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [assessing, setAssessing] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<any[]>([]);

  // Load UCAS choices and available courses
  useEffect(() => {
    loadChoices();
    loadCourses();
  }, []);

  async function loadChoices() {
    try {
      const data = await getUCASChoices();
      setChoices(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load UCAS choices:", err);
      setLoading(false);
    }
  }

  async function loadCourses() {
    try {
      const res = await fetch("/api/py/courses");
      const data = await res.json();
      setCourses(data);
      setFilteredCourses(data);
    } catch (err) {
      console.error("Failed to load courses:", err);
    }
  }

  function handleSearchChange(query: string) {
    setSearchQuery(query);
    const lower = query.toLowerCase();
    const filtered = courses.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.university.toLowerCase().includes(lower)
    );
    setFilteredCourses(filtered);
  }

  async function addCourse(position: number, course: Course) {
    try {
      await addUCASChoice(position, course.id, course.name, course.university_id, course.university);
      await loadChoices();
      setSelectedPosition(null);
      setSearchQuery("");
      setFilteredCourses(courses);
    } catch (err) {
      console.error("Failed to add UCAS choice:", err);
    }
  }

  async function removeCourse(position: number) {
    try {
      await deleteUCASChoice(position);
      await loadChoices();
    } catch (err) {
      console.error("Failed to remove UCAS choice:", err);
    }
  }

  async function updateLabel(position: number, label: "Firm" | "Insurance" | "Backup" | undefined) {
    try {
      await updateUCASChoice(position, { label });
      await loadChoices();
    } catch (err) {
      console.error("Failed to update label:", err);
    }
  }

  async function assessAllChoices() {
    try {
      setAssessing(true);
      const choicesWithoutEmpty = choices.filter((c) => c.course_id);
      if (choicesWithoutEmpty.length === 0) {
        alert("Please add at least one course before assessing.");
        return;
      }

      const res = await fetch("/api/py/assess_bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choices: choicesWithoutEmpty,
          profile: userProfile,
        }),
      });

      if (!res.ok) throw new Error("Assessment failed");
      const results = await res.json();
      setAssessmentResults(results);
    } catch (err) {
      console.error("Failed to assess choices:", err);
      alert("Assessment failed. Please try again.");
    } finally {
      setAssessing(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading UCAS choices...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">UCAS Choices</h2>
        <p className="text-gray-600">Manually add and assess up to 5 university courses.</p>
      </div>

      {/* 5 Choice Slots */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((position) => {
          const choice = choices.find((c) => c.position === position);
          return (
            <div
              key={position}
              className="border rounded-lg p-4 bg-white"
              style={{
                borderLeft: choice?.label === "Firm" ? "4px solid #059669" : "4px solid #d1d5db",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-500">Choice {position}</div>
                  {choice?.course_id ? (
                    <div>
                      <div className="font-semibold text-gray-900">{choice.course_name}</div>
                      <div className="text-sm text-gray-600">{choice.university_name}</div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm italic">No course selected</div>
                  )}
                </div>
                {choice?.course_id && (
                  <button
                    onClick={() => removeCourse(position)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              {choice?.course_id ? (
                // Label selector for existing choice
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Label:</label>
                  <select
                    value={choice.label || ""}
                    onChange={(e) =>
                      updateLabel(
                        position,
                        (e.target.value as "Firm" | "Insurance" | "Backup") || undefined
                      )
                    }
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">None</option>
                    <option value="Firm">Firm</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Backup">Backup</option>
                  </select>
                </div>
              ) : (
                // Course picker for empty slot
                <div className="relative">
                  <button
                    onClick={() => setSelectedPosition(selectedPosition === position ? null : position)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {selectedPosition === position ? "Close" : "Add Course"}
                  </button>

                  {selectedPosition === position && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10">
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-3"
                      />
                      <div className="max-h-64 overflow-y-auto">
                        {filteredCourses.length > 0 ? (
                          filteredCourses.map((course) => (
                            <button
                              key={course.id}
                              onClick={() => addCourse(position, course)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{course.name}</div>
                              <div className="text-xs text-gray-500">{course.university}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No courses found. Try a different search.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assess Button */}
      <button
        onClick={assessAllChoices}
        disabled={assessing || choices.filter((c) => c.course_id).length === 0}
        className={`w-full py-3 rounded-lg font-semibold text-white transition ${
          assessing || choices.filter((c) => c.course_id).length === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {assessing ? "Assessing..." : "Assess All Choices"}
      </button>

      {/* Assessment Results */}
      {assessmentResults.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Assessment Results</h3>
          {assessmentResults.map((result, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
              <div className="font-semibold text-gray-900 mb-2">
                {result.course_name} - {result.university_name}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Band</div>
                  <div className="font-semibold text-gray-900">{result.band}</div>
                </div>
                <div>
                  <div className="text-gray-600">Chance</div>
                  <div className="font-semibold text-gray-900">{result.chance_percent}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Prediction</div>
                  <div className="font-semibold text-gray-900">{result.prediction}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
