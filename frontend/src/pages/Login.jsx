import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarCheck, ClipboardCheck, LogIn, ShieldCheck, Users, UserSquare2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { getErrorMessage } from '../api/axios';
import { DEMO_ACCOUNTS } from '../utils/constants';
import { fadeUp, stagger } from '../utils/motion';
import Field, { PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import './Login.css';

const HIGHLIGHTS = [
  { icon: UserSquare2, title: 'Employee records', text: 'Add, update and search every employee in seconds.' },
  { icon: CalendarCheck, title: 'Attendance', text: 'One-click time in / out with automatic late tracking.' },
  { icon: ClipboardCheck, title: 'Leave approvals', text: 'Employees request, HR approves or rejects online.' },
];

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setApiError('');
  };

  const fillDemo = (account) => {
    setForm({ username: account.username, password: account.password });
    setErrors({});
    setApiError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!form.password) errs.password = 'Password is required.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      setAttempt((a) => a + 1);
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      await login(form.username.trim(), form.password);
    } catch (err) {
      setApiError(getErrorMessage(err));
      setAttempt((a) => a + 1);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-theme">
        <ThemeToggle />
      </div>

      {/* Left: brand panel with animated gradient mesh */}
      <section className="login-brand" aria-hidden="false">
        <div className="mesh" aria-hidden="true">
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
          <span className="blob b4" />
        </div>
        <motion.div className="brand-content" variants={stagger} initial="hidden" animate="show">
          <motion.div className="brand-logo" variants={fadeUp}>
            <span className="logo-mark big">
              <Users size={22} />
            </span>
            <span>EMS</span>
          </motion.div>
          <motion.h1 variants={fadeUp}>All your employee records, in one safe place.</motion.h1>
          <motion.p variants={fadeUp} className="brand-sub">
            Replace paper forms and scattered spreadsheets with one simple system for your HR office.
          </motion.p>
          <div className="highlights">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <motion.div className="highlight" key={title} variants={fadeUp}>
                <span className="highlight-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Right: frosted login card */}
      <section className="login-side">
        <div className="login-side-mesh" aria-hidden="true">
          <span className="blob b2" />
          <span className="blob b3" />
        </div>
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="login-card-head">
            <span className="logo-mark">
              <ShieldCheck size={20} />
            </span>
            <h2>Welcome back</h2>
            <p className="muted">Sign in to continue to your workspace.</p>
          </div>

          <form className="stack" style={{ gap: 16 }} onSubmit={submit} noValidate>
            {apiError && (
              <motion.div
                className="alert alert-danger"
                role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={16} />
                <span>{apiError}</span>
              </motion.div>
            )}

            <Field label="Username" required error={errors.username} shakeSignal={attempt}>
              {(id, invalid) => (
                <input
                  id={id}
                  className={`input input-lg ${invalid ? 'invalid' : ''}`}
                  value={form.username}
                  onChange={set('username')}
                  placeholder="e.g. jdelacruz"
                  autoComplete="username"
                  autoFocus
                />
              )}
            </Field>

            <Field label="Password" required error={errors.password} shakeSignal={attempt}>
              {(id, invalid) => (
                <PasswordInput
                  id={id}
                  value={form.password}
                  onChange={set('password')}
                  invalid={invalid}
                  placeholder="••••••••"
                  className={`input input-lg ${invalid ? 'invalid' : ''}`}
                />
              )}
            </Field>

            <Button type="submit" size="lg" icon={LogIn} loading={loading} full>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="demo">
            <span className="demo-label">Demo accounts</span>
            <div className="row-wrap">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  type="button"
                  key={acc.username}
                  className={`chip ${form.username === acc.username ? 'active' : ''}`}
                  onClick={() => fillDemo(acc)}
                  title={`${acc.username} / ${acc.password}`}
                >
                  {acc.label}
                  <span className="muted">@{acc.username}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <footer className="login-footer">ITPE 101 | BSIT 2C | Group 1</footer>
      </section>
    </div>
  );
}
