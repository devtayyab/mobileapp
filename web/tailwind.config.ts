import type { Config } from 'tailwindcss';

/**
 * Tokens ported from the mobile app's constants/Colors.ts.
 * Role-dependent colors resolve through CSS custom properties (see globals.css)
 * so the same class names re-theme for customer / retailer / wholesale roles.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Role-themed (CSS vars, swapped by [data-role])
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          dark: 'var(--color-secondary-dark)',
          light: 'var(--color-secondary-light)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          dark: 'var(--color-accent-dark)',
          light: 'var(--color-accent-light)',
        },
        surface: {
          DEFAULT: 'var(--color-bg-secondary)',
          page: 'var(--color-bg-primary)',
          tint: 'var(--color-bg-tertiary)',
          translucent: 'var(--color-bg-translucent)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          inverse: 'var(--color-text-inverse)',
        },
        edge: {
          light: 'var(--color-border-light)',
          DEFAULT: 'var(--color-border-medium)',
          dark: 'var(--color-border-dark)',
        },

        // Fixed semantics (identical across roles)
        error: { DEFAULT: '#EF4444', dark: '#DC2626', light: '#FCA5A5' },
        success: '#4CAF50',
        warning: '#F59E0B',
        info: '#2196F3',

        // Order status (role-independent)
        status: {
          pending: '#F59E0B',
          processing: '#2196F3',
          shipped: '#1976D2',
          delivered: '#4CAF50',
          cancelled: '#EF4444',
          refunded: '#F97316',
        },
      },

      // Measured type scale from the mobile screens
      fontSize: {
        '2xs': ['9px', '12px'],
        xxs: ['10px', '14px'],
        xs: ['11px', '15px'],
        sm: ['12px', '16px'],
        base: ['13px', '18px'],
        md: ['14px', '20px'],
        lg: ['15px', '22px'],
        xl: ['16px', '24px'],
        '2xl': ['18px', '26px'],
        '3xl': ['20px', '28px'],
        '4xl': ['22px', '30px'],
        '5xl': ['24px', '32px'],
        '6xl': ['28px', '36px'],
        '7xl': ['30px', '38px'],
      },

      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        pill: '999px',
      },

      boxShadow: {
        subtle: '0 2px 4px rgba(0,0,0,0.10)',
        card: '0 4px 8px rgba(0,0,0,0.10)',
        float: '0 4px 12px rgba(0,0,0,0.10)',
        glow: '0 8px 24px var(--color-shadow-glow)',
      },

      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },

      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
