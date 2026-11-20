import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Clock3, CalendarDays, Plus, UserRound } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import { formatDate, greeting, getErrorMessage, monthRange } from '../utils/helpers';
import PageTransition from '../components/ui/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Avatar from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard/> : <EmployeeDashboard/>;
}

function AdminDashboard() {
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [headcount,setHeadcount] = useState(null);
  const [attendance,setAttendance] = useState(null);
  const [leaveSummary,setLeaveSummary] = useState(null);
  const [pending,setPending] = useState([]);
  const [pendingTotal,setPendingTotal] = useState(0);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);setError('');
    try {
      const [h,a,l,p] = await Promise.all([
        api.get('/employees/reports/summary'), api.get('/attendance/reports/summary'),
        api.get('/leaves/reports/summary'), api.get('/leaves',{params:{status:'Pending',limit:5,page:1}})
      ]);
      setHeadcount(h.data.data);setAttendance(a.data.data);setLeaveSummary(l.data.data);
      setPending(p.data.data);setPendingTotal(p.data.pagination?.total || 0);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };
  useEffect(()=>{load();},[]);

  const review = async (leave,status) => {
    try {
      await api.patch(`/leaves/${leave.id}/status`,{status});
      toast.success(`Leave request ${status.toLowerCase()}.`);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };
  if (loading) return <PageTransition><PageHeader title="Dashboard"/><Skeleton rows={4} type="card"/></PageTransition>;
  if (error) return <PageTransition><EmptyState title="Dashboard unavailable" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;

  const totals=headcount?.totals||{};
  const onLeave=leaveSummary?.on_leave_today||[];
  const departmentData=(headcount?.by_department||[]).map(d=>({name:d.department_name,total:d.total_employees}));
  const attendanceData=[
    {name:'Present',value:attendance?.totals?.present_days||0,color:'#10B981'},
    {name:'Late',value:attendance?.totals?.late_days||0,color:'#F59E0B'},
    {name:'Absent',value:attendance?.totals?.absent_days||0,color:'#F43F5E'},
  ];
  return (
    <PageTransition>
      <PageHeader title={`${greeting()}, Admin`} description={new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(new Date())}/>
      <div className="grid grid-4">
        <StatCard label="Total employees" value={totals.total_employees} icon={Users} tone="primary"/>
        <StatCard label="Active employees" value={totals.active_employees} icon={UserCheck} tone="success"/>
        <StatCard label="Pending leave requests" value={pendingTotal} icon={Clock3} tone="warning"/>
        <StatCard label="On leave today" value={onLeave.length} icon={CalendarDays} tone="info"/>
      </div>
      <div className="section-grid" style={{marginTop:16}}>
        <div className="grid grid-2">
          <div className="card"><div className="card-head"><h3>Employees by department</h3></div><div className="card-body chart-card"><ResponsiveContainer width="100%" height="100%"><BarChart data={departmentData}><XAxis dataKey="name" tick={{fontSize:10}}/><Tooltip/><Bar dataKey="total" radius={[6,6,0,0]} fill="#6366F1"/></BarChart></ResponsiveContainer></div></div>
          <div className="card"><div className="card-head"><h3>This month attendance</h3></div><div className="card-body chart-card"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={attendanceData} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={4}>{attendanceData.map(entry=><Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></div>
        </div>
        <div className="card"><div className="card-head"><h3>Pending leave requests</h3><Button size="sm" variant="ghost" onClick={()=>navigate('/leaves')}>View all</Button></div><div className="card-body">
          {pending.length ? pending.map(item=><div className="list-item" key={item.id}><Avatar name={item.employee_name} size={34}/><div className="list-item-main" style={{flex:1}}><strong>{item.employee_name}</strong><span>{item.leave_type} · {formatDate(item.start_date)}</span></div><div style={{display:'flex',gap:4}}><button className="icon-button" aria-label="Approve" onClick={()=>review(item,'Approved')}>✓</button><button className="icon-button" aria-label="Reject" onClick={()=>review(item,'Rejected')}>×</button></div></div>) : <EmptyState title="No pending requests"/>}
        </div></div>
      </div>
      <div className="grid grid-2" style={{marginTop:16}}>
        <div className="card"><div className="card-head"><h3>Recent hires</h3></div><div className="card-body">{(headcount?.recent_hires||[]).slice(0,5).map(h=><div className="list-item" key={h.id}><Avatar name={h.full_name}/><div className="list-item-main" style={{flex:1}}><strong>{h.full_name}</strong><span>{h.position_title || 'Unassigned'} · {h.department_name || 'No department'}</span></div><span style={{color:'var(--muted)',fontSize:11}}>{formatDate(h.date_hired)}</span></div>)}</div></div>
        <div className="card"><div className="card-head"><h3>On leave today</h3></div><div className="card-body">{onLeave.length?onLeave.map((person,index)=><div className="list-item" key={index}><Avatar name={person.employee_name}/><div className="list-item-main" style={{flex:1}}><strong>{person.employee_name}</strong><span>{person.department_name} · {person.leave_type}</span></div><StatusBadge status="Approved"/></div>):<EmptyState title="Everyone is available"/>}</div></div>
      </div>
    </PageTransition>
  );
}

function EmployeeDashboard() {
  const [attendance,setAttendance] = useState([]);const [leaves,setLeaves]=useState([]);const [today,setToday]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const navigate=useNavigate();
  const load=async()=>{
    setLoading(true);setError('');
    try {
      const range=monthRange();
      const [a,l,t]=await Promise.all([api.get('/attendance/my',{params:{...range,limit:100}}),api.get('/leaves/my',{params:{limit:5}}),api.get('/attendance/today')]);
      setAttendance(a.data.data||[]);setLeaves(l.data.data||[]);setToday(t.data.data?.record||null);
    } catch(err){setError(getErrorMessage(err));}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);
  const clock=async(action)=>{
    try {const res=await api.post(`/attendance/${action}`);toast.success(res.data.message);load();}
    catch(err){toast.error(getErrorMessage(err));}
  };
  if(loading)return <PageTransition><PageHeader title="Dashboard"/><Skeleton rows={4} type="card"/></PageTransition>;
  if(error)return <PageTransition><EmptyState title="Could not load dashboard" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;
  const counts={Present:0,Late:0,Absent:0};attendance.forEach(r=>{if(counts[r.status]!=null)counts[r.status]++});
  return (
    <PageTransition>
      <PageHeader title={`${greeting()}, welcome back`} description={new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(new Date())}/>
      <div className="section-grid">
        <div className="card time-card"><LiveClock/><div className={`time-ring ${!today?.time_out?'available':''}`}><Button loading={false} size="lg" onClick={()=>clock(today&&!today.time_in?'time-in':!today?.time_out?'time-out':'time-in')} disabled={Boolean(today?.time_in&&today?.time_out)}>{!today?.time_in?'Time In':!today?.time_out?'Time Out':'Done for today'}</Button></div>{today&&<div>{formatDate(today.attendance_date)} · <StatusBadge status={today.status}/>{today.time_in&&` · In ${today.time_in}`}{today.time_out&&` · Out ${today.time_out}`}</div>}</div>
        <div className="card"><div className="card-head"><h3>Quick actions</h3></div><div className="card-body grid"><Button icon={Plus} onClick={()=>navigate('/leaves')}>Request leave</Button><Button variant="secondary" icon={UserRound} onClick={()=>navigate('/profile')}>View profile</Button></div></div>
      </div>
      <div className="grid grid-3" style={{marginTop:16}}><StatCard label="Present" value={counts.Present} icon={UserCheck} tone="success"/><StatCard label="Late" value={counts.Late} icon={Clock3} tone="warning"/><StatCard label="Absent" value={counts.Absent} icon={CalendarDays} tone="primary"/></div>
      <div className="card" style={{marginTop:16}}><div className="card-head"><h3>Latest leave requests</h3></div><div className="card-body">{leaves.length?leaves.map(item=><div className="list-item" key={item.id}><div className="list-item-main" style={{flex:1}}><strong>{item.leave_type}</strong><span>{formatDate(item.start_date)} - {formatDate(item.end_date)} · {item.total_days} day(s)</span></div><StatusBadge status={item.status}/></div>):<EmptyState title="No leave requests yet"/>}</div></div>
    </PageTransition>
  );
}

function LiveClock(){
  const [now,setNow]=useState(new Date());
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(timer);},[]);
  return <><div className="live-time">{now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div><div className="live-date">{now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div></>;
}
