import { createTheme } from "@mui/material";

export const appBackground =
  "radial-gradient(circle at 10% 0%, #e0e7ff 0%, transparent 40%), radial-gradient(circle at 90% 10%, #fce7f3 0%, transparent 35%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)";

export default createTheme({
  palette: {
    primary: { main: "#4f46e5" },
    secondary: { main: "#ec4899" },
    background: { default: "#f8fafc" },
  },
  shape: { borderRadius: 14 },
  typography: { button: { textTransform: "none", fontWeight: 600 } },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid rgba(79,70,229,0.08)" },
      },
      defaultProps: { elevation: 0 },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
