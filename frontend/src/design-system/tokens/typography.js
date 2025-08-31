// Design Tokens - Typography
// TaskFlow Design System v1.0

export const typography = {
  // Font Families
  fonts: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Open Sans',
      'Helvetica Neue',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ],
    display: [
      'Cal Sans',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ],
  },

  // Font Weights
  weights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Font Sizes (with line heights)
  scales: {
    xs: {
      fontSize: '0.75rem', // 12px
      lineHeight: '1rem', // 16px
    },
    sm: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
    },
    base: {
      fontSize: '1rem', // 16px
      lineHeight: '1.5rem', // 24px
    },
    lg: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.75rem', // 28px
    },
    xl: {
      fontSize: '1.25rem', // 20px
      lineHeight: '1.75rem', // 28px
    },
    '2xl': {
      fontSize: '1.5rem', // 24px
      lineHeight: '2rem', // 32px
    },
    '3xl': {
      fontSize: '1.875rem', // 30px
      lineHeight: '2.25rem', // 36px
    },
    '4xl': {
      fontSize: '2.25rem', // 36px
      lineHeight: '2.5rem', // 40px
    },
    '5xl': {
      fontSize: '3rem', // 48px
      lineHeight: '1',
    },
    '6xl': {
      fontSize: '3.75rem', // 60px
      lineHeight: '1',
    },
    '7xl': {
      fontSize: '4.5rem', // 72px
      lineHeight: '1',
    },
    '8xl': {
      fontSize: '6rem', // 96px
      lineHeight: '1',
    },
    '9xl': {
      fontSize: '8rem', // 128px
      lineHeight: '1',
    },
  },

  // Semantic Typography Styles
  styles: {
    // Headings
    h1: {
      fontFamily: 'var(--font-display)',
      fontSize: '2.25rem',
      fontWeight: '700',
      lineHeight: '2.5rem',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: 'var(--font-display)',
      fontSize: '1.875rem',
      fontWeight: '600',
      lineHeight: '2.25rem',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: 'var(--font-display)',
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: '2rem',
    },
    h4: {
      fontFamily: 'var(--font-sans)',
      fontSize: '1.25rem',
      fontWeight: '600',
      lineHeight: '1.75rem',
    },
    h5: {
      fontFamily: 'var(--font-sans)',
      fontSize: '1.125rem',
      fontWeight: '600',
      lineHeight: '1.75rem',
    },
    h6: {
      fontFamily: 'var(--font-sans)',
      fontSize: '1rem',
      fontWeight: '600',
      lineHeight: '1.5rem',
    },

    // Body text
    'body-lg': {
      fontFamily: 'var(--font-sans)',
      fontSize: '1.125rem',
      fontWeight: '400',
      lineHeight: '1.75rem',
    },
    'body-base': {
      fontFamily: 'var(--font-sans)',
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5rem',
    },
    'body-sm': {
      fontFamily: 'var(--font-sans)',
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.25rem',
    },
    'body-xs': {
      fontFamily: 'var(--font-sans)',
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
    },

    // Special text
    lead: {
      fontFamily: 'var(--font-sans)',
      fontSize: '1.25rem',
      fontWeight: '400',
      lineHeight: '1.75rem',
      color: 'var(--color-text-secondary)',
    },
    caption: {
      fontFamily: 'var(--font-sans)',
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
      color: 'var(--color-text-tertiary)',
    },
    overline: {
      fontFamily: 'var(--font-sans)',
      fontSize: '0.75rem',
      fontWeight: '600',
      lineHeight: '1rem',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--color-text-tertiary)',
    },

    // Code
    code: {
      fontFamily: 'var(--font-mono)',
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.25rem',
    },
    'code-sm': {
      fontFamily: 'var(--font-mono)',
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
    },
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

// Typography utility functions
export const getFontFamily = (type = 'sans') => {
  return typography.fonts[type]?.join(', ') || typography.fonts.sans.join(', ');
};

export const getTypographyStyle = (styleName) => {
  return typography.styles[styleName] || typography.styles['body-base'];
};

export const createTypographyCSS = () => {
  return `
    :root {
      --font-sans: ${getFontFamily('sans')};
      --font-mono: ${getFontFamily('mono')};
      --font-display: ${getFontFamily('display')};
    }
  `;
};

export default typography;