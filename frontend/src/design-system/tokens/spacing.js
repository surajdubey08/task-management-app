// Design Tokens - Spacing
// TaskFlow Design System v1.0

export const spacing = {
  // Base spacing unit: 4px (0.25rem)
  base: '0.25rem', // 4px

  // Spacing scale
  scale: {
    0: '0',
    px: '1px',
    0.5: '0.125rem', // 2px
    1: '0.25rem',    // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem',     // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem',    // 12px
    3.5: '0.875rem', // 14px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    7: '1.75rem',    // 28px
    8: '2rem',       // 32px
    9: '2.25rem',    // 36px
    10: '2.5rem',    // 40px
    11: '2.75rem',   // 44px
    12: '3rem',      // 48px
    14: '3.5rem',    // 56px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    28: '7rem',      // 112px
    32: '8rem',      // 128px
    36: '9rem',      // 144px
    40: '10rem',     // 160px
    44: '11rem',     // 176px
    48: '12rem',     // 192px
    52: '13rem',     // 208px
    56: '14rem',     // 224px
    60: '15rem',     // 240px
    64: '16rem',     // 256px
    72: '18rem',     // 288px
    80: '20rem',     // 320px
    96: '24rem',     // 384px
  },

  // Semantic spacing for components
  component: {
    // Padding
    padding: {
      xs: 'var(--space-2)',    // 8px
      sm: 'var(--space-3)',    // 12px
      md: 'var(--space-4)',    // 16px
      lg: 'var(--space-6)',    // 24px
      xl: 'var(--space-8)',    // 32px
      '2xl': 'var(--space-12)', // 48px
    },

    // Margins
    margin: {
      xs: 'var(--space-2)',    // 8px
      sm: 'var(--space-4)',    // 16px
      md: 'var(--space-6)',    // 24px
      lg: 'var(--space-8)',    // 32px
      xl: 'var(--space-12)',   // 48px
      '2xl': 'var(--space-16)', // 64px
    },

    // Gaps
    gap: {
      xs: 'var(--space-1)',    // 4px
      sm: 'var(--space-2)',    // 8px
      md: 'var(--space-4)',    // 16px
      lg: 'var(--space-6)',    // 24px
      xl: 'var(--space-8)',    // 32px
    },
  },

  // Layout spacing
  layout: {
    // Container padding
    container: {
      sm: 'var(--space-4)',   // 16px
      md: 'var(--space-6)',   // 24px
      lg: 'var(--space-8)',   // 32px
      xl: 'var(--space-12)',  // 48px
    },

    // Section spacing
    section: {
      sm: 'var(--space-8)',   // 32px
      md: 'var(--space-12)',  // 48px
      lg: 'var(--space-16)',  // 64px
      xl: 'var(--space-24)',  // 96px
    },

    // Grid gaps
    grid: {
      sm: 'var(--space-4)',   // 16px
      md: 'var(--space-6)',   // 24px
      lg: 'var(--space-8)',   // 32px
    },
  },

  // Interactive element spacing
  interactive: {
    // Button padding
    button: {
      sm: 'var(--space-2) var(--space-3)',     // 8px 12px
      md: 'var(--space-2-5) var(--space-4)',   // 10px 16px
      lg: 'var(--space-3) var(--space-6)',     // 12px 24px
      xl: 'var(--space-4) var(--space-8)',     // 16px 32px
    },

    // Input padding
    input: {
      sm: 'var(--space-2) var(--space-3)',     // 8px 12px
      md: 'var(--space-3) var(--space-4)',     // 12px 16px
      lg: 'var(--space-4) var(--space-5)',     // 16px 20px
    },

    // Form field spacing
    field: {
      gap: 'var(--space-2)',      // 8px
      group: 'var(--space-4)',    // 16px
      section: 'var(--space-6)',  // 24px
    },
  },
};

// Spacing utility functions
export const getSpacing = (size) => {
  return spacing.scale[size] || spacing.scale[4]; // Default to 1rem
};

export const getComponentSpacing = (component, variant, type = 'padding') => {
  return spacing.component[type]?.[variant] || spacing.scale[4];
};

export const createSpacingCSS = () => {
  let css = ':root {\n';
  
  // Add base spacing variables
  Object.entries(spacing.scale).forEach(([key, value]) => {
    css += `  --space-${key}: ${value};\n`;
  });
  
  css += '}\n';
  return css;
};

// Responsive spacing helpers
export const responsive = {
  // Responsive padding classes
  padding: {
    responsive: 'p-4 md:p-6 lg:p-8',
    section: 'py-8 md:py-12 lg:py-16',
    container: 'px-4 md:px-6 lg:px-8',
  },
  
  // Responsive margin classes
  margin: {
    section: 'my-8 md:my-12 lg:my-16',
    element: 'mb-4 md:mb-6 lg:mb-8',
  },
  
  // Responsive gap classes
  gap: {
    grid: 'gap-4 md:gap-6 lg:gap-8',
    flex: 'gap-2 md:gap-4 lg:gap-6',
  },
};

export default spacing;