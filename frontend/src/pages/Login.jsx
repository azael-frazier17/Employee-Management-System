import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UsersRound, Clock3, CheckCircle2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { getErrorMessage } from '../utils/helpers';
import Button from '../components/ui/Button';

export default function Login() {
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [showPassword,setShowPassword] = useState(false);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username,password);
      navigate('/',{replace:true});
    } catch (err) { setError(getErrorMessage(err,'Unable to sign in.')); }
    finally { setLoading(false); }
  };
  const fill = (name) => { setUsername(name); setPassword(name === 'admin' ? 'Admin@123' : 'Employee@123'); setError(''); };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-content">
          <div className="brand-mark"><UsersRound size={22}/></div>
          <h1>All your employee records, in one safe place.</h1>
          <p>A complete, modern workspace for your HR team and every employee.</p>
          <div className="login-highlights">
            <div className="login-highlight"><span><UsersRound size={18}/></span>Employee records</div>
            <div className="login-highlight"><span><Clock3 size={18}/></span>Attendance</div>
            <div className="login-highlight"><span><CheckCircle2 size={18}/></span>Leave approvals</div>
          </div>
        </div>
      </section>
      <section className="login-side">
        <form className="login-card" onSubmit={submit}>
          <h2>Welcome back</h2><p>Sign in to continue to your workspace.</p>
          {error && <div className="login-error" role="alert">{error}</div>}
          <div className="field"><label htmlFor="username">Username</label><input id="username" autoComplete="username" value={username} onChange={(e)=>setUsername(e.target.value)} required/></div>
          <div className="field"><label htmlFor="password">Password</label><div className="password-wrap"><input id="password" type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} required/><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
          <Button type="submit" loading={loading} size="lg" style={{width:'100%'}}>Sign in</Button>
          <div style={{marginTop:18,fontSize:11,color:'var(--muted)',fontWeight:700}}>DEMO ACCOUNTS</div>
          <div className="demo-row"><button type="button" className="demo-chip" onClick={()=>fill('admin')}>Admin</button><button type="button" className="demo-chip" onClick={()=>fill('jdelacruz')}>Employee</button></div>
        </form>
        <div className="login-footer">ITPE 101 | BSIT 2C | Group 1</div>
      </section>
    </main>
  );
}
