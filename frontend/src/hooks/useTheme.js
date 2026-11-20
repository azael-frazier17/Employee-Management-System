import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const THEME_KEY = 'ems-theme';
const ThemeContext = createContext(null);

// First visit follows the system setting; after a toggle the choice is saved
const initialTheme = () => {
  const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem('ems_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  // Put data-theme="light|dark" on <html>; CSS variables do the rest
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Follow system changes only while the user has not chosen a theme yet
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (!localStorage.getItem(THEME_KEY)) setTheme(e.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      localStorage.setItem('ems_theme', next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** useTheme() -> { theme: 'light'|'dark', isDark, toggleTheme() } */
export default function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
