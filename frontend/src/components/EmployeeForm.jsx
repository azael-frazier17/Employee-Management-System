import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Save, UserPlus } from 'lucide-react';
import { EMPLOYEE_STATUSES, GENDERS } from '../utils/constants';
import { isEmail, todayStr } from '../utils/helpers';
import { collapse } from '../utils/motion';
import Field, { PasswordInput, StrengthMeter, Switch } from './ui/Field';
import Button from './ui/Button';

const buildInitial = (employee) => ({
  first_name: employee?.first_name || '',
  last_name: employee?.last_name || '',
  email: employee?.email || '',
  phone: employee?.phone || '',
  address: employee?.address || '',
  birth_date: employee?.birth_date || '',
  gender: employee?.gender || '',
  department_id: employee?.department_id ? String(employee.department_id) : '',
  position_id: employee?.position_id ? String(employee.position_id) : '',
  date_hired: employee?.date_hired || todayStr(),
  status: employee?.status || 'Active',
  create_account: false,
  username: '',
  password: '',
});

/**
 * EmployeeForm (used inside a Modal for both Create and Edit).
 */
export default function EmployeeForm({
  employee = null,
  departments = [],
  positions = [],
  saving = false,
  onSubmit,
  onCancel,
}) {
  const isEdit = Boolean(employee?.id);
  const [form, setForm] = useState(() => buildInitial(employee));
  const [errors, setErrors] = useState({});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setForm(buildInitial(employee));
    setErrors({});
  }, [employee]);

  // Filter positions to those belonging to the chosen department
  const deptPositions = useMemo(() => {
    if (!form.department_id) return [];
    const deptId = Number(form.department_id);
    return positions.filter((p) => Number(p.department_id) === deptId);
  }, [positions, form.department_id]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      if (field === 'department_id') {
        return { ...prev, department_id: val, position_id: '' };
      }
      return { ...prev, [field]: val };
    });
  };

  const validate = () => {
    const errs = {};
    const fn = form.first_name.trim();
    const ln = form.last_name.trim();
    const em = form.email.trim();
    const ph = form.phone.trim();
    const ad = form.address.trim();

    if (!fn) errs.first_name = 'First name is required.';
    else if (fn.length > 60) errs.first_name = 'First name must be at most 60 characters.';

    if (!ln) errs.last_name = 'Last name is required.';
    else if (ln.length > 60) errs.last_name = 'Last name must be at most 60 characters.';

    if (!em) errs.email = 'Email is required.';
    else if (!isEmail(em)) errs.email = 'Enter a valid email address.';

    if (ph.length > 30) errs.phone = 'Phone must be at most 30 characters.';
    if (ad.length > 255) errs.address = 'Address must be at most 255 characters.';

    if (!form.date_hired) errs.date_hired = 'Date hired is required.';

    if (!isEdit && form.create_account) {
      const un = form.username.trim();
      if (!/^[A-Za-z0-9._-]{3,50}$/.test(un)) {
        errs.username = '3–50 chars (letters, numbers, dot, underscore, hyphen).';
      }
      if (form.password.length < 8 || form.password.length > 72) {
        errs.password = 'Password must be 8 to 72 characters.';
      }
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      setAttempt((a) => a + 1);
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      department_id: form.department_id ? Number(form.department_id) : null,
      position_id: form.position_id ? Number(form.position_id) : null,
      date_hired: form.date_hired,
      status: form.status,
    };

    if (!isEdit && form.create_account) {
      payload.username = form.username.trim();
      payload.password = form.password;
    }

    onSubmit(payload);
  };

  return (
    <form className="stack" style={{ gap: 16 }} onSubmit={handleSubmit} noValidate>
      <div className="form-section-title">Personal Information</div>
      <div className="form-grid">
        <Field label="First name" required error={errors.first_name} shakeSignal={attempt}>
          {(id, invalid) => (
            <input
              id={id}
              className={`input ${invalid ? 'invalid' : ''}`}
              value={form.first_name}
              onChange={set('first_name')}
              maxLength={60}
              placeholder="Juan"
            />
          )}
        </Field>

        <Field label="Last name" required error={errors.last_name} shakeSignal={attempt}>
          {(id, invalid) => (
            <input
              id={id}
              className={`input ${invalid ? 'invalid' : ''}`}
              value={form.last_name}
              onChange={set('last_name')}
              maxLength={60}
              placeholder="Dela Cruz"
            />
          )}
        </Field>

        <Field label="Email address" required error={errors.email} shakeSignal={attempt}>
          {(id, invalid) => (
            <input
              id={id}
              type="email"
              className={`input ${invalid ? 'invalid' : ''}`}
              value={form.email}
              onChange={set('email')}
              placeholder="juan.delacruz@company.com"
            />
          )}
        </Field>

        <Field label="Phone" error={errors.phone} shakeSignal={attempt}>
          {(id, invalid) => (
            <input
              id={id}
              className={`input ${invalid ? 'invalid' : ''}`}
              value={form.phone}
              onChange={set('phone')}
              maxLength={30}
              placeholder="+63 917 000 0000"
            />
          )}
        </Field>

        <Field label="Birth date" error={errors.birth_date}>
          {(id) => (
            <input
              id={id}
              type="date"
              className="input"
              value={form.birth_date}
              onChange={set('birth_date')}
            />
          )}
        </Field>

        <Field label="Gender">
          {(id) => (
            <select id={id} className="select" value={form.gender} onChange={set('gender')}>
              <option value="">Not specified</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Address" className="span-2" error={errors.address} shakeSignal={attempt}>
          {(id, invalid) => (
            <input
              id={id}
              className={`input ${invalid ? 'invalid' : ''}`}
              value={form.address}
              onChange={set('address')}
              maxLength={255}
              placeholder="Street, City, Province"
            />
          )}
        </Field>
      </div>

      <div className="form-section-title">Employment Details</div>
      <div className="form-grid">
        <Field label="Department">
          {(id) => (
            <select
              id={id}
              className="select"
              value={form.department_id}
              onChange={set('department_id')}
            >
              <option value="">Unassigned</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Position"
          hint={!form.department_id ? 'Select a department first' : undefined}
        >
          {(id) => (
            <select
              id={id}
              className="select"
              value={form.position_id}
              onChange={set('position_id')}
              disabled={!form.department_id}
            >
              <option value="">
                {form.department_id ? 'Select position…' : 'Choose department first'}
              </option>
              {deptPositions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Date hired" required error={errors.date_hired} shakeSignal={attempt}>
          {(id, invalid) => (
            <input
              id={id}
              type="date"
              className={`input ${invalid ? 'invalid' : ''}`}
              value={form.date_hired}
              onChange={set('date_hired')}
            />
          )}
        </Field>

        <Field label="Status">
          {(id) => (
            <select id={id} className="select" value={form.status} onChange={set('status')}>
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {!isEdit && (
        <div
          className="card card-pad"
          style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}
        >
          <Switch
            checked={form.create_account}
            onChange={(checked) => setForm((f) => ({ ...f, create_account: checked }))}
            label="Create login account for this employee"
          />
          <AnimatePresence initial={false}>
            {form.create_account && (
              <motion.div
                variants={collapse}
                initial="hidden"
                animate="show"
                exit="exit"
                style={{ overflow: 'hidden' }}
              >
                <div className="form-grid" style={{ marginTop: 14 }}>
                  <Field
                    label="Username"
                    required
                    error={errors.username}
                    shakeSignal={attempt}
                  >
                    {(id, invalid) => (
                      <input
                        id={id}
                        className={`input ${invalid ? 'invalid' : ''}`}
                        value={form.username}
                        onChange={set('username')}
                        placeholder="e.g. jdelacruz"
                        autoComplete="off"
                      />
                    )}
                  </Field>

                  <Field
                    label="Password"
                    required
                    error={errors.password}
                    shakeSignal={attempt}
                  >
                    {(id, invalid) => (
                      <>
                        <PasswordInput
                          id={id}
                          value={form.password}
                          onChange={set('password')}
                          invalid={invalid}
                          placeholder="8+ characters"
                          autoComplete="new-password"
                        />
                        <StrengthMeter password={form.password} />
                      </>
                    )}
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" icon={isEdit ? Save : UserPlus} loading={saving}>
          {isEdit ? 'Save changes' : 'Create employee'}
        </Button>
      </div>
    </form>
  );
}
