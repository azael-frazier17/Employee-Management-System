import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Briefcase,
  Building2,
  ChevronDown,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { collapse, fadeUp, stagger } from '../utils/motion';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Field from '../components/ui/Field';
import { SkeletonCards } from '../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import './Departments.css';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [deptModal, setDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [deptError, setDeptError] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  const [posModal, setPosModal] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [posForm, setPosForm] = useState({ department_id: '', title: '', description: '' });
  const [posErrors, setPosErrors] = useState({});
  const [savingPos, setSavingPos] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dRes, pRes] = await Promise.all([
        api.get('/departments'),
        api.get('/departments/positions'),
      ]);
      const depts = dRes.data.data || [];
      setDepartments(depts);
      setPositions(pRes.data.data || []);
      setExpandedId((prev) => (prev !== null ? prev : depts[0]?.id ?? null));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDeptModal = (dept = null) => {
    setEditingDept(dept);
    setDeptForm({ name: dept?.name || '', description: dept?.description || '' });
    setDeptError('');
    setDeptModal(true);
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    const name = deptForm.name.trim();
    if (!name) {
      setDeptError('Department name is required.');
      return;
    }
    setSavingDept(true);
    try {
      const payload = { name, description: deptForm.description.trim() || null };
      if (editingDept) {
        const res = await api.put(`/departments/${editingDept.id}`, payload);
        toast.success(res.data.message || 'Department updated.');
      } else {
        const res = await api.post('/departments', payload);
        toast.success(res.data.message || 'Department created.');
        setExpandedId(res.data.data?.id ?? expandedId);
      }
      setDeptModal(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingDept(false);
    }
  };

  const openPosModal = (pos = null, defaultDeptId = '') => {
    setEditingPos(pos);
    setPosForm({
      department_id: pos?.department_id
        ? String(pos.department_id)
        : defaultDeptId
        ? String(defaultDeptId)
        : String(departments[0]?.id || ''),
      title: pos?.title || '',
      description: pos?.description || '',
    });
    setPosErrors({});
    setPosModal(true);
  };

  const handleSavePos = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!posForm.department_id) errs.department_id = 'Department is required.';
    if (!posForm.title.trim()) errs.title = 'Position title is required.';
    setPosErrors(errs);
    if (Object.keys(errs).length) return;

    setSavingPos(true);
    try {
      const payload = {
        department_id: Number(posForm.department_id),
        title: posForm.title.trim(),
        description: posForm.description.trim() || null,
      };
      if (editingPos) {
        const res = await api.put(`/departments/positions/${editingPos.id}`, payload);
        toast.success(res.data.message || 'Position updated.');
      } else {
        const res = await api.post('/departments/positions', payload);
        toast.success(res.data.message || 'Position created.');
        setExpandedId(Number(posForm.department_id));
      }
      setPosModal(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPos(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      const url =
        deleting.type === 'department'
          ? `/departments/${deleting.item.id}`
          : `/departments/positions/${deleting.item.id}`;
      const res = await api.delete(url);
      toast.success(res.data.message || 'Deleted.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setBusyDelete(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        icon={Building2}
        title="Departments & Positions"
        subtitle="Click any department card to view and manage its job positions."
        actions={
          <>
            <Button
              variant="secondary"
              icon={Briefcase}
              onClick={() => openPosModal(null, expandedId)}
              disabled={departments.length === 0}
            >
              Add Position
            </Button>
            <Button icon={Plus} onClick={() => openDeptModal(null)}>
              Add Department
            </Button>
          </>
        }
      />

      {error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : loading ? (
        <SkeletonCards count={6} height={170} />
      ) : departments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Building2}
            title="No departments yet"
            message="Create your first department to start organizing positions and employees."
            action={
              <Button size="sm" icon={Plus} onClick={() => openDeptModal(null)}>
                Add Department
              </Button>
            }
          />
        </div>
      ) : (
        <motion.div className="dept-grid" variants={stagger} initial="hidden" animate="show">
          {departments.map((dept) => {
            const isExpanded = expandedId === dept.id;
            const deptPositions = positions.filter((p) => Number(p.department_id) === Number(dept.id));
            return (
              <motion.div
                key={dept.id}
                variants={fadeUp}
                className={`card card-hover dept-card ${isExpanded ? 'expanded' : ''}`}
              >
                <div
                  className="dept-card-top"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : dept.id);
                    }
                  }}
                >
                  <div className="dept-icon">
                    <Building2 size={20} />
                  </div>
                  <div className="dept-info">
                    <h3>{dept.name}</h3>
                    <p className="muted small">
                      {dept.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="dept-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => openDeptModal(dept)}
                      aria-label={`Edit ${dept.name}`}
                      title="Edit department"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => setDeleting({ type: 'department', item: dept })}
                      aria-label={`Delete ${dept.name}`}
                      title="Delete department"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div
                  className="dept-meta"
                  onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                >
                  <span className="chip num">
                    <Briefcase size={13} /> {dept.position_count ?? deptPositions.length} positions
                  </span>
                  <span className="chip num">
                    <Users size={13} /> {dept.employee_count ?? 0} employees
                  </span>
                  <span className="spacer" />
                  <span className="dept-expand-label">
                    {isExpanded ? 'Hide' : 'Positions'}
                    <ChevronDown size={15} className={`chev ${isExpanded ? 'open' : ''}`} />
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      className="dept-positions"
                      variants={collapse}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                    >
                      <div className="dept-positions-head">
                        <span>Positions in {dept.name}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={Plus}
                          onClick={() => openPosModal(null, dept.id)}
                        >
                          Add position
                        </Button>
                      </div>

                      {deptPositions.length === 0 ? (
                        <div className="dept-pos-empty muted small">
                          No positions in this department yet.
                        </div>
                      ) : (
                        <div className="dept-pos-list">
                          {deptPositions.map((pos) => (
                            <div className="dept-pos-item" key={pos.id}>
                              <div className="dept-pos-main">
                                <strong>{pos.title}</strong>
                                {pos.description && (
                                  <span className="muted small">{pos.description}</span>
                                )}
                              </div>
                              <span className="chip num" style={{ height: 24, fontSize: 11.5 }}>
                                <Users size={12} /> {pos.employee_count ?? 0}
                              </span>
                              <div className="row" style={{ gap: 2 }}>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => openPosModal(pos)}
                                  aria-label={`Edit position ${pos.title}`}
                                  title="Edit position"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn danger"
                                  onClick={() => setDeleting({ type: 'position', item: pos })}
                                  aria-label={`Delete position ${pos.title}`}
                                  title="Delete position"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal
        open={deptModal}
        onClose={() => !savingDept && setDeptModal(false)}
        title={editingDept ? `Edit ${editingDept.name}` : 'Add Department'}
        description="Departments group job positions and employees."
        icon={Building2}
        size="sm"
      >
        <form className="stack" style={{ gap: 14 }} onSubmit={handleSaveDept} noValidate>
          <Field label="Department name" required error={deptError}>
            {(id, invalid) => (
              <input
                id={id}
                className={`input ${invalid ? 'invalid' : ''}`}
                value={deptForm.name}
                onChange={(e) => {
                  setDeptForm((f) => ({ ...f, name: e.target.value }));
                  setDeptError('');
                }}
                maxLength={100}
                placeholder="e.g. Information Technology"
              />
            )}
          </Field>
          <Field label="Description">
            {(id) => (
              <textarea
                id={id}
                className="textarea"
                value={deptForm.description}
                onChange={(e) => setDeptForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={255}
                placeholder="What this department handles…"
              />
            )}
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setDeptModal(false)} disabled={savingDept}>
              Cancel
            </Button>
            <Button type="submit" icon={Save} loading={savingDept}>
              {editingDept ? 'Save changes' : 'Create department'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={posModal}
        onClose={() => !savingPos && setPosModal(false)}
        title={editingPos ? `Edit ${editingPos.title}` : 'Add Position'}
        description="Assign a job title to a department."
        icon={Briefcase}
        size="sm"
      >
        <form className="stack" style={{ gap: 14 }} onSubmit={handleSavePos} noValidate>
          <Field label="Department" required error={posErrors.department_id}>
            {(id, invalid) => (
              <select
                id={id}
                className={`select ${invalid ? 'invalid' : ''}`}
                value={posForm.department_id}
                onChange={(e) => setPosForm((f) => ({ ...f, department_id: e.target.value }))}
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Position title" required error={posErrors.title}>
            {(id, invalid) => (
              <input
                id={id}
                className={`input ${invalid ? 'invalid' : ''}`}
                value={posForm.title}
                onChange={(e) => setPosForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={100}
                placeholder="e.g. Software Developer"
              />
            )}
          </Field>
          <Field label="Description">
            {(id) => (
              <textarea
                id={id}
                className="textarea"
                value={posForm.description}
                onChange={(e) => setPosForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={255}
                placeholder="Responsibilities or role summary…"
              />
            )}
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setPosModal(false)} disabled={savingPos}>
              Cancel
            </Button>
            <Button type="submit" icon={Save} loading={savingPos}>
              {editingPos ? 'Save changes' : 'Create position'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        loading={busyDelete}
        title={
          deleting?.type === 'department' ? 'Delete department?' : 'Delete position?'
        }
        confirmText="Delete"
        message={
          deleting && (
            <p>
              Are you sure you want to delete{' '}
              <strong>{deleting.item.name || deleting.item.title}</strong>? If employees or
              positions are still linked to it, the server will block the deletion safely.
            </p>
          )
        }
      />
    </div>
  );
}
