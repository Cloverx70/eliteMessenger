import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        elitePurple: "#8B5CF6",
        elitePurpleHover: "#7C3AED",
        elitePurplePressed: "#6D28D9",
        bgPrimary: "#080B14",
        bgNavbar: "#0F172A",
        bgSurface: "#111827",
        bgElevated: "#182235",

        bgInput: "#202B3C",
        customBlack: "#212121",
        customDarkBlack: "#1c1c1c",
        customGray: "#f6f6f8",
        customBeige: "#D9CAB3",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        roboto: ["Roboto", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        bold: "700",
        semibold: "600",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "l18-1": {
          "0%, 100%": { backgroundSize: "20% 100%" },
          "33%, 66%": { backgroundSize: "20% 20%" },
        },
        "l18-2": {
          "0%, 33%": {
            backgroundPosition: "0 0, 50% 50%, 100% 100%",
          },
          "66%, 100%": {
            backgroundPosition: "100% 0, 50% 50%, 0 100%",
          },
        },
      },
      animation: {
        l18: "l18-1 1s infinite, l18-2 1s infinite",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
