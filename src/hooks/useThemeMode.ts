import { useState, useEffect } from "react";

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'queuepro_theme';

export function useThemeMode() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as ThemeMode) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
  };

  return { theme, toggleTheme, setTheme };
}
