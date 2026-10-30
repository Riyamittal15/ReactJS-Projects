import React, { useMemo, useState } from "react";
import { Alert, Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText, Paper, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import { Gauge } from "../ResumeStats/ResumeStats";
import { ATSCheck, atsReview } from "../../services/aiAnalysis";
import { localATSChecks } from "../../services/atsCheck";

const icon = (s: ATSCheck["status"]) =>
  s === "pass" ? <CheckCircleIcon color="success" /> : s === "warn" ? <WarningIcon color="warning" /> : <ErrorIcon color="error" />;

function Checks({ checks }: { checks: ATSCheck[] }) {
  return (
    <List dense>
      {checks.map((c) => (
        <ListItem key={c.name}>
          <ListItemIcon sx={{ minWidth: 36 }}>{icon(c.status)}</ListItemIcon>
          <ListItemText primary={c.name} secondary={c.detail} />
        </ListItem>
      ))}
    </List>
  );
}

export default function ATSChecker({ resumeText }: { resumeText: string }) {
  const local = useMemo(() => localATSChecks(resumeText), [resumeText]);
  const [ai, setAi] = useState<{ score: number; checks: ATSCheck[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!resumeText) return <Alert severity="info">Upload a resume to run the ATS check.</Alert>;

  const runAI = async () => {
    setLoading(true);
    setError("");
    try {
      setAi(await atsReview(resumeText));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-around" flexWrap="wrap" gap={3}>
          <Gauge value={local.score} label="ATS score (rule-based)" />
          {ai && <Gauge value={ai.score} label="ATS score (AI)" />}
        </Stack>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Rule-based checks</Typography>
        <Checks checks={local.checks} />
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">AI ATS review</Typography>
          <Button
            variant="contained"
            onClick={runAI}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {loading ? "Reviewing..." : ai ? "Re-run" : "Run AI review"}
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {ai && <Checks checks={ai.checks} />}
      </Paper>
    </Stack>
  );
}
