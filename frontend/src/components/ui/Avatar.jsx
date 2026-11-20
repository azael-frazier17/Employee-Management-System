import { avatarColor, initials } from '../../utils/helpers';
import './Avatar.css';

const getSavedAvatarByName = (name) => {
  if (!name) return null;
  try {
    return localStorage.getItem(`ems-avatar-name-${name}`) || null;
  } catch {
    return null;
  }
};

/** Circle with the person's photo (if set) or initials with a deterministic color. */
export default function Avatar({ name = '', src, size = 36, ring = false, className = '' }) {
  const color = avatarColor(name);
  const imgSrc = src || getSavedAvatarByName(name);

  return (
    <span
      className={`avatar ${ring ? 'avatar-ring' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.38)),
        background: imgSrc
          ? 'var(--surface-2)'
          : `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, #000))`,
      }}
      aria-hidden="true"
      title={name}
    >
      {imgSrc ? <img src={imgSrc} alt={name} className="avatar-img" /> : initials(name)}
    </span>
  );
}
