import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // 1. Load Font Size (Existing)
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('app_font_size')) || 16);

  // 2. Load Theme (New) - Default to 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');

  // Apply Font Size
  useEffect(() => {
    localStorage.setItem('app_font_size', fontSize);
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  // Apply Theme (New)
  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    // This adds <html data-theme="dark"> to your website
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ fontSize, setFontSize, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};