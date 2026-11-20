import { useEffect, useState } from 'react';
export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ems_theme');
    return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ems_theme', theme);
  }, [theme]);
  return [theme, () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))];
}
