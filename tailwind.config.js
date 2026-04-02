/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      letterSpacing: {
        'bauhaus-heading': '0.04em',
        'bauhaus-mono': '-0.01em',
        'bauhaus-label': '0.12em',
      }
    },
  },
  plugins: [],
}
