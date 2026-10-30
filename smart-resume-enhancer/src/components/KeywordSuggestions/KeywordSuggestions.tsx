import React, { useState } from "react";
import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";
import { suggestKeyword } from "../../services/aiAnalysis";

interface Props {
  missing: string[];
  resumeText: string;
  jobDescription: string;
}

export default function KeywordSuggestions({ missing, resumeText, jobDescription }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  if (!missing.length) return null;

  const pick = async (keyword: string) => {
    setSelected(keyword);
    setError("");
    if (answers[keyword]) return;
    try {
      await suggestKeyword(keyword, resumeText, jobDescription, (full) =>
        setAnswers((a) => ({ ...a, [keyword]: full }))
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Missing keyword suggestions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click a missing keyword to see where and how it could honestly fit.
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {missing.map((k) => (
          <Chip
            key={k}
            label={k}
            color="error"
            variant={selected === k ? "filled" : "outlined"}
            onClick={() => pick(k)}
          />
        ))}
      </Stack>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {selected && answers[selected] && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2, whiteSpace: "pre-wrap" }}>
          <Typography variant="subtitle2" gutterBottom>
            {selected}
          </Typography>
          <Typography variant="body2">{answers[selected]}</Typography>
        </Paper>
      )}
    </Paper>
  );
}
