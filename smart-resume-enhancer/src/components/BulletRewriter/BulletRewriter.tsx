import React, { useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Collapse, Paper, Skeleton, Stack, Typography } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { rewriteBullet } from "../../services/aiAnalysis";

interface Props {
  resumeText: string;
  jobDescription: string;
  onAccept: (original: string, replacement: string) => void;
}

interface RewriteState {
  loading: boolean;
  options: string[];
  error?: string;
}

const splitLines = (text: string) =>
  text
    .split(/\n|[•●▪◦]|(?<=\.)\s+(?=[A-Z])/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 30 && !/^(https?:|Links:)/i.test(l))
    .slice(0, 40);

export default function BulletRewriter({ resumeText, jobDescription, onAccept }: Props) {
  const lines = useMemo(() => splitLines(resumeText), [resumeText]);
  const [open, setOpen] = useState<string | null>(null);
  const [state, setState] = useState<Record<string, RewriteState>>({});
  const [copied, setCopied] = useState("");

  const run = async (line: string) => {
    if (open === line) return setOpen(null);
    setOpen(line);
    if (state[line]?.options.length) return;
    setState((s) => ({ ...s, [line]: { loading: true, options: [] } }));
    try {
      const options = await rewriteBullet(line, jobDescription);
      setState((s) => ({ ...s, [line]: { loading: false, options } }));
    } catch (e) {
      setState((s) => ({ ...s, [line]: { loading: false, options: [], error: (e as Error).message } }));
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 1500);
  };

  if (!lines.length) return <Alert severity="info">Upload a resume to rewrite its lines.</Alert>;

  return (
    <Stack spacing={2}>
      <Alert severity="info" icon={<AutoFixHighIcon />}>
        Pick a line to get 3 stronger versions. Placeholders like <b>[X%]</b> need your real numbers.
      </Alert>
      {lines.map((line, i) => {
        const st = state[line];
        const isOpen = open === line;
        return (
          <Paper
            key={line}
            sx={{
              p: 2,
              borderLeft: "4px solid",
              borderLeftColor: isOpen ? "primary.main" : "divider",
              transition: "all 0.2s",
              "&:hover": { boxShadow: "0 6px 20px rgba(79,70,229,0.12)" },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Chip size="small" label={i + 1} sx={{ mt: 0.25 }} />
              <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.7 }}>
                {line}
              </Typography>
              <Button
                size="small"
                variant={isOpen ? "contained" : "outlined"}
                startIcon={<AutoFixHighIcon />}
                onClick={() => run(line)}
                sx={{ flexShrink: 0 }}
              >
                {isOpen ? "Hide" : "Rewrite"}
              </Button>
            </Stack>

            <Collapse in={isOpen} unmountOnExit>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {st?.loading && (
                  <>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} />
                      <Typography variant="caption" color="text.secondary">
                        Writing options...
                      </Typography>
                    </Stack>
                    <Skeleton variant="rounded" height={56} />
                    <Skeleton variant="rounded" height={56} />
                  </>
                )}
                {st?.error && <Alert severity="error">{st.error}</Alert>}
                {st?.options.map((opt, n) => (
                  <Box
                    key={opt}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(79,70,229,0.05)",
                      border: "1px solid rgba(79,70,229,0.15)",
                    }}
                  >
                    <Typography variant="overline" color="primary" fontWeight={700}>
                      Option {n + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                      {opt}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckIcon />}
                        onClick={() => {
                          onAccept(line, opt);
                          setOpen(null);
                        }}
                      >
                        Use this
                      </Button>
                      <Button
                        size="small"
                        color={copied === opt ? "success" : "primary"}
                        startIcon={copied === opt ? <CheckIcon /> : <ContentCopyIcon />}
                        onClick={() => copy(opt)}
                      >
                        {copied === opt ? "Copied" : "Copy"}
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Collapse>
          </Paper>
        );
      })}
    </Stack>
  );
}
