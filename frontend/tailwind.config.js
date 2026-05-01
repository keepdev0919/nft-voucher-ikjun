/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "-apple-system", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        // TTocket (기존)
        ttokLightPink: "#FFAFAF",
        ttokPink: "#FF9191",
        ttokGray: "#5F5F5F",
        // NFT 바우처 디자인 시스템
        v: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          surface2: "#F1F5F9",
          border: "#E2E8F0",
          text: "#0F172A",
          textSecondary: "#64748B",
          textMuted: "#94A3B8",
          accent: "#2563EB",
          accentLight: "#EFF6FF",
          accentHover: "#1D4ED8",
          success: "#10B981",
          successLight: "#ECFDF5",
          warning: "#F59E0B",
          warningLight: "#FFFBEB",
          error: "#EF4444",
          errorLight: "#FEF2F2",
        },
      },
      borderRadius: {
        "v-sm": "6px",
        "v-md": "10px",
        "v-lg": "16px",
      },
      boxShadow: {
        "v-sm": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "v-md": "0 4px 12px rgba(0,0,0,0.08)",
        "v-lg": "0 8px 24px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};
