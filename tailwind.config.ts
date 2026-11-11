import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem', // 20px — mobile side margin
        md: '4rem', // 64px — desktop margin
      },
      // Capped at 1152px (= max-w-6xl, the width the header uses) so page
      // content lines up with the nav and keeps a visible margin on laptop
      // screens instead of running edge to edge.
      screens: {
        xl: '1152px',
        '2xl': '1152px',
      },
    },
    extend: {
      spacing: {
        18: '4.5rem',
        gutter: '1.5rem', // 24px
        'section-gap': '10rem', // 160px — reserved for hero/CTA voids
      },
      colors: {
        // ── Canonical Monolith tokens (use in NEW markup) ──
        primary: '#000000',
        'on-primary': '#ffffff',
        background: '#fcf9f8',
        'on-background': '#1c1b1b',
        'on-surface': '#1c1b1b',
        'on-surface-variant': '#4c4546',
        outline: '#7e7576',
        'outline-variant': '#cfc4c5',
        'surface-container': '#f0eded',
        'surface-container-high': '#eae7e7',
        'surface-container-highest': '#e5e2e1',
        // The single retained semantic accent — errors / cancelled / fully-booked only
        error: '#ba1a1a',
        'error-container': '#ffdad6',

        // ── Legacy `ink` scale remapped: cool slate → warm monochrome ──
        // (keeps every existing bg-ink-*/text-ink-*/border-ink-* class on-system)
        ink: {
          50: '#fcf9f8', // page background / lightest surface
          100: '#f0eded', // subtle surface + default border
          200: '#cfc4c5', // subtle divider (outline-variant)
          300: '#a89fa0',
          400: '#7e7576', // muted labels (outline)
          500: '#4c4546', // readable muted text (on-surface-variant)
          600: '#3a3435',
          700: '#2b2626',
          800: '#1c1b1b', // body text
          900: '#0a0a0a', // headings
          950: '#000000', // pure-black dark sections
        },

        // ── Legacy `sky` scale (was the emerald accent) collapsed to monochrome ──
        sky: {
          50: '#f0eded',
          100: '#e5e2e1',
          200: '#cfc4c5',
          300: '#a89fa0',
          400: '#4c4546',
          500: '#1c1b1b',
          600: '#7e7576',
          700: '#000000',
          800: '#000000',
          900: '#000000',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'], // Hanken Grotesk
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'], // Inter
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'], // JetBrains Mono
      },
      fontSize: {
        // Monolith display/type scale (family + size applied together)
        'display-2xl': ['6rem', { lineHeight: '5.5rem', letterSpacing: '-0.04em', fontWeight: '800' }], // 96/88
        'display-lg': ['4.5rem', { lineHeight: '4.5rem', letterSpacing: '-0.03em', fontWeight: '700' }], // 72/72
        // Scales with screen width so the longest headline words fit whole on small phones; 48px max
        'display-lg-mobile': ['clamp(2rem, 10.5vw, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '600' }], // 32/40
        'body-lg': ['1.125rem', { lineHeight: '1.8', letterSpacing: '0em', fontWeight: '400' }], // 18
        'body-md': ['1rem', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }], // 16
        'label-mono': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em', fontWeight: '500' }], // 12
      },
      borderRadius: {
        // Sharp 0px everywhere — the defining Monolith shape rule. `full` kept for status dots.
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        '4xl': '0',
        full: '9999px',
      },
      boxShadow: {
        // Brutalism uses hard 1px borders, not shadows — flatten everything.
        none: 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        card: 'none',
        'card-hover': 'none',
        glow: 'none',
        float: 'none',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.8s ease both',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
