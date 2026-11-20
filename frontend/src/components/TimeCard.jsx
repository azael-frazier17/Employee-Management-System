import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  ShieldAlert,
  Timer,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { formatHours, formatTime, longToday } from '../utils/helpers';
import StatusBadge from './ui/StatusBadge';
import { Skeleton } from './ui/Skeleton';
import { ErrorState } from './ui/EmptyState';
import './TimeCard.css';

/** Live clock text from the computer clock, e.g. "08:59:42 AM". */
const useClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/**
 * Time In / Time Out card.
 * State comes from GET /attendance/today. The SERVER sets the real time and
 * decides if the employee is Late; this card only shows the result.
 *   compact: smaller horizontal version (Admin attendance page)
 *   onChange(record): called after a successful time in / out
 */
export default function TimeCard({ compact = false, onChange }) {
  const clock = useClock();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [justDone, setJustDone] = useState(false); // shows the drawn checkmark

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/attendance/today');
      setRecord(res.data.data.record);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Which step are we on? in -> out -> done
  const step = !record || !record.time_in ? 'in' : !record.time_out ? 'out' : 'done';

  const handleClick = async () => {
    if (step === 'done' || busy) return;
    setBusy(true);
    try {
      const res = await api.post(step === 'in' ? '/attendance/time-in' : '/attendance/time-out');
      setRecord(res.data.data);
      setJustDone(true);
      setTimeout(() => setJustDone(false), 1800);
      if (res.data.data.status === 'Late' && step === 'in') toast(res.data.message, { icon: '⏰' });
      else toast.success(res.data.message);
      onChange?.(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      load(); // 409 = already done: refresh the real state
    } finally {
      setBusy(false);
    }
  };

  const btnLabel = { in: 'Time In', out: 'Time Out', done: 'Done for today' }[step];
  const stepStatus = {
    in: 'Ready to clock in',
    out: 'Currently clocked in',
    done: 'Shift completed',
  }[step];
  const BtnIcon = { in: LogIn, out: LogOut, done: CheckCircle2 }[step];

  if (error) {
    return (
      <div className={`card time-card ${compact ? 'compact' : ''}`}>
        <ErrorState message={error} onRetry={load} compact />
      </div>
    );
  }

  return (
    <div className={`card card-hover time-card ${compact ? 'compact' : ''}`}>
      <div className="time-card-bg" aria-hidden="true" />

      <div className="time-top">
        <div className="time-clock">
          <div className="time-badges">
            <span className="time-eyebrow">
              <Clock size={13} /> Live Attendance
            </span>
            <span className={`time-live-pill step-${step}`}>
              <span className="time-live-dot" />
              {stepStatus}
            </span>
          </div>
          <div className="clock num" aria-live="off">
            {clock}
          </div>
          <div className="time-date-row">
            <Calendar size={13} />
            <span>{longToday()}</span>
          </div>
          {!compact && (
            <div className="time-schedule-hint">
              <Timer size={13} />
              <span>Shift starts 09:00 AM · 15m grace window</span>
            </div>
          )}
        </div>

        {/* Big round button with pulsing ring while an action is available */}
        <div className="time-action">
          {loading ? (
            <Skeleton width={compact ? 116 : 146} height={compact ? 116 : 146} radius={999} />
          ) : (
            <button
              type="button"
              className={`time-btn step-${step}`}
              onClick={handleClick}
              disabled={step === 'done' || busy}
              aria-label={btnLabel}
            >
              {step !== 'done' && !busy && <span className="time-ring" aria-hidden="true" />}
              {step !== 'done' && !busy && <span className="time-ring delay" aria-hidden="true" />}
              <AnimatePresence mode="wait" initial={false}>
                {justDone ? (
                  <motion.svg
                    key="check"
                    width="54"
                    height="54"
                    viewBox="0 0 52 52"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-hidden="true"
                  >
                    <motion.circle
                      cx="26"
                      cy="26"
                      r="23"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45 }}
                    />
                    <motion.path
                      d="M15 27 l7 7 l15 -16"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.35, delay: 0.35 }}
                    />
                  </motion.svg>
                ) : (
                  <motion.span
                    key={step}
                    className="time-btn-content"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    {busy ? (
                      <span className="spinner" style={{ width: 26, height: 26 }} />
                    ) : (
                      <BtnIcon size={compact ? 24 : 28} />
                    )}
                    <span>{btnLabel}</span>
                    {step !== 'done' && <small>Click to record</small>}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}
        </div>
      </div>

      {/* Today's details */}
      <div className="time-details">
        <div className="time-detail">
          <span>
            <LogIn size={12} /> Time in
          </span>
          <strong className="num">{loading ? '…' : formatTime(record?.time_in)}</strong>
        </div>
        <div className="time-detail">
          <span>
            <LogOut size={12} /> Time out
          </span>
          <strong className="num">{loading ? '…' : formatTime(record?.time_out)}</strong>
        </div>
        <div className="time-detail">
          <span>
            <Timer size={12} /> Hours worked
          </span>
          <strong className="num">{loading ? '…' : formatHours(record?.hours_worked)}</strong>
        </div>
        <div className="time-detail">
          <span>
            <ShieldAlert size={12} /> Status
          </span>
          <div>
            {record ? (
              <StatusBadge status={record.status} />
            ) : (
              <span className="muted" style={{ fontWeight: 600 }}>
                Not yet
              </span>
            )}
          </div>
        </div>
      </div>

      {record?.status === 'Late' && (
        <div className="alert alert-warning time-note">
          <AlertTriangle size={16} />
          <span>
            The server marked you Late because you timed in after the start of work plus the grace
            period.
          </span>
        </div>
      )}
      {record?.status === 'Absent' && !record.time_in && (
        <div className="alert alert-info time-note">
          <AlertTriangle size={16} />
          <span>You were marked Absent for today. Timing in now will update your record.</span>
        </div>
      )}
    </div>
  );
}
