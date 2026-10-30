import React from "react";
import { Box, Chip, CircularProgress, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { ResumeStats as Stats } from "../../services/resumeStats";
import { AIScoreResult } from "../../services/aiAnalysis";

const scoreColor = (n: number): "success" | "warning" | "error" => (n >= 75 ? "success" : n >= 50 ? "warning" : "error");

export function Gauge({ value, label }: { value: number; label: string }) {
  return (
    <Stack alignItems="center" spacing={1}>
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress variant="determinate" value={100} size={110} thickness={5} sx={{ color: "grey.200" }} />
        <CircularProgress
          variant="determinate"
          value={value}
          size={110}
          thickness={5}
          color={scoreColor(value)}
          sx={{ position: "absolute", left: 0 }}
        />
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            {value}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

export function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {value}
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={Math.min(100, (value / max) * 100)} sx={{ height: 8, borderRadius: 4 }} />
    </Box>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h5" fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export default function ResumeStats({ stats, ai }: { stats: Stats; ai?: AIScoreResult | null }) {
  const maxTop = stats.topWords[0]?.count ?? 1;
  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-around" flexWrap="wrap" gap={3}>
          {ai && <Gauge value={ai.overall} label="AI score" />}
          <Gauge value={stats.overallScore} label={ai ? "Quick score (heuristic)" : "Overall score"} />
          {stats.keywordScore !== null && <Gauge value={stats.keywordScore} label="JD keyword match" />}
        </Stack>
      </Paper>

      {ai && (
        <Section title="AI section scores">
          {ai.sections.map((sec) => (
            <Bar key={sec.name} label={sec.name} value={sec.score} max={100} />
          ))}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Strengths
              </Typography>
              {ai.strengths.map((t) => (
                <Typography key={t} variant="body2" sx={{ mb: 0.5 }}>
                  • {t}
                </Typography>
              ))}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="error.main" gutterBottom>
                Weaknesses
              </Typography>
              {ai.weaknesses.map((t) => (
                <Typography key={t} variant="body2" sx={{ mb: 0.5 }}>
                  • {t}
                </Typography>
              ))}
            </Grid>
          </Grid>
        </Section>
      )}

      <Grid container spacing={2}>
        {[
          ["Words", stats.words],
          ["Unique words", stats.uniqueWords],
          ["Read time", `${stats.readingMinutes} min`],
          ["Characters", stats.characters],
        ].map(([label, value]) => (
          <Grid key={label} size={{ xs: 6, sm: 3 }}>
            <Tile label={String(label)} value={value} />
          </Grid>
        ))}
      </Grid>

      <Section title="Impact">
        <Bar label="Action verbs (goal 8+)" value={stats.actionVerbs} max={8} />
        <Bar label="Quantified results (goal 5+)" value={stats.metrics} max={5} />
      </Section>

      <Section title="Sections detected">
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {stats.sections.map((s) => (
            <Chip
              key={s.name}
              size="small"
              label={`${s.found ? "✓" : "✗"} ${s.name}`}
              color={s.found ? "success" : "error"}
              variant="outlined"
            />
          ))}
        </Stack>
      </Section>

      {stats.topWords.length > 0 && (
        <Section title="Top keywords in resume">
          {stats.topWords.map((w) => (
            <Bar key={w.word} label={w.word} value={w.count} max={maxTop} />
          ))}
        </Section>
      )}

      {stats.keywordScore !== null && (
        <Section title="Job description keywords">
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            {stats.matched.map((k) => (
              <Chip key={k} size="small" label={k} color="success" />
            ))}
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {stats.missing.map((k) => (
              <Chip key={k} size="small" label={k} color="error" variant="outlined" />
            ))}
          </Stack>
        </Section>
      )}
    </Stack>
  );
}
