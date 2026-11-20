import { LayoutDashboard, Users, Building2, Clock3, CalendarDays, FileChartColumn, UserRound, ChevronLeft, ChevronRight, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import Avatar from './ui/Avatar';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen }) {
  const { user, isAdmin } = useAuth();
  const adminItems = [
    ['Dashboard','/','Dashboard',LayoutDashboard], ['Employees','/employees','Employees',Users],
    ['Departments','/departments','Departments & Positions',Building2], ['Attendance','/attendance','Attendance',Clock3],
    ['Leaves','/leaves','Leave Requests',CalendarDays], ['Reports','/reports','Reports',FileChartColumn],
    ['Profile','/profile','My Profile',UserRound],
  ];
  const employeeItems = [
    ['Dashboard','/','Dashboard',LayoutDashboard], ['Attendance','/attendance','My Attendance',Clock3],
    ['Leaves','/leaves','My Leaves',CalendarDays], ['Profile','/profile','My Profile',UserRound],
  ];
  const items = isAdmin ? adminItems : employeeItems;
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><UsersRound size={21}/></div>
        <span className="brand-name">EMS</span>
        <button className="sidebar-toggle" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
        </button>
      </div>
      <div className="nav-label">{isAdmin ? 'ADMINISTRATION' : 'WORKSPACE'}</div>
      <nav className="sidebar-nav">
        {items.map(([key,path,label,Icon]) => (
          <NavLink key={key} to={path} end={path === '/'} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} title={collapsed ? label : undefined}>
            {({isActive}) => <><motion.span layoutId="active-nav" className={isActive ? 'active-glow' : ''}/><Icon size={19}/><span className="nav-name">{label}</span></>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user"><Avatar name={user?.fullName || user?.username} size={36}/><div className="sidebar-user-copy"><strong>{user?.fullName || user?.username}</strong><span>{user?.role}</span></div></div>
    </aside>
  );
}
