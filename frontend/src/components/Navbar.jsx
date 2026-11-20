import { Menu, LogOut, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import Avatar from './ui/Avatar';
import ThemeToggle from './ui/ThemeToggle';

export default function Navbar({ title, onMenu }) {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();
  const doLogout = () => { logout(); navigate('/login'); };
  return (
    <header className="navbar">
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={onMenu}><Menu size={19}/></button>
        <div className="navbar-title"><span>Acme</span><strong>{title}</strong></div>
      </div>
      <div className="navbar-actions">
        <ThemeToggle theme={theme} onToggle={toggleTheme}/>
        <div className="user-menu"><Avatar name={user?.fullName || user?.username} size={34}/><div className="user-copy"><strong>{user?.fullName || user?.username}</strong><span>{user?.role}</span></div></div>
        <button className="icon-button" aria-label="Change password" title="Change password" onClick={() => navigate('/profile')}><KeyRound size={17}/></button>
        <button className="icon-button" aria-label="Log out" title="Log out" onClick={doLogout}><LogOut size={17}/></button>
      </div>
    </header>
  );
}
