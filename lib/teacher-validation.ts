export const TEACHER_EXPERTISE_FIELDS = [
  "Computer Science",
  "Information Technology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Business Administration",
  "Economics",
  "English",
  "History",
] as const;

export type TeacherExpertise = (typeof TEACHER_EXPERTISE_FIELDS)[number];
export const CUSTOM_TEACHER_EXPERTISE = "__CUSTOM__";

const COLLEGE_ID_REGEX = /^[A-Z0-9-]{6,20}$/;
const EXPERTISE_TEXT_REGEX = /^[A-Za-z0-9&(),.\-+/\s]{2,120}$/;

export function normalizeCollegeId(raw: string) {
  return raw.trim().toUpperCase();
}

export function validateCollegeId(raw: string) {
  const normalized = normalizeCollegeId(raw);
  if (!COLLEGE_ID_REGEX.test(normalized)) {
    return {
      ok: false as const,
      message: "College ID must be 6-20 chars using A-Z, 0-9, or hyphen.",
    };
  }
  return { ok: true as const, value: normalized };
}

export function validateTeacherExpertise(raw: string) {
  const normalized = raw.trim();
  const isListed = TEACHER_EXPERTISE_FIELDS.includes(normalized as TeacherExpertise);
  if (isListed) {
    return { ok: true as const, value: normalized as TeacherExpertise };
  }

  if (!EXPERTISE_TEXT_REGEX.test(normalized)) {
    return {
      ok: false as const,
      message: "Enter a valid field of expertise (2-120 chars; letters, numbers, spaces, and basic punctuation).",
    };
  }
  return { ok: true as const, value: normalized };
}
