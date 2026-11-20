export const formatDate = (value) => {
  if (!value) return '-';
  const text = String(value).slice(0, 10);
  const [year, month, day] = text.split('-').map(Number);
  if (!year || !month || !day) return text;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(year, month - 1, day));
};
export const formatTime = (value) => {
  if (!value) return '-';
  const [hourString, minute] = String(value).slice(0, 5).split(':');
  const hourNumber = Number(hourString);
  if (Number.isNaN(hourNumber)) return String(value);
  const suffix = hourNumber >= 12 ? 'PM' : 'AM';
  const hour = hourNumber % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
};
export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U';
export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
export const tenure = (dateHired) => {
  if (!dateHired) return '-';
  const [y, m, d] = String(dateHired).slice(0, 10).split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) { years -= 1; months += 12; }
  if (now.getDate() < start.getDate()) months = Math.max(0, months - 1);
  if (years < 0) return '-';
  return [years ? `${years} yr${years === 1 ? '' : 's'}` : '', months ? `${months} mo${months === 1 ? '' : 's'}` : '']
    .filter(Boolean).join(' ') || 'Less than 1 mo';
};
export const getErrorMessage = (error, fallback = 'Something went wrong.') =>
  error?.response?.data?.message || error?.message || fallback;
export const toDateInput = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const monthRange = () => {
  const now = new Date();
  return {
    from: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toDateInput(now),
  };
};
