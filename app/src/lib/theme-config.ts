/**
 * Centralized Theme Configuration
 * Apple-inspired design system with proper light/dark modes
 */

export const theme = {
  // Background colors
  bg: {
    light: 'bg-white',                          // Pure white for light mode
    dark: 'bg-black',                           // Pure black for dark mode
    lightSubtle: 'bg-gray-50',                  // Subtle gray for cards in light mode
    darkSubtle: 'bg-zinc-900',                  // Subtle dark for cards in dark mode
  },
  
  // Text colors
  text: {
    light: 'text-black',                        // Black text for light mode
    dark: 'text-white',                         // White text for dark mode
    lightMuted: 'text-gray-600',                // Muted text for light mode
    darkMuted: 'text-gray-400',                 // Muted text for dark mode
    lightSecondary: 'text-gray-700',
    darkSecondary: 'text-gray-300',
  },
  
  // Border colors
  border: {
    light: 'border-gray-200',                   // Light borders
    dark: 'border-zinc-800',                    // Dark borders
    lightSubtle: 'border-gray-100',
    darkSubtle: 'border-zinc-700',
  },
  
  // Card styles
  card: {
    light: 'bg-white border-2 border-gray-200 shadow-sm',
    dark: 'bg-zinc-900 border-2 border-zinc-800 shadow-lg shadow-black/50',
    lightHover: 'hover:border-gray-300 hover:shadow-md',
    darkHover: 'hover:border-zinc-700 hover:shadow-xl',
  },
  
  // Input styles
  input: {
    light: 'bg-gray-50 border-2 border-gray-200 text-black placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20',
    dark: 'bg-zinc-900 border-2 border-zinc-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/30',
  },
  
  // Button styles
  button: {
    light: {
      primary: 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/30 font-semibold',
      outline: 'bg-white border-2 border-gray-300 text-black hover:bg-gray-50 font-semibold',
      ghost: 'bg-transparent text-black hover:bg-gray-100',
    },
    dark: {
      primary: 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/50 font-semibold',
      outline: 'bg-transparent border-2 border-zinc-700 text-white hover:bg-zinc-800 font-semibold',
      ghost: 'bg-transparent text-white hover:bg-zinc-800',
    },
  },
};

/**
 * Get theme classes based on isDarkMode
 */
export function getThemeClasses(isDarkMode: boolean) {
  return {
    // Root/Page background
    root: isDarkMode ? 'bg-black text-white' : 'bg-white text-black',
    
    // Card backgrounds
    card: isDarkMode 
      ? 'bg-zinc-900 border-2 border-zinc-800' 
      : 'bg-white border-2 border-gray-200',
    
    cardSubtle: isDarkMode 
      ? 'bg-zinc-800/50 border border-zinc-700' 
      : 'bg-gray-50 border border-gray-200',
    
    // Text colors
    text: {
      primary: isDarkMode ? 'text-white font-semibold' : 'text-black font-bold',
      secondary: isDarkMode ? 'text-gray-300' : 'text-gray-700 font-medium',
      muted: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    },
    
    // Input fields
    input: isDarkMode
      ? 'bg-zinc-900 border-2 border-zinc-800 text-white placeholder:text-gray-500 focus:border-primary'
      : 'bg-gray-50 border-2 border-gray-200 text-black placeholder:text-gray-500 focus:border-primary',
    
    // Buttons
    button: {
      primary: isDarkMode
        ? 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
        : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg',
      outline: isDarkMode
        ? 'border-2 border-zinc-700 text-white hover:bg-zinc-800'
        : 'border-2 border-gray-300 text-black hover:bg-gray-50',
      ghost: isDarkMode
        ? 'text-white hover:bg-zinc-800'
        : 'text-black hover:bg-gray-100',
    },
    
    // Borders
    border: isDarkMode ? 'border-zinc-800' : 'border-gray-200',
    borderSubtle: isDarkMode ? 'border-zinc-700' : 'border-gray-100',
    
    // Hover states
    hover: isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-50',
    hoverSubtle: isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-100',
  };
}

/**
 * Modern shadcn/ui inspired component styles
 */
export const componentStyles = {
  // Modern card with Apple-like design
  modernCard: (isDarkMode: boolean) => `
    ${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-gray-200'}
    border-2 rounded-2xl shadow-xl backdrop-blur-sm
    ${isDarkMode ? 'shadow-black/50' : 'shadow-gray-200/50'}
    transition-all duration-200
  `,
  
  // Modern input with clean design
  modernInput: (isDarkMode: boolean) => `
    ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-gray-50 border-gray-200 text-black'}
    border-2 rounded-xl px-4 py-3 text-base font-medium
    placeholder:text-gray-500
    focus:border-primary focus:ring-4 focus:ring-primary/10
    transition-all duration-200
  `,
  
  // Modern button
  modernButton: (isDarkMode: boolean, variant: 'primary' | 'outline' | 'ghost' = 'primary') => {
    if (variant === 'primary') {
      return `
        bg-gradient-to-r from-primary to-secondary text-white font-semibold
        px-6 py-3 rounded-xl
        hover:shadow-lg ${isDarkMode ? 'hover:shadow-primary/30' : 'hover:shadow-primary/20'}
        active:scale-95
        transition-all duration-200
      `;
    }
    if (variant === 'outline') {
      return `
        ${isDarkMode ? 'bg-transparent border-zinc-700 text-white hover:bg-zinc-800' : 'bg-white border-gray-300 text-black hover:bg-gray-50'}
        border-2 px-6 py-3 rounded-xl font-semibold
        transition-all duration-200
      `;
    }
    return `
      ${isDarkMode ? 'text-white hover:bg-zinc-800' : 'text-black hover:bg-gray-100'}
      px-6 py-3 rounded-xl font-medium
      transition-all duration-200
    `;
  },
};
