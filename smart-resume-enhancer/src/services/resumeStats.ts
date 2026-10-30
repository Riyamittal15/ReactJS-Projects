const STOP_WORDS = new Set(
  (
    "a an and are as at be but by for from has have in is it its of on or that the this to was were will with you your " +
    "we our they their them he she his her not can may must should would could about into over than then so such if " +
    "also more most other any all each etc per via using use used work working experience years year strong ability " +
    "including include responsible looking role team join position candidate required preferred plus"
  ).split(" ")
);

const ACTION_VERBS = [
  "led", "built", "developed", "designed", "created", "improved", "increased", "reduced", "launched",
  "implemented", "managed", "delivered", "optimized", "automated", "architected", "migrated", "mentored",
  "analyzed", "owned", "drove", "shipped", "established", "streamlined", "collaborated", "resolved",
];

const SECTIONS: Record<string, RegExp> = {
  Summary: /\b(summary|objective|profile|about me)\b/i,
  Experience: /\b(experience|employment|work history)\b/i,
  Education: /\b(education|academic|university|degree)\b/i,
  Skills: /\b(skills|technologies|tech stack|competencies)\b/i,
  Projects: /\bprojects?\b/i,
  Certifications: /\b(certifications?|certificates?|awards?)\b/i,
};

export interface ResumeStats {
  words: number;
  characters: number;
  readingMinutes: number;
  uniqueWords: number;
  actionVerbs: number;
  metrics: number;
  sections: { name: string; found: boolean }[];
  topWords: { word: string; count: number }[];
  matched: string[];
  missing: string[];
  keywordScore: number | null; // 0-100, null when no job description
  overallScore: number;
}

const tokenize = (text: string) =>
  text.toLowerCase().match(/[a-z][a-z0-9+#.]*[a-z0-9+#]|[a-z]/g) ?? [];

export function analyzeResume(resume: string, jobDescription: string): ResumeStats {
  const tokens = tokenize(resume);
  const words = tokens.length;
  const resumeSet = new Set(tokens);

  const freq = new Map<string, number>();
  tokens.forEach((t) => {
    if (t.length > 2 && !STOP_WORDS.has(t)) freq.set(t, (freq.get(t) ?? 0) + 1);
  });
  const topWords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  const actionVerbs = tokens.filter((t) => ACTION_VERBS.includes(t)).length;
  const metrics = (resume.match(/\d+(?:[.,]\d+)?\s?(?:%|x\b|k\b|m\b|\+)|[$€£]\s?\d+/gi) ?? []).length;
  const sections = Object.entries(SECTIONS).map(([name, re]) => ({ name, found: re.test(resume) }));

  const jdFreq = new Map<string, number>();
  tokenize(jobDescription).forEach((t) => {
    if (t.length > 2 && !STOP_WORDS.has(t)) jdFreq.set(t, (jdFreq.get(t) ?? 0) + 1);
  });
  const jdKeywords = Array.from(jdFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([w]) => w);
  const matched = jdKeywords.filter((k) => resumeSet.has(k));
  const missing = jdKeywords.filter((k) => !resumeSet.has(k));
  const keywordScore = jdKeywords.length ? Math.round((matched.length / jdKeywords.length) * 100) : null;

  const sectionScore = (sections.filter((s) => s.found).length / sections.length) * 100;
  const verbScore = Math.min(actionVerbs / 8, 1) * 100;
  const metricScore = Math.min(metrics / 5, 1) * 100;
  const lengthScore = words === 0 ? 0 : words >= 300 && words <= 800 ? 100 : words < 300 ? (words / 300) * 100 : Math.max(40, 100 - (words - 800) / 10);
  const parts = [sectionScore, verbScore, metricScore, lengthScore];
  if (keywordScore !== null) parts.push(keywordScore, keywordScore); // weight JD match double
  const overallScore = words === 0 ? 0 : Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);

  return {
    words,
    characters: resume.length,
    readingMinutes: Math.max(1, Math.round(words / 200)),
    uniqueWords: resumeSet.size,
    actionVerbs,
    metrics,
    sections,
    topWords,
    matched,
    missing,
    keywordScore,
    overallScore,
  };
}
