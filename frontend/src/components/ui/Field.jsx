import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { passwordStrength } from '../../utils/helpers';
import './Field.css';

/**
 * Form field wrapper: label + input + hint/error.
 * The input does a small shake when an error appears (or when `shakeSignal` changes).
 */
export default function Field({ label, required, error, hint, children, className = '', shakeSignal }) {
  const id = useId();
  const boxRef = useRef(null);

  useEffect(() => {
    if (!error || !boxRef.current) return;
    const el = boxRef.current;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }, [error, shakeSignal]);

  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
          {required && <span className="req" aria-hidden="true">*</span>}
        </label>
      )}
      <div ref={boxRef}>{typeof children === 'function' ? children(id, Boolean(error)) : children}</div>
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </div>
  );
}

/** Password input with a show/hide button (the eye icon swaps with a small animation). */
export function PasswordInput({ id, value, onChange, invalid, placeholder, autoComplete = 'current-password', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className={`input ${invalid ? 'invalid' : ''}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...rest}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={show ? 'hide' : 'show'}
            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'grid' }}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}

/** 4-bar password strength meter. */
export function StrengthMeter({ password }) {
  const { score, label, color } = passwordStrength(password);
  if (!password) return null;
  return (
    <div className="strength" aria-live="polite">
      <div className="strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="strength-bar">
            <span
              className="strength-fill"
              style={{ transform: `scaleX(${score >= i ? 1 : 0})`, background: color }}
            />
          </span>
        ))}
      </div>
      <span className="strength-label" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

/** Toggle switch with a label. */
export function Switch({ checked, onChange, label }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
