import { Plane, Thermometer, Siren, Baby, HeartHandshake, FileText } from 'lucide-react';

export const APP_NAME = 'Employee Management System';
export const COMPANY_NAME = 'Acme';

// Leave types (same list as the backend) with an icon + color for each
export const LEAVE_TYPES = [
  { value: 'Vacation', icon: Plane, tone: 'info' },
  { value: 'Sick', icon: Thermometer, tone: 'danger' },
  { value: 'Emergency', icon: Siren, tone: 'warning' },
  { value: 'Maternity', icon: Baby, tone: 'primary' },
  { value: 'Paternity', icon: HeartHandshake, tone: 'accent' },
  { value: 'Other', icon: FileText, tone: 'primary' },
];

export const leaveTypeMeta = (type) =>
  LEAVE_TYPES.find((t) => t.value === type) || LEAVE_TYPES[LEAVE_TYPES.length - 1];

export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected'];
export const ATTENDANCE_STATUSES = ['Present', 'Late', 'Absent'];
export const EMPLOYEE_STATUSES = ['Active', 'Inactive'];
export const GENDERS = ['Male', 'Female', 'Other'];

// Status -> color tone used by StatusBadge
export const STATUS_TONES = {
  Active: 'success',
  Present: 'success',
  Approved: 'success',
  Late: 'warning',
  Pending: 'warning',
  Absent: 'danger',
  Rejected: 'danger',
  Inactive: 'danger',
  Admin: 'primary',
  Employee: 'info',
};

// Hex values for charts (SVG needs real colors)
export const COLORS = {
  primary: '#6366F1',
  violet: '#8B5CF6',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
  info: '#3B82F6',
};

export const CHART_PALETTE = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#3B82F6', '#EC4899'];

// Demo logins from database/seed.sql (shown as chips on the login page)
export const DEMO_ACCOUNTS = [
  { label: 'Admin', username: 'admin', password: 'Admin@123' },
  { label: 'Employee', username: 'jdelacruz', password: 'Employee@123' },
  { label: 'Employee 2', username: 'areyes', password: 'Employee@123' },
  { label: 'Inactive', username: 'btorres', password: 'Employee@123' },
];

export const PAGE_SIZE = 10;
