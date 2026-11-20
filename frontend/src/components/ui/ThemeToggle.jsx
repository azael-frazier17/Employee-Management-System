import { Moon, Sun } from 'lucide-react';
export default function ThemeToggle({ theme, onToggle }) {
  return <button className="icon-button theme-toggle" onClick={onToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
