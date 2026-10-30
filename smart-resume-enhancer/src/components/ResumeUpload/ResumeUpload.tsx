import React, { useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ResumeStats from "../ResumeStats/ResumeStats";
import { analyzeResume } from "../../services/resumeStats";
import { extractPdfText } from "../../services/pdfExtract";
import { AIScoreResult, scoreResume } from "../../services/aiAnalysis";
import { streamOllama } from "../../services/ollamaService";
import BulletRewriter from "../BulletRewriter/BulletRewriter";
import KeywordSuggestions from "../KeywordSuggestions/KeywordSuggestions";
import ATSChecker from "../ATSChecker/ATSChecker";

export default function ResumeUpload() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [feedback, setFeedback] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [ai, setAi] = useState<AIScoreResult | null>(null);
  const [scoring, setScoring] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const stats = useMemo(() => analyzeResume(resumeText, jobDescription), [resumeText, jobDescription]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");

    extractPdfText(file)
      .then((parsedText) => setResumeText(parsedText))
      .catch((err) => {
        console.error("Failed to extract text from pdf", err);
        setError("Failed to extract text from PDF.");
      });
  };

  const getFeedback = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    setFeedback(""); // clear old result

    const prompt = `
  You are a professional resume reviewer.
  Analyze the following resume and job description, and give clear, actionable improvement suggestions.
  Format the answer in Markdown, concise and skimmable, using exactly these sections:
  ## Summary
  (2 sentences)
  ## Strengths
  (3-5 bullet points)
  ## Gaps vs Job Description
  (3-5 bullet points)
  ## Top Fixes
  (numbered list, most impactful first, each starting with a **bold action phrase**)
  Never invent experience. Keep bullets under 25 words.
  
  Resume:
  ${resumeText}
  
  Job Description:
  ${jobDescription}
    `;

    try {
      await streamOllama(prompt, { signal: controller.signal, onToken: (_t, full) => setFeedback(full) });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const stopFeedback = () => abortRef.current?.abort();

  const runScore = async () => {
    setScoring(true);
    setError("");
    try {
      setAi(await scoreResume(resumeText, jobDescription));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setScoring(false);
    }
  };

  const acceptRewrite = (original: string, replacement: string) =>
    setResumeText((t) => t.replace(original, replacement));

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
              Upload resume (PDF)
              <input type="file" accept="application/pdf" hidden onChange={handleFile} />
            </Button>
            {fileName && (
              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 2 }}>
                {fileName}
              </Typography>
            )}
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Extracted Resume Text"
            value={resumeText}
            multiline
            minRows={6}
            maxRows={10}
            fullWidth
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            label="Paste Job Description here"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            multiline
            minRows={5}
            maxRows={10}
            fullWidth
          />
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {resumeText && (
        <>
          <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable">
            <Tab label="Overview" />
            <Tab label="Rewrite bullets" />
            <Tab label="ATS check" />
            <Tab label="AI feedback" />
          </Tabs>

          {tab === 0 && (
            <Stack spacing={3}>
              <Box>
                <Button
                  variant="contained"
                  onClick={runScore}
                  disabled={scoring}
                  startIcon={scoring ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  {scoring ? "Scoring..." : ai ? "Re-run AI score" : "Get AI score"}
                </Button>
              </Box>
              <ResumeStats stats={stats} ai={ai} />
              {jobDescription.trim() && (
                <KeywordSuggestions missing={stats.missing} resumeText={resumeText} jobDescription={jobDescription} />
              )}
            </Stack>
          )}

          {tab === 1 && (
            <BulletRewriter resumeText={resumeText} jobDescription={jobDescription} onAccept={acceptRewrite} />
          )}

          {tab === 2 && <ATSChecker resumeText={resumeText} />}

          {tab === 3 && (
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={getFeedback}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                  >
                    {loading ? "Analyzing..." : "Get AI Feedback (Local)"}
                  </Button>
                  {loading && (
                    <Button color="error" onClick={stopFeedback}>
                      Stop
                    </Button>
                  )}
                </Stack>
              </Box>
              {feedback && (
                <Paper
                  sx={{
                    p: { xs: 2.5, sm: 4 },
                    "& h2": {
                      fontSize: 18,
                      fontWeight: 700,
                      color: "primary.main",
                      mt: 3,
                      mb: 1,
                      pb: 0.5,
                      borderBottom: "2px solid rgba(79,70,229,0.15)",
                      "&:first-of-type": { mt: 0 },
                    },
                    "& p": { lineHeight: 1.8, my: 1, color: "text.secondary" },
                    "& ul, & ol": { pl: 3, my: 1 },
                    "& li": { lineHeight: 1.75, mb: 0.75, pl: 0.5 },
                    "& ul li::marker": { color: "#7c3aed" },
                    "& ol li::marker": { color: "#ec4899", fontWeight: 700 },
                    "& strong": { color: "text.primary" },
                  }}
                >
                  <ReactMarkdown>{feedback}</ReactMarkdown>
                </Paper>
              )}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
