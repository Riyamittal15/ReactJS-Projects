import { generateJSON, streamOllama } from "./ollamaService";

const MAX_CHARS = 6000;
const cut = (s: string) => s.slice(0, MAX_CHARS);
const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const strings = (a: unknown, max = 6): string[] =>
  Array.isArray(a) ? a.map((x) => String(x).trim()).filter(Boolean).slice(0, max) : [];

export interface AIScoreResult {
  overall: number;
  sections: { name: string; score: number }[];
  strengths: string[];
  weaknesses: string[];
}

export async function scoreResume(resume: string, jd: string, signal?: AbortSignal): Promise<AIScoreResult> {
  const raw = await generateJSON<any>(
    `You are a strict professional resume reviewer. Score the resume${jd.trim() ? " against the job description" : ""}.
Return ONLY JSON in exactly this shape (all scores are integers 0-100):
{"overall":0,"sections":[{"name":"Content quality","score":0},{"name":"Impact & metrics","score":0},{"name":"Clarity & formatting","score":0},{"name":"Skills relevance","score":0},{"name":"JD alignment","score":0}],"strengths":["..."],"weaknesses":["..."]}
Give 3-5 short, specific strengths and weaknesses.

Resume:
${cut(resume)}

Job Description:
${cut(jd) || "(none provided)"}`,
    signal
  );
  return {
    overall: clamp(raw.overall),
    sections: (Array.isArray(raw.sections) ? raw.sections : []).slice(0, 8).map((s: any) => ({
      name: String(s?.name ?? "Section"),
      score: clamp(s?.score),
    })),
    strengths: strings(raw.strengths),
    weaknesses: strings(raw.weaknesses),
  };
}

export async function rewriteBullet(bullet: string, jd: string, signal?: AbortSignal): Promise<string[]> {
  const raw = await generateJSON<any>(
    `Rewrite this resume line in 3 stronger versions. Start with a strong action verb, be concise, and add quantified impact
ONLY as clearly marked placeholders like [X%] or [N users] — never invent facts. Keep the original meaning.
${jd.trim() ? `Align wording with this job description where truthful:\n${cut(jd).slice(0, 1500)}\n` : ""}
Return ONLY JSON: {"rewrites":["...","...","..."]}

Line: ${bullet}`,
    signal
  );
  return strings(raw.rewrites, 3);
}

export function suggestKeyword(
  keyword: string,
  resume: string,
  jd: string,
  onToken: (full: string) => void,
  signal?: AbortSignal
) {
  return streamOllama(
    `The job description wants the keyword "${keyword}" but the resume does not contain it.
In under 80 words: (1) say which resume section/role it could honestly fit, (2) give one sample bullet using it.
If the resume shows no related experience, say so plainly and suggest how to gain it instead. Do not fabricate experience.

Resume:
${cut(resume)}

Job Description:
${cut(jd).slice(0, 2000)}`,
    { signal, onToken: (_t, full) => onToken(full) }
  );
}

export interface ATSCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export async function atsReview(resume: string, signal?: AbortSignal): Promise<{ score: number; checks: ATSCheck[] }> {
  const raw = await generateJSON<any>(
    `You are an Applicant Tracking System (ATS) parser auditor. Review the extracted resume text for ATS compatibility:
parsing problems, missing/nonstandard section headings, unclear dates, missing contact info, keyword stuffing, odd symbols.
Return ONLY JSON: {"score":0,"checks":[{"name":"...","status":"pass|warn|fail","detail":"..."}]}
Give 5-8 checks, score is an integer 0-100.

Resume text:
${cut(resume)}`,
    signal
  );
  const status = (s: unknown): ATSCheck["status"] => (s === "pass" || s === "fail" ? s : "warn");
  return {
    score: clamp(raw.score),
    checks: (Array.isArray(raw.checks) ? raw.checks : []).slice(0, 10).map((c: any) => ({
      name: String(c?.name ?? "Check"),
      status: status(c?.status),
      detail: String(c?.detail ?? ""),
    })),
  };
}
