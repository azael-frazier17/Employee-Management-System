import { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import Field, { PasswordInput, StrengthMeter } from './ui/Field';
import Button from './ui/Button';

const EMPTY = { current_password: '', new_password: '', confirm: '' };

/** Change own password: PUT /auth/change-password { current_password, new_password } */
export default function ChangePasswordForm({ onDone }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.current_password) errs.current_password = 'Enter your current password.';
    if (form.new_password.length < 8 || form.new_password.length > 72) {
      errs.new_password = 'New password must be 8 to 72 characters.';
    } else if (form.new_password === form.current_password) {
      errs.new_password = 'New password must be different from the current one.';
    }
    if (form.confirm !== form.new_password) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      setAttempt((a) => a + 1);
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      toast.success(res.data.message || 'Password updated.');
      setForm(EMPTY);
      onDone?.();
    } catch (err) {
      const message = getErrorMessage(err);
      if (/current password/i.test(message)) setErrors({ current_password: message });
      setAttempt((a) => a + 1);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
      <Field label="Current password" required error={errors.current_password} shakeSignal={attempt}>
        {(id, invalid) => (
          <PasswordInput id={id} value={form.current_password} onChange={set('current_password')} invalid={invalid} />
        )}
      </Field>
      <Field label="New password" required error={errors.new_password} shakeSignal={attempt}>
        {(id, invalid) => (
          <>
            <PasswordInput
              id={id}
              value={form.new_password}
              onChange={set('new_password')}
              invalid={invalid}
              autoComplete="new-password"
            />
            <StrengthMeter password={form.new_password} />
          </>
        )}
      </Field>
      <Field label="Confirm new password" required error={errors.confirm} shakeSignal={attempt}>
        {(id, invalid) => (
          <PasswordInput
            id={id}
            value={form.confirm}
            onChange={set('confirm')}
            invalid={invalid}
            autoComplete="new-password"
          />
        )}
      </Field>
      <Button type="submit" icon={KeyRound} loading={saving} full>
        Update password
      </Button>
    </form>
  );
}
