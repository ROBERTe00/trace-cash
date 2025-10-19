/**
 * Unified Design System
 * Comprehensive design tokens and utilities for consistent UI
 */

// Design Tokens
export const designTokens = {
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px - Body text
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px - Subheadings
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px - Headings
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },

  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px - Card padding
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // Colors (HSL format for better manipulation)
  colors: {
    primary: {
      50: 'hsl(200, 100%, 95%)',
      100: 'hsl(200, 100%, 90%)',
      200: 'hsl(200, 100%, 80%)',
      300: 'hsl(200, 100%, 70%)',
      400: 'hsl(200, 100%, 60%)',
      500: 'hsl(200, 100%, 50%)', // Main primary
      600: 'hsl(200, 100%, 40%)',
      700: 'hsl(200, 100%, 30%)',
      800: 'hsl(200, 100%, 20%)',
      900: 'hsl(200, 100%, 10%)',
    },
    gray: {
      50: 'hsl(0, 0%, 98%)',
      100: 'hsl(0, 0%, 96%)',
      200: 'hsl(0, 0%, 90%)',
      300: 'hsl(0, 0%, 83%)',
      400: 'hsl(0, 0%, 64%)',
      500: 'hsl(0, 0%, 45%)',
      600: 'hsl(0, 0%, 32%)',
      700: 'hsl(0, 0%, 25%)',
      800: 'hsl(0, 0%, 15%)',
      900: 'hsl(0, 0%, 9%)',
    },
    success: {
      50: 'hsl(142, 76%, 95%)',
      500: 'hsl(142, 76%, 50%)',
      600: 'hsl(142, 76%, 40%)',
    },
    warning: {
      50: 'hsl(38, 92%, 95%)',
      500: 'hsl(38, 92%, 50%)',
      600: 'hsl(38, 92%, 40%)',
    },
    error: {
      50: 'hsl(0, 84%, 95%)',
      500: 'hsl(0, 84%, 50%)',
      600: 'hsl(0, 84%, 40%)',
    }
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Z-index
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};

// Utility functions
export const designUtils = {
  // Get responsive value
  responsive: (values: Record<string, any>) => {
    return Object.entries(values)
      .map(([breakpoint, value]) => {
        if (breakpoint === 'base') return value;
        return `@media (min-width: ${designTokens.breakpoints[breakpoint as keyof typeof designTokens.breakpoints]}) { ${value} }`;
      })
      .join(' ');
  },

  // Generate consistent spacing
  spacing: (multiplier: number = 1) => `${multiplier * 0.25}rem`,

  // Generate consistent border radius
  radius: (size: keyof typeof designTokens.borderRadius = 'md') => 
    designTokens.borderRadius[size],

  // Generate consistent shadow
  shadow: (size: keyof typeof designTokens.shadows = 'md') => 
    designTokens.shadows[size],

  // Generate consistent color
  color: (color: string, shade: number = 500) => {
    const colorPath = color.split('.');
    let colorObj = designTokens.colors as any;
    
    for (const path of colorPath) {
      colorObj = colorObj[path];
    }
    
    return colorObj[shade] || color;
  }
};

