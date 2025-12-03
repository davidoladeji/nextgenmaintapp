/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
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
        // Dark mode accent colors (Jony Ive inspired)
        dark: {
          bg: '#0f172a',          // Deep slate background
          card: '#1e293b',        // Card/container background
          border: '#334155',      // Subtle borders
          accent: '#f59e0b',      // Amber accent (primary)
          accentHover: '#fb923c', // Amber hover state
          text: '#f1f5f9',        // Primary text
          textMuted: '#94a3b8',   // Secondary text
        },
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}