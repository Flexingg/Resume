// Color themes. A resume picks one with "theme": "<key>" and can fine-tune
// individual colors with "colors": { "primary": "#..." }.
// Tokens: primary (accents, rules, role titles), dark (names, headings),
// light (header + tag fill), border (dividers), accent (end of top gradient),
// text (body copy), muted (secondary copy).
window.RESUME_THEMES = {
  "navy":     { name: "Navy",          primary: "#1D4ED8", dark: "#1E2A4A", light: "#F1F5FB", border: "#D5DEEE", accent: "#3B82F6" },
  "kc-blue":  { name: "K-C Blue",      primary: "#0072CE", dark: "#003B71", light: "#F0F7FC", border: "#CBE3F8", accent: "#009CDE" },
  "slate":    { name: "Slate",         primary: "#475569", dark: "#0F172A", light: "#F8FAFC", border: "#E2E8F0", accent: "#94A3B8" },
  "graphite": { name: "Graphite (mono)", primary: "#111827", dark: "#111827", light: "#F9FAFB", border: "#E5E7EB", accent: "#6B7280" },
  "teal":     { name: "Teal",          primary: "#0F766E", dark: "#134E4A", light: "#F0FDFA", border: "#B5EBE1", accent: "#14B8A6" },
  "forest":   { name: "Forest",        primary: "#15803D", dark: "#14532D", light: "#F0FDF4", border: "#C6EFD3", accent: "#22C55E" },
  "crimson":  { name: "Crimson",       primary: "#B91C1C", dark: "#7F1D1D", light: "#FEF2F2", border: "#F8D0D0", accent: "#EF4444" },
  "copper":   { name: "Copper",        primary: "#C2410C", dark: "#431407", light: "#FFF7ED", border: "#FAD9B8", accent: "#F97316" }
};

// Fonts a resume can use via "layout": { "font": "<name>" } (loaded from Google Fonts).
window.RESUME_FONTS = {
  "Inter":         "Inter:wght@400;500;600;700;800",
  "Source Sans 3": "Source+Sans+3:wght@400;500;600;700;800",
  "IBM Plex Sans": "IBM+Plex+Sans:wght@400;500;600;700",
  "Open Sans":     "Open+Sans:wght@400;500;600;700;800"
};
