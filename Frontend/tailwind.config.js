/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TripGenie Logo & Brand Colors
        'electric-blue': '#0875F5',
        'bright-cyan': '#08BCEB',
        'deep-navy': '#063B83',
        'ocean-teal': '#08C6B4',
        'mint': '#DDF8F3',
        'sunset-yellow': '#FFB928',

        // DESIGN.md Architecture Colors
        'coral-pulse': '#FA3556',
        'charcoal-ink': '#16191C',
        'pure-white': '#FFFFFF',
        'fog-white': '#F9F9F9',
        'tide-tint': '#E8F7F8',
        'ash-gray': '#DADADD',
        'slate-muted': '#5B6065',
        'deep-abyss': '#1E2327',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '48px',
        'hero': '64px',
        'btn': '12px',
        'pill': '96px',
      },
      maxWidth: {
        'site': '1200px',
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0,0,0,0.03)',
        'elevated': '0 10px 30px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
