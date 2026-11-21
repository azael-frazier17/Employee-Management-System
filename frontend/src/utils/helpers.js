/*
 * Helpers for dates, names and numbers.
 * The API sends dates/times as plain strings ("2026-11-17", "08:55:00",
 * "2026-11-17 08:55:00"). We NEVER pass those strings to new Date(),
 * because the browser's time zone could shift the day. We split them instead.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

/** "2026-11-17" (or "2026-11-17 08:55:00") -> { y: 2026, m: 11, d: 17 } */
const parts = (value) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
};

/** Local date (from the computer clock) as "YYYY-MM-DD". */
export const toISODate = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayStr = () => toISODate(new Date());

/** "2026-11-17" -> "Nov 17, 2026" */
export const formatDate = (value) => {
  const p = parts(value);
  if (!p) return '—';
  return `${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
};

/** "2026-11-17" -> "Nov 17" (short, for compact lists) */
export const formatShortDate = (value) => {
  const p = parts(value);
  if (!p) return '—';
  return `${MONTHS[p.m - 1]} ${p.d}`;
};

/** "08:55:00" -> "8:55 AM" */
export const formatTime = (value) => {
  if (!value || typeof value !== 'string') return '—';
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '—';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${suffix}`;
};

/** "2026-11-17 08:55:00" -> "Nov 17, 2026, 8:55 AM" */
export const formatDateTime = (value) => {
  if (!value || typeof value !== 'string') return '—';
  const [date, time] = value.split(/[ T]/);
  return time ? `${formatDate(date)}, ${formatTime(time)}` : formatDate(date);
};

/** 8.5 -> "8.50 h" */
export const formatHours = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)} h` : '—';
};

/** Number of days between two date strings, counting both ends ("2026-11-17","2026-11-19" -> 3). */
export const daysInclusive = (start, end) => {
  const a = parts(start);
  const b = parts(end);
  if (!a || !b) return 0;
  const diff = (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000;
  return diff >= 0 ? diff + 1 : 0;
};

/** Adds n days to "YYYY-MM-DD" and returns a new "YYYY-MM-DD". */
export const addDays = (value, n) => {
  const p = parts(value);
  if (!p) return value;
  return toISODate(new Date(p.y, p.m - 1, p.d + n));
};

/** First and last day of the current month. */
export const monthRange = () => {
  const now = new Date();
  return {
    from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

/** Monday to Sunday of the current week. */
export const weekRange = () => {
  const now = new Date();
  const offset = (now.getDay() + 6) % 7; // days since Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  return { from: toISODate(monday), to: addDays(toISODate(monday), 6) };
};

/** Date preset helper used by the filters: "today" | "week" | "month" */
export const presetRange = (preset) => {
  if (preset === 'today') return { from: todayStr(), to: todayStr() };
  if (preset === 'week') return weekRange();
  return monthRange();
};

/** "2024-08-01" -> "2 yrs 3 mos" (time worked since the hire date) */
export const tenure = (dateHired) => {
  const p = parts(dateHired);
  if (!p) return '—';
  const now = new Date();
  let months = (now.getFullYear() - p.y) * 12 + (now.getMonth() + 1 - p.m);
  if (now.getDate() < p.d) months -= 1;
  if (months < 0) return 'Starts soon';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0 && rest === 0) return 'Less than a month';
  const y = years ? `${years} ${years === 1 ? 'yr' : 'yrs'}` : '';
  const m = rest ? `${rest} ${rest === 1 ? 'mo' : 'mos'}` : '';
  return [y, m].filter(Boolean).join(' ');
};

/** "Juan Dela Cruz" -> "JC" */
export const initials = (name = '') => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/** Same name -> same color. Returns an HSL color for avatars. */
export const avatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 52%)`;
};

/** "Good morning" / "Good afternoon" / "Good evening" from the current hour. */
export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

/** Today's date in words, e.g. "Friday, November 20, 2026". */
export const longToday = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

/** First name from a full name ("Juan Dela Cruz" -> "Juan"). */
export const firstName = (name = '') => String(name).trim().split(/\s+/)[0] || '';

/** Password strength 0-4 with a label and color for the strength meter. */
export const passwordStrength = (password = '') => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  score = Math.min(score, 4);
  if (!password) return { score: 0, label: '', color: 'var(--border)' };
  const levels = [
    { label: 'Very weak', color: 'var(--danger)' },
    { label: 'Weak', color: 'var(--danger)' },
    { label: 'Fair', color: 'var(--warning)' },
    { label: 'Good', color: 'var(--info)' },
    { label: 'Strong', color: 'var(--success)' },
  ];
  return { score, ...levels[score] };
};

/** Simple email check (same idea as the backend). */
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

/** Removes empty values from a params object before sending it to the API. */
export const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

/** Formats a number with thousands separators. */
export const formatNumber = (n) => Number(n || 0).toLocaleString('en-US');

const NON_CLOCK_IN_ROLES = ['admin', 'hr', 'manager'];

/** Returns true if the given user role is allowed to use personal clock-in/out. */
export const canClockIn = (role) =>
  Boolean(role) && !NON_CLOCK_IN_ROLES.includes(String(role).trim().toLowerCase());
