import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sedona: {
          sand: "#F4EFE6",
          paper: "#FBF7EF",
          clay: "#B04F24",
          clayDark: "#8F3E1B",
          copper: "#C0613A",
          sage: "#3E7A5E",
          pine: "#12362C",
          pineSoft: "#16352B",
          stone: "#7C7363",
          taupe: "#A89A82",
          blue: "#465980",
          mist: "#EEF0F4",
          creamLine: "#E9DFD2",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "1.5rem",
        control: "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(48,30,16,.04), 0 12px 26px -20px rgba(48,30,16,.2)",
        float: "0 18px 40px -30px rgba(48,30,16,.35)",
        nav: "0 18px 48px -24px rgba(48,30,16,.65)",
        focus: "0 0 0 4px rgba(176,79,36,.14)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      screens: {
        pwa: "575px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
