import './Button.css';

/**
 * Button
 *   variant: primary | secondary | ghost | danger | success | soft-success | soft-danger
 *   size:    sm | md | lg
 *   icon / iconRight: a lucide icon component
 *   loading: shows an inline spinner and disables the button
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  full = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  const classes = ['btn', `btn-${variant}`, `btn-${size}`, full ? 'btn-full' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : Icon && <Icon size={size === 'sm' ? 15 : 17} />}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight size={size === 'sm' ? 15 : 17} />}
    </button>
  );
}
