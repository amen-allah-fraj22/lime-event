import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: '#b7d507',
          dark: '#566500',
          light: '#F4FBCC',
          container: '#b7d507',
        },
        brand: {
          text: '#2E2E2E',
          accent: '#808080',
          background: '#F9F9F9',
        },
        'custom-lime': '#b7d507',
        'custom-lime-light': '#F4FBCC',
        'custom-dark': '#2E2E2E',
        surface: '#f9f9f9',
        'surface-dim': '#dadada',
        'surface-bright': '#f9f9f9',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f3',
        'surface-container': '#eeeeee',
        'surface-container-high': '#e8e8e8',
        'surface-container-highest': '#e2e2e2',
        'surface-variant': '#e2e2e2',
        'on-surface': '#1a1c1c',
        'on-surface-variant': '#454934',
        'on-background': '#1a1c1c',
        primary: '#566500',
        'primary-container': '#b7d507',
        'on-primary-container': '#4c5900',
        'on-primary-fixed': '#181e00',
        secondary: '#5f5e5e',
        'secondary-container': '#e4e2e1',
        tertiary: '#5e5e5e',
        outline: '#767962',
        'outline-variant': '#c6c9ae',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        background: '#f9f9f9',
      },
      fontFamily: {
        headline: ['var(--font-headline)', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['var(--font-body)', 'Hanken Grotesk', 'sans-serif'],
      },
      fontSize: {
        'headline-xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.05em', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      spacing: {
        'margin-mobile': '16px',
        'margin-desktop': '40px',
        'container-max': '1280px',
        gutter: '24px',
      },
      maxWidth: {
        'container-max': '1280px',
      },
      boxShadow: {
        card: '0px 4px 20px rgba(0, 0, 0, 0.04)',
        float: '0 20px 50px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '4xl': '2rem',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
