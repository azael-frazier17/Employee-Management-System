import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trash2,
  UserCircle,
  XCircle,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import useAuth from '../hooks/useAuth';
import { leaveTypeMeta } from '../utils/constants';
import {
  formatDate,
  formatHours,
  formatShortDate,
  formatTime,
  tenure,
} from '../utils/helpers';
import { fadeUp, stagger } from '../utils/motion';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import { Skeleton, SkeletonList } from '../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import ChangePasswordForm from '../components/ChangePasswordForm';
import './Profile.css';

export default function Profile() {
  const { user, updateAvatar } = useAuth();
  const [profile, setProfile] = useState(null);
  const [noEmployeeRecord, setNoEmployeeRecord] = useState(false);
  const [leaveCounts, setLeaveCounts] = useState({ Pending: 0, Approved: 0, Rejected: 0 });
  const [latestLeaves, setLatestLeaves] = useState([]);
  const [recentAtt, setRecentAtt] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoEmployeeRecord(false);
    try {
      const empRes = await api.get('/employees/me');
      setProfile(empRes.data.data);

      const [leavesRes, attRes] = await Promise.all([
        api.get('/leaves/my', { params: { limit: 100 } }),
        api.get('/attendance/my', { params: { limit: 7 } }),
      ]);
      const allLeaves = leavesRes.data.data || [];
      const counts = allLeaves.reduce(
        (acc, l) => {
          acc[l.status] = (acc[l.status] || 0) + 1;
          return acc;
        },
        { Pending: 0, Approved: 0, Rejected: 0 }
      );
      setLeaveCounts(counts);
      setLatestLeaves(allLeaves.slice(0, 3));
      setRecentAtt(attRes.data.data || []);
    } catch (err) {
      if (err?.response?.status === 404) {
        setNoEmployeeRecord(true);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const displayName = profile?.full_name || user?.fullName || user?.username || '';

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      updateAvatar(dataUrl);
      try {
        if (displayName) localStorage.setItem(`ems-avatar-name-${displayName}`, dataUrl);
      } catch {
        // ignore quota
      }
      toast.success('Profile photo updated.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateAvatar(null);
    try {
      if (displayName) localStorage.removeItem(`ems-avatar-name-${displayName}`);
    } catch {
      // ignore
    }
    toast.success('Profile photo reset to initials.');
  };

  if (error) {
    return (
      <div className="card">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <motion.div className="stack" variants={stagger} initial="hidden" animate="show">
      {/* Gradient Banner + Large Avatar */}
      <motion.div className="card profile-hero" variants={fadeUp}>
        <div className="profile-banner" aria-hidden="true" />
        <div className="profile-hero-body">
          <div className="profile-avatar-wrap">
            <Avatar name={displayName} src={user?.avatar} size={88} ring className="profile-avatar" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoUpload}
            />
            <button
              type="button"
              className="profile-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Change profile photo"
              aria-label="Change profile photo"
            >
              <Camera size={14} />
            </button>
            {user?.avatar && (
              <button
                type="button"
                className="profile-photo-remove"
                onClick={handleRemovePhoto}
                title="Remove photo"
                aria-label="Remove profile photo"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <div className="profile-identity">
            <div className="row-wrap" style={{ gap: 10 }}>
              <h1>{displayName}</h1>
              {profile?.status && <StatusBadge status={profile.status} />}
              <StatusBadge status={user?.role} />
            </div>
            <p className="muted">
              {profile
                ? `${profile.position_title || 'Unassigned position'} · ${
                    profile.department_name || 'Unassigned department'
                  }`
                : `${user?.role} account (@${user?.username})`}
            </p>
            {profile?.employee_code && (
              <div className="row-wrap" style={{ marginTop: 8 }}>
                <span className="chip num">{profile.employee_code}</span>
                <span className="chip">
                  Hired {formatDate(profile.date_hired)} · {tenure(profile.date_hired)}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="profile-grid">
        {/* Left column: Info grid + Change password */}
        <div className="stack">
          <motion.div className="card card-hover" variants={fadeUp}>
            <div className="card-head">
              <div className="card-title">
                <UserCircle size={17} /> Personal &amp; Account Information
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <Skeleton height={210} radius={12} />
              ) : noEmployeeRecord ? (
                <p className="muted small">
                  Your user account (<strong>@{user?.username}</strong>, role{' '}
                  <strong>{user?.role}</strong>) is not linked to an employee record.
                </p>
              ) : (
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">
                      <Mail size={14} /> Email
                    </span>
                    <strong>{profile?.email || '—'}</strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Phone size={14} /> Phone
                    </span>
                    <strong>{profile?.phone || '—'}</strong>
                  </div>
                  <div className="info-item span-2">
                    <span className="info-label">
                      <MapPin size={14} /> Address
                    </span>
                    <strong>{profile?.address || '—'}</strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Calendar size={14} /> Birth date
                    </span>
                    <strong>{formatDate(profile?.birth_date)}</strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <UserCircle size={14} /> Gender
                    </span>
                    <strong>{profile?.gender || '—'}</strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Building2 size={14} /> Department
                    </span>
                    <strong>{profile?.department_name || 'Unassigned'}</strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Briefcase size={14} /> Position
                    </span>
                    <strong>{profile?.position_title || 'Unassigned'}</strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Calendar size={14} /> Date hired &amp; tenure
                    </span>
                    <strong>
                      {formatDate(profile?.date_hired)} ({tenure(profile?.date_hired)})
                    </strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <Shield size={14} /> Username &amp; role
                    </span>
                    <strong>
                      @{profile?.username || user?.username} · {profile?.role || user?.role}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Change password card */}
          <motion.div className="card card-hover" id="password" variants={fadeUp}>
            <div className="card-head">
              <div className="card-title">
                <KeyRound size={17} /> Change password
              </div>
            </div>
            <div className="card-body">
              <ChangePasswordForm />
            </div>
          </motion.div>
        </div>

        {/* Right column: Leave summary + Last 7 attendance records */}
        <div className="stack">
          {/* Leave summary */}
          <motion.div className="card card-hover" variants={fadeUp}>
            <div className="card-head">
              <div className="card-title">
                <CalendarDays size={17} /> Leave summary
              </div>
            </div>
            <div className="card-body stack" style={{ gap: 14 }}>
              <div className="row-wrap">
                <div className="summary-chip">
                  <span className="dot-icon tone-warning">
                    <Clock size={16} />
                  </span>
                  <div>
                    <strong>{leaveCounts.Pending}</strong>
                    <span>Pending</span>
                  </div>
                </div>
                <div className="summary-chip">
                  <span className="dot-icon tone-success">
                    <CheckCircle2 size={16} />
                  </span>
                  <div>
                    <strong>{leaveCounts.Approved}</strong>
                    <span>Approved</span>
                  </div>
                </div>
                <div className="summary-chip">
                  <span className="dot-icon tone-danger">
                    <XCircle size={16} />
                  </span>
                  <div>
                    <strong>{leaveCounts.Rejected}</strong>
                    <span>Rejected</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <SkeletonList rows={3} />
              ) : latestLeaves.length === 0 ? (
                <EmptyState
                  compact
                  icon={CalendarDays}
                  title="No leave history"
                  message="Your recent leave requests will appear here."
                />
              ) : (
                <div className="list">
                  {latestLeaves.map((lv) => {
                    const meta = leaveTypeMeta(lv.leave_type);
                    const TypeIcon = meta.icon;
                    return (
                      <div className="list-item" key={lv.id}>
                        <span
                          className={`dot-icon tone-${meta.tone}`}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <TypeIcon size={16} />
                        </span>
                        <div className="grow">
                          <div className="person-name">
                            {lv.leave_type} · {lv.total_days}d
                          </div>
                          <div className="person-sub">
                            {formatShortDate(lv.start_date)} – {formatShortDate(lv.end_date)}
                          </div>
                        </div>
                        <StatusBadge status={lv.status} size="sm" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Last 7 attendance records */}
          <motion.div className="card card-hover" variants={fadeUp}>
            <div className="card-head">
              <div className="card-title">
                <CalendarClock size={17} /> Last 7 attendance records
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <SkeletonList rows={4} />
              ) : recentAtt.length === 0 ? (
                <EmptyState
                  compact
                  icon={CalendarClock}
                  title="No attendance logs yet"
                  message="Clock in from the dashboard or attendance page."
                />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>In</th>
                        <th>Out</th>
                        <th>Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAtt.map((r) => (
                        <tr key={r.id}>
                          <td className="num">{formatDate(r.attendance_date)}</td>
                          <td className="num">{formatTime(r.time_in)}</td>
                          <td className="num">{formatTime(r.time_out)}</td>
                          <td className="num">{formatHours(r.hours_worked)}</td>
                          <td>
                            <StatusBadge status={r.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
