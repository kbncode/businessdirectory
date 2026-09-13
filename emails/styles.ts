// Shared inline-style constants for React Email templates. Email clients
// need inline styles (no Tailwind/external CSS), so these are plain style
// objects mirroring the app's design tokens (ink/signalOrange/paper/stone).

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const LOGO_URL = `${APP_URL}/kbn-logo.png`;

export const colors = {
  ink: "#000000",
  signalOrange: "#F06826",
  paper: "#FDFBF8",
  stone: "#6B6560",
  sand: "#EFE7DC",
  approvedGreen: "#3F7D58",
  rejectedRed: "#A6402E",
};

export const body = {
  backgroundColor: colors.sand,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "24px 0",
};

export const container = {
  backgroundColor: colors.paper,
  margin: "0 auto",
  maxWidth: "480px",
  padding: "32px",
  borderRadius: "2px",
};

export const logo = {
  height: "32px",
  marginBottom: "24px",
};

export const heading = {
  color: colors.ink,
  fontSize: "20px",
  fontWeight: 700,
  margin: "0 0 16px",
};

export const text = {
  color: colors.ink,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
};

export const mutedText = {
  color: colors.stone,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 16px",
};

export const buttonPrimary = {
  backgroundColor: colors.signalOrange,
  color: colors.ink,
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "10px 20px",
  borderRadius: "2px",
  display: "inline-block",
};

export const hr = {
  borderColor: colors.sand,
  margin: "24px 0",
};

export const footer = {
  color: colors.stone,
  fontSize: "12px",
  margin: 0,
};
