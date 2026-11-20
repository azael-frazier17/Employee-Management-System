import { useEffect, useState } from 'react';
import { Eye,EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { formatDate,formatTime,tenure,getErrorMessage } from '../utils/helpers';
import PageTransition from '../components/ui/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export default function Profile(){
  const [employee,setEmployee]=useState(null);const [leaves,setLeaves]=useState([]);const [attendance,setAttendance]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const [password,setPassword]=useState({current_password:'',new_password:'',confirm:''});const [show,setShow]=useState(false);const [saving,setSaving]=useState(false);
  const load=async()=>{
    setLoading(true);setError('');
    try{const [e,l,a]=await Promise.all([api.get('/employees/me'),api.get('/leaves/my',{params:{limit:3}}),api.get('/attendance/my',{params:{limit:7}})]);setEmployee(e.data.data);setLeaves(l.data.data||[]);setAttendance(a.data.data||[]);}catch(err){setError(getErrorMessage(err));}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);
  const changePassword=async(e)=>{
    e.preventDefault();
    if(password.new_password!==password.confirm){toast.error('New passwords do not match.');return;}
    setSaving(true);
    try{const r=await api.put('/auth/change-password',{current_password:password.current_password,new_password:password.new_password});toast.success(r.data.message);setPassword({current_password:'',new_password:'',confirm:''});}catch(err){toast.error(getErrorMessage(err));}finally{setSaving(false);}
  };
  if(error)return <PageTransition><EmptyState title="Could not load profile" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;
  if(loading)return <PageTransition><PageHeader title="My Profile"/><Skeleton rows={5} type="card"/></PageTransition>;
  const leaveCounts={Pending:0,Approved:0,Rejected:0};leaves.forEach(l=>leaveCounts[l.status]=(leaveCounts[l.status]||0)+1);
  const strength=password.new_password.length>=12?3:password.new_password.length>=8?2:password.new_password.length?1:0;
  return <PageTransition>
    <PageHeader title="My Profile"/>
    <div className="profile-banner"><div className="profile-avatar"><Avatar name={employee.full_name} size={112}/></div><div className="profile-heading"><h2>{employee.full_name}</h2><p>{employee.position_title||'Unassigned'} | {employee.department_name||'No department'}</p></div></div>
    <div className="profile-grid"><div className="card"><div className="card-head"><h3>Employee information</h3><StatusBadge status={employee.status}/></div><div className="card-body"><div className="info-grid">{[['Employee code',employee.employee_code],['Email',employee.email],['Phone',employee.phone],['Address',employee.address],['Birth date',formatDate(employee.birth_date)],['Gender',employee.gender],['Date hired',formatDate(employee.date_hired)],['Tenure',tenure(employee.date_hired)],['Username',employee.username],['Role',employee.role]].map(([k,v])=><div className="info-item" key={k}><span>{k}</span><strong>{v||'-'}</strong></div>)}</div></div></div>
      <div className="card"><div className="card-head"><h3>Leave summary</h3></div><div className="card-body"><div className="summary-strip" style={{gridTemplateColumns:'repeat(3,1fr)'}}>{['Pending','Approved','Rejected'].map(s=><div className="summary-chip" key={s}><span>{s}</span><strong>{leaveCounts[s]}</strong></div>)}</div>{leaves.map(l=><div className="list-item" key={l.id}><div className="list-item-main" style={{flex:1}}><strong>{l.leave_type}</strong><span>{formatDate(l.start_date)} - {formatDate(l.end_date)}</span></div><StatusBadge status={l.status}/></div>)}</div></div>
    </div>
    <div className="grid grid-2" style={{marginTop:16}}>
      <div className="card"><div className="card-head"><h3>Last 7 attendance records</h3></div><div className="card-body">{attendance.length?attendance.map(r=><div className="list-item" key={r.id}><div className="list-item-main" style={{flex:1}}><strong>{formatDate(r.attendance_date)}</strong><span>{formatTime(r.time_in)} - {formatTime(r.time_out)}</span></div><StatusBadge status={r.status}/></div>):<EmptyState title="No attendance records"/>}</div></div>
      <div className="card"><div className="card-head"><h3>Change password</h3></div><div className="card-body"><form onSubmit={changePassword}><div className="field"><label>Current password</label><input type={show?'text':'password'} value={password.current_password} onChange={e=>setPassword(v=>({...v,current_password:e.target.value}))} required/></div><div className="field"><label>New password</label><div className="password-wrap"><input type={show?'text':'password'} value={password.new_password} onChange={e=>setPassword(v=>({...v,new_password:e.target.value}))} required/><button type="button" aria-label="Toggle password" onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div><div className="mini-bars" style={{height:5,padding:0}}>{[1,2,3].map(n=><span key={n} style={{height:5,background:n<=strength?'var(--primary)':'var(--border)',borderRadius:4,width:'100%'}}/>)}</div></div><div className="field"><label>Confirm new password</label><input type={show?'text':'password'} value={password.confirm} onChange={e=>setPassword(v=>({...v,confirm:e.target.value}))} required/></div><Button type="submit" loading={saving}>Update password</Button></form></div></div>
    </div>
  </PageTransition>;
}