// CSS-in-JS utilities
export const cssUtils = {
  // Typography mixins
  textXs: {
    fontSize: designTokens.typography.fontSize.xs,
    lineHeight: designTokens.typography.lineHeight.tight
  },
  textSm: {
    fontSize: designTokens.typography.fontSize.sm,
    lineHeight: designTokens.typography.lineHeight.normal
  },
  textBase: {
    fontSize: designTokens.typography.fontSize.base,
    lineHeight: designTokens.typography.lineHeight.normal
  },
  textLg: {
    fontSize: designTokens.typography.fontSize.lg,
    lineHeight: designTokens.typography.lineHeight.normal
  },
  textXl: {
    fontSize: designTokens.typography.fontSize.xl,
    lineHeight: designTokens.typography.lineHeight.tight
  },
  text2xl: {
    fontSize: designTokens.typography.fontSize['2xl'],
    lineHeight: designTokens.typography.lineHeight.tight
  },

  // Spacing mixins
  padding: (size: keyof typeof designTokens.spacing = 'md') => ({
    padding: designTokens.spacing[size]
  }),
  margin: (size: keyof typeof designTokens.spacing = 'md') => ({
    margin: designTokens.spacing[size]
  }),

  // Layout mixins
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  gridCenter: {
    display: 'grid',
    placeItems: 'center'
  },

  // Card mixins
  card: {
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    boxShadow: designTokens.shadows.md,
    backgroundColor: 'white',
    border: `1px solid ${designTokens.colors.gray[200]}`
  },
  cardHover: {
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      boxShadow: designTokens.shadows.lg,
      transform: 'translateY(-2px)'
    }
  },

  // Button mixins
  button: {
    padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
    borderRadius: designTokens.borderRadius.md,
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium,
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    border: 'none',
    outline: 'none'
  },
  buttonPrimary: {
    backgroundColor: designTokens.colors.primary[500],
    color: 'white',
    '&:hover': {
      backgroundColor: designTokens.colors.primary[600]
    },
    '&:active': {
      backgroundColor: designTokens.colors.primary[700]
    }
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    color: designTokens.colors.gray[700],
    border: `1px solid ${designTokens.colors.gray[300]}`,
    '&:hover': {
      backgroundColor: designTokens.colors.gray[50],
      borderColor: designTokens.colors.gray[400]
    }
  },

  // Form mixins
  input: {
    padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
    borderRadius: designTokens.borderRadius.md,
    border: `1px solid ${designTokens.colors.gray[300]}`,
    fontSize: designTokens.typography.fontSize.sm,
    transition: 'border-color 0.2s ease-in-out',
    '&:focus': {
      outline: 'none',
      borderColor: designTokens.colors.primary[500],
      boxShadow: `0 0 0 3px ${designTokens.colors.primary[100]}`
    }
  },

  // Accessibility mixins
  focusVisible: {
    outline: `2px solid ${designTokens.colors.primary[500]}`,
    outlineOffset: '2px'
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0
  },

  // Animation mixins
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in-out'
  },
  slideUp: {
    animation: 'slideUp 0.3s ease-out'
  },
  scaleIn: {
    animation: 'scaleIn 0.2s ease-out'
  }
};

// Keyframes for animations
export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { 
        opacity: 0;
        transform: scale(0.95);
      }
      to { 
        opacity: 1;
        transform: scale(1);
      }
    }
  `
};

// Responsive utilities
export const responsive = {
  // Mobile-first breakpoints
  sm: (styles: string) => `@media (min-width: ${designTokens.breakpoints.sm}) { ${styles} }`,
  md: (styles: string) => `@media (min-width: ${designTokens.breakpoints.md}) { ${styles} }`,
  lg: (styles: string) => `@media (min-width: ${designTokens.breakpoints.lg}) { ${styles} }`,
  xl: (styles: string) => `@media (min-width: ${designTokens.breakpoints.xl}) { ${styles} }`,
  '2xl': (styles: string) => `@media (min-width: ${designTokens.breakpoints['2xl']}) { ${styles} }`,

  // Mobile-only
  mobile: (styles: string) => `@media (max-width: ${designTokens.breakpoints.md}) { ${styles} }`,
  
  // Tablet and up
  tablet: (styles: string) => `@media (min-width: ${designTokens.breakpoints.md}) { ${styles} }`,
  
  // Desktop and up
  desktop: (styles: string) => `@media (min-width: ${designTokens.breakpoints.lg}) { ${styles} }`
};

// Accessibility utilities
export const accessibility = {
  // Screen reader only text
  srOnly: cssUtils.srOnly,
  
  // Focus management
  focusVisible: cssUtils.focusVisible,
  
  // High contrast mode support
  highContrast: {
    '@media (prefers-contrast: high)': {
      borderColor: 'currentColor',
      backgroundColor: 'transparent'
    }
  },
  
  // Reduced motion support
  reducedMotion: {
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      transition: 'none'
    }
  },
  
  // Dark mode support
  darkMode: {
    '@media (prefers-color-scheme: dark)': {
      backgroundColor: designTokens.colors.gray[900],
      color: designTokens.colors.gray[100]
    }
  }
};

export default {
  tokens: designTokens,
  utils: designUtils,
  css: cssUtils,
  responsive,
  accessibility,
  keyframes
};
