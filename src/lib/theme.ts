/**
 * Theme configuration system
 * Allows easy customization of color schemes through environment variables
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryHover: string;
  
  // Background colors
  background: string;
  cardBackground: string;
  cardBorder: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Status colors
  success: string;
  error: string;
  warning: string;
  
  // Interactive elements
  buttonBackground: string;
  buttonHover: string;
  linkColor: string;
  linkHover: string;
}

// Default theme (current amber/black matrix theme)
const defaultTheme: ThemeColors = {
  primary: '#F59E0B',        // amber-500
  primaryHover: '#D97706',   // amber-600
  primaryDark: '#92400E',    // amber-700
  
  secondary: '#6B7280',      // gray-500
  secondaryHover: '#4B5563', // gray-600
  
  background: '#000000',     // black
  cardBackground: '#111827', // gray-900
  cardBorder: '#D97706',     // amber-600
  
  textPrimary: '#FBBF24',    // amber-400 (bright but not too bright)
  textSecondary: '#F59E0B',  // amber-500 (solid color, no opacity)
  textMuted: '#9CA3AF',      // gray-400
  
  success: '#10B981',        // emerald-500
  error: '#EF4444',          // red-500
  warning: '#F59E0B',        // amber-500
  
  buttonBackground: '#D97706', // amber-600
  buttonHover: '#B45309',      // amber-700
  linkColor: '#FBBF24',        // amber-400
  linkHover: '#FDE68A',        // amber-200
};

// Predefined themes
const themes = {
  matrix: defaultTheme,
  
  cyber: {
    primary: '#00FFFF',        // cyan (bright)
    primaryHover: '#00E6E6',   
    primaryDark: '#00CCCC',    
    
    secondary: '#9CA3AF',      // lighter gray
    secondaryHover: '#6B7280', 
    
    background: '#0A0A0A',     
    cardBackground: '#16213E', // lighter blue-black
    cardBorder: '#00FFFF',     
    
    textPrimary: '#00FFFF',    // bright cyan
    textSecondary: '#66FFFF',  // brighter cyan, no opacity
    textMuted: '#9CA3AF',      // lighter gray
    
    success: '#00FF88',        
    error: '#FF3366',          // brighter red
    warning: '#FFCC00',        // brighter yellow
    
    buttonBackground: '#00FFFF', // brighter button
    buttonHover: '#00E6E6',      
    linkColor: '#00FFFF',        
    linkHover: '#CCFFFF',        // much brighter hover
  } as ThemeColors,
  
  purple: {
    primary: '#A78BFA',        // violet-400 (brighter)
    primaryHover: '#8B5CF6',   // violet-500
    primaryDark: '#7C3AED',    // violet-600
    
    secondary: '#9CA3AF',      // lighter gray
    secondaryHover: '#6B7280', 
    
    background: '#0F0A1A',     
    cardBackground: '#2D1B69', // lighter purple
    cardBorder: '#A78BFA',     // brighter border
    
    textPrimary: '#C4B5FD',    // violet-300 (much brighter)
    textSecondary: '#A78BFA',  // violet-400 (brighter, no opacity)
    textMuted: '#9CA3AF',      // lighter gray
    
    success: '#34D399',        // brighter green
    error: '#F87171',          // brighter red
    warning: '#FBBF24',        // brighter yellow
    
    buttonBackground: '#8B5CF6', // brighter button
    buttonHover: '#7C3AED',      
    linkColor: '#C4B5FD',        // brighter link
    linkHover: '#E0E7FF',        // much brighter hover
  } as ThemeColors,
  
  green: {
    primary: '#34D399',        // emerald-400 (brighter)
    primaryHover: '#10B981',   // emerald-500
    primaryDark: '#059669',    // emerald-600
    
    secondary: '#9CA3AF',      // lighter gray
    secondaryHover: '#6B7280', 
    
    background: '#0A1A0F',     
    cardBackground: '#14532D', // lighter green
    cardBorder: '#34D399',     // brighter border
    
    textPrimary: '#6EE7B7',    // emerald-300 (much brighter)
    textSecondary: '#34D399',  // emerald-400 (brighter, no opacity)
    textMuted: '#9CA3AF',      // lighter gray
    
    success: '#34D399',        
    error: '#F87171',          // brighter red
    warning: '#FBBF24',        // brighter yellow
    
    buttonBackground: '#10B981', // brighter button
    buttonHover: '#059669',      
    linkColor: '#6EE7B7',        // brighter link
    linkHover: '#ECFDF5',        // much brighter hover
  } as ThemeColors,
  
  blue: {
    primary: '#60A5FA',        // blue-400 (brighter)
    primaryHover: '#3B82F6',   // blue-500
    primaryDark: '#2563EB',    // blue-600
    
    secondary: '#9CA3AF',      // lighter gray
    secondaryHover: '#6B7280', 
    
    background: '#0A0F1A',     
    cardBackground: '#1E40AF', // lighter blue
    cardBorder: '#60A5FA',     // brighter border
    
    textPrimary: '#93C5FD',    // blue-300 (much brighter)
    textSecondary: '#60A5FA',  // blue-400 (brighter, no opacity)
    textMuted: '#9CA3AF',      // lighter gray
    
    success: '#34D399',        // brighter green
    error: '#F87171',          // brighter red
    warning: '#FBBF24',        // brighter yellow
    
    buttonBackground: '#3B82F6', // brighter button
    buttonHover: '#2563EB',      
    linkColor: '#93C5FD',        // brighter link
    linkHover: '#DBEAFE',        // much brighter hover
  } as ThemeColors,
};

// Get theme from environment variable
function getThemeFromEnv(): ThemeColors {
  const themeName = (import.meta.env.VITE_THEME as string) || 'matrix';
  const theme = themes[themeName.toLowerCase() as keyof typeof themes];
  
  if (!theme) {
    console.warn(`Theme "${themeName}" not found, using default matrix theme`);
    return themes.matrix;
  }
  
  return theme;
}

// Get the active theme
export const theme = getThemeFromEnv();

// CSS custom properties for theme
export function generateThemeCSS(): string {
  return `
    :root {
      --theme-primary: ${theme.primary};
      --theme-primary-hover: ${theme.primaryHover};
      --theme-primary-dark: ${theme.primaryDark};
      
      --theme-secondary: ${theme.secondary};
      --theme-secondary-hover: ${theme.secondaryHover};
      
      --theme-background: ${theme.background};
      --theme-card-background: ${theme.cardBackground};
      --theme-card-border: ${theme.cardBorder};
      
      --theme-text-primary: ${theme.textPrimary};
      --theme-text-secondary: ${theme.textSecondary};
      --theme-text-muted: ${theme.textMuted};
      
      --theme-success: ${theme.success};
      --theme-error: ${theme.error};
      --theme-warning: ${theme.warning};
      
      --theme-button-background: ${theme.buttonBackground};
      --theme-button-hover: ${theme.buttonHover};
      --theme-link: ${theme.linkColor};
      --theme-link-hover: ${theme.linkHover};
    }
  `;
}

// Utility function to get Tailwind-compatible classes
export function getThemeClasses() {
  return {
    // Background classes
    bg: 'bg-black', // Will be overridden by CSS variables
    cardBg: 'bg-gray-900',
    
    // Text classes
    textPrimary: 'text-amber-400',
    textSecondary: 'text-amber-500', 
    textMuted: 'text-gray-500',
    
    // Border classes
    border: 'border-amber-600',
    
    // Button classes
    button: 'bg-amber-600 hover:bg-amber-700',
    buttonOutline: 'border-amber-600 text-amber-400 hover:bg-amber-600',
    
    // Status classes
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
  };
}
