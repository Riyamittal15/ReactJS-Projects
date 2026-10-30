import { ATSCheck } from "./aiAnalysis";

/** Fast local ATS checks; no AI needed. */
export function localATSChecks(resume: string): { score: number; checks: ATSCheck[] } {
  const words = resume.trim() ? resume.trim().split(/\s+/).length : 0;
  const nonAscii = (resume.match(/[^ -~\s]/g) ?? []).length;
  const checks: ATSCheck[] = [];
  const add = (name: string, ok: boolean, detail: string, failAs: "warn" | "fail" = "fail") =>
    checks.push({ name, status: ok ? "pass" : failAs, detail });

  add("Email address", /[\w.+-]+@[\w-]+\.[\w.-]+/.test(resume), "ATS needs a plain-text email to contact you.");
  add("Phone number", /(\+?\d[\d\s().-]{8,}\d)/.test(resume), "Include a phone number in plain text.", "warn");
  add("Experience heading", /\b(experience|employment|work history)\b/i.test(resume), "Use a standard heading like 'Experience'.");
  add("Education heading", /\beducation\b/i.test(resume), "Use a standard heading like 'Education'.");
  add("Skills heading", /\bskills\b/i.test(resume), "Add a 'Skills' section so keywords parse cleanly.");
  add("Dates present", /\b(19|20)\d{2}\b/.test(resume), "Include years for roles and education.", "warn");
  add(
    "Length",
    words >= 250 && words <= 900,
    words < 250 ? `Only ${words} words; add more detail.` : `${words} words; aim for 250-900.`,
    "warn"
  );
  add(
    "Special characters",
    nonAscii <= 10,
    `${nonAscii} non-standard symbols found; fancy bullets/icons can break parsing.`,
    "warn"
  );
  add("Links", /(linkedin\.com|github\.com|https?:\/\/)/i.test(resume), "Add LinkedIn/GitHub/portfolio URL as plain text.", "warn");

  const pts = { pass: 100, warn: 50, fail: 0 };
  const score = Math.round(checks.reduce((a, c) => a + pts[c.status], 0) / checks.length);
  return { score, checks };
}
