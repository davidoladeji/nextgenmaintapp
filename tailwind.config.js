/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Monday.com-inspired primary colors
        monday: {
          purple: '#6161FF',      // Primary brand color (Cornflower Blue)
          darkNavy: '#181B34',    // Headers & important text (Mirage)
          pink: '#FF5AC4',        // Accent color
          softPurple: '#A25DDC',  // Secondary purple
          teal: '#00CCC7',        // Success/positive
          lime: '#9CD326',        // Status indicator
          yellow: '#FFCB00',      // Warning
          orange: '#FF6940',      // High priority
          lightPurple: '#F5F3FF', // Light backgrounds
          paleBlue: '#EFF6FF',    // Subtle backgrounds
        },
        // Enhanced status colors (Monday.com style)
        status: {
          critical: '#FF3838',    // Vibrant red
          high: '#FF6940',        // Orange
          medium: '#FFCB00',      // Yellow
          low: '#9CD326',         // Lime green
          complete: '#00CCC7',    // Teal
        },
        // Keep existing colors for compatibility
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#6161FF',         // Updated to Monday purple
          600: '#5151E5',
          700: '#4141CC',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#FF3838',         // Updated to Monday critical
          600: '#E52E2E',
          700: '#CC2525',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#FFCB00',         // Updated to Monday yellow
          600: '#E5B600',
          700: '#CCA300',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#9CD326',         // Updated to Monday lime
          600: '#8CBE22',
          700: '#7DAA1E',
        },
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [],
}