/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#020617", // slate-950 (matching globals --bg-black)
          card: "#022c22", // emerald-950 (matching globals --bg-dark-primary)
          primary: "#10b981", // emerald-500
          accent: "#34d399", // emerald-400
        },
      },
    },
  },
  plugins: [],
};

