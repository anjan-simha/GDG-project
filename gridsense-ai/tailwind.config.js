/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grid: {
          navy: 'var(--color-grid-navy)',
          slate: 'var(--color-grid-slate)',
          panel: 'var(--color-grid-panel)',
        },
        cyan: {
          electric: 'var(--color-cyan-electric)',
          dim: 'var(--color-cyan-dim)',
        },
        risk: {
          low: 'var(--color-risk-low)',
          moderate: 'var(--color-risk-moderate)',
          high: 'var(--color-risk-high)',
          critical: 'var(--color-risk-critical)',
        },
        forecast: {
          line: 'var(--color-forecast-line)',
          actual: 'var(--color-actual-line)',
          baseline: 'var(--color-baseline-line)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          active: 'var(--color-border-active)',
        }
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-alert': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in-up': 'fade-in-up 300ms ease-out',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(220, 38, 38, 0.2)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
