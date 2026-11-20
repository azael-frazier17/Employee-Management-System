import { initials } from '../../utils/helpers';
export default function Avatar({ name = 'User', size = 40 }) {
  const hues = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return <span className="avatar" style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${hues} 72% 58%), hsl(${(hues + 55) % 360} 72% 48%))` }}>{initials(name)}</span>;
}
