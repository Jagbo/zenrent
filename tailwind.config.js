/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
        inter: ['Inter', 'Arial', 'sans-serif'],
        title: ['Cabinet Grotesk', 'sans-serif'],
        'cabinet-grotesk-bold': ['Cabinet Grotesk', 'sans-serif'],
      },
      colors: {
        border: "rgb(229 231 235)", // zinc-200
        primary: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
        },
        secondary: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#f8fafc",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        accent: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        background: "#ffffff",
        foreground: "#0f172a",
        ring: "rgb(161 161 170)", // zinc-400
        custom: {
          'd9e8ff': {
            DEFAULT: '#D9E8FF',
            80: 'rgba(217, 232, 255, 0.8)',
            50: 'rgba(217, 232, 255, 0.5)',
            20: 'rgba(217, 232, 255, 0.2)',
            10: 'rgba(217, 232, 255, 0.1)',
          }
        }
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 