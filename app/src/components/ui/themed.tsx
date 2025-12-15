/**
 * Modern Theme Utility Component
 * Apple-inspired design with proper light/dark mode support
 * 
 * Light Mode: White background (#FFFFFF) with black text (#000000)
 * Dark Mode: Black background (#000000) with white text (#FFFFFF)
 */

import { ReactNode } from 'react';

interface ThemeBoxProps {
  children: ReactNode;
  isDarkMode: boolean;
  variant?: 'default' | 'card' | 'subtle' | 'accent';
  className?: string;
}

/**
 * Modern themed container component
 */
export function ThemedBox({ children, isDarkMode, variant = 'default', className = '' }: ThemeBoxProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return isDarkMode
          ? 'bg-zinc-900 border-2 border-zinc-800 shadow-xl shadow-black/50'
          : 'bg-white border-2 border-gray-200 shadow-lg';
      
      case 'subtle':
        return isDarkMode
          ? 'bg-zinc-800/50 border border-zinc-700'
          : 'bg-gray-50 border border-gray-200';
      
      case 'accent':
        return isDarkMode
          ? 'bg-primary/10 border-2 border-primary/30'
          : 'bg-blue-50 border-2 border-blue-200';
      
      default:
        return isDarkMode
          ? 'bg-black text-white'
          : 'bg-white text-black';
    }
  };

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Themed text component
 */
export function ThemedText({ 
  children, 
  isDarkMode, 
  variant = 'default',
  className = '' 
}: {
  children: ReactNode;
  isDarkMode: boolean;
  variant?: 'default' | 'muted' | 'bold';
  className?: string;
}) {
  const getTextClass = () => {
    switch (variant) {
      case 'bold':
        return isDarkMode ? 'text-white font-bold' : 'text-black font-bold';
      case 'muted':
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
      default:
        return isDarkMode ? 'text-white' : 'text-black';
    }
  };

  return (
    <span className={`${getTextClass()} ${className}`}>
      {children}
    </span>
  );
}

/**
 * Get theme classes as object
 */
export function useThemeClasses(isDarkMode: boolean) {
  return {
    // Backgrounds
    root: isDarkMode ? 'bg-black text-white' : 'bg-white text-black',
    card: isDarkMode ? 'bg-zinc-900 border-2 border-zinc-800' : 'bg-white border-2 border-gray-200',
    cardSubtle: isDarkMode ? 'bg-zinc-800/50 border border-zinc-700' : 'bg-gray-50 border border-gray-200',
    input: isDarkMode ? 'bg-zinc-900 border-2 border-zinc-800 text-white' : 'bg-gray-50 border-2 border-gray-200 text-black',
    
    // Text
    text: isDarkMode ? 'text-white' : 'text-black',
    textBold: isDarkMode ? 'text-white font-bold' : 'text-black font-bold',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    
    // Buttons
    buttonPrimary: isDarkMode 
      ? 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
      : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg',
    buttonOutline: isDarkMode
      ? 'border-2 border-zinc-700 text-white hover:bg-zinc-800'
      : 'border-2 border-gray-300 text-black hover:bg-gray-50',
    buttonGhost: isDarkMode
      ? 'text-white hover:bg-zinc-800'
      : 'text-black hover:bg-gray-100',
    
    // Borders
    border: isDarkMode ? 'border-zinc-800' : 'border-gray-200',
    borderSubtle: isDarkMode ? 'border-zinc-700' : 'border-gray-100',
    
    // Hover states
    hover: isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100',
  };
}
