import React from "react";
import { Box, Container, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ResumeUpload from "./components/ResumeUpload/ResumeUpload";
import theme, { appBackground } from "./theme";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", background: appBackground, backgroundAttachment: "fixed" }}>
        <Box
          sx={{
            py: 5,
            mb: 4,
            color: "white",
            textAlign: "center",
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #ec4899 100%)",
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            boxShadow: "0 10px 30px rgba(79,70,229,0.25)",
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 36, mb: 1 }} />
          <Typography variant="h4" fontWeight={800}>
            Smart Resume Analyzer
          </Typography>
          <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
            Score, tailor and ATS-check your resume — 100% local with Ollama
          </Typography>
        </Box>
        <Container maxWidth="md" sx={{ pb: 6 }}>
          <ResumeUpload />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
