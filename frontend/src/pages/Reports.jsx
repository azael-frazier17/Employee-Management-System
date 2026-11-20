import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { ResponsiveContainer,BarChart,Bar,XAxis,Tooltip,PieChart,Pie,Cell } from 'recharts';
import api from '../api/axios';
import { COMPANY_NAME } from '../utils/constants';
import { monthRange,formatDate,getErrorMessage } from '../utils/helpers';
import PageTransition from '../components/ui/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export default function Reports(){
  const range=monthRange();
  const [tab,setTab]=useState('Headcount');
  const [from,setFrom]=useState(range.from);const [to,setTo]=useState(range.to);const [department,setDepartment]=useState('');
  const [departments,setDepartments]=useState([]);const [headcount,setHeadcount]=useState(null);const [attendance,setAttendance]=useState(null);const [leave,setLeave]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const load=async()=>{
    setLoading(true);setError('');
    try{
      const [h,d,a,l]=await Promise.all([
        api.get('/employees/reports/summary'),api.get('/departments'),
        api.get('/attendance/reports/summary',{params:{from,to,department_id:department||undefined}}),
        api.get('/leaves/reports/summary',{params:{from,to,department_id:department||undefined}})
      ]);
      setHeadcount(h.data.data);setDepartments(d.data.data||[]);setAttendance(a.data.data);setLeave(l.data.data);
    }catch(err){setError(getErrorMessage(err));}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[from,to,department]);
  if(error)return <PageTransition><EmptyState title="Could not load reports" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;
  return <PageTransition>
    <div className="print-header"><h1>{COMPANY_NAME} | Employee Management System</h1><p>{tab} report · {formatDate(from)} - {formatDate(to)} · Generated {formatDate(toDateOnly())}</p></div>
    <PageHeader title="Reports" description="View and print operational reports." actions={<Button icon={Printer} onClick={()=>window.print()}>Print report</Button>}/>
    <div className="tabs">{['Headcount','Attendance','Leaves'].map(t=><button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</button>)}</div>
    {tab!== 'Headcount'&&<div className="report-filter card" style={{padding:12,marginBottom:16}}><div className="field"><label>From</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div><div className="field"><label>To</label><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></div><div className="field"><label>Department</label><select value={department} onChange={e=>setDepartment(e.target.value)}><option value="">All departments</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div></div>}
    {loading?<Skeleton rows={5} type="table"/>:tab==='Headcount'?<HeadcountReport data={headcount}/>:tab==='Attendance'?<AttendanceReport data={attendance}/>:<LeaveReport data={leave}/>}
  </PageTransition>;
}

function toDateOnly(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

function HeadcountReport({data}){
  const totals=data?.totals||{};
  const dept=(data?.by_department||[]).map(d=>({name:d.department_name,total:d.total_employees}));
  return <>
    <div className="grid grid-3"><StatCard label="Total employees" value={totals.total_employees} tone="primary"/><StatCard label="Active" value={totals.active_employees} tone="success"/><StatCard label="Inactive" value={totals.inactive_employees} tone="primary"/></div>
    <div className="grid grid-2" style={{marginTop:16}}>
      <div className="card"><div className="card-head"><h3>By department</h3></div><div className="card-body chart-card"><ResponsiveContainer width="100%" height="100%"><BarChart data={dept}><XAxis dataKey="name" tick={{fontSize:10}}/><Tooltip/><Bar dataKey="total" fill="#6366F1" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></div>
      <div className="card"><div className="card-head"><h3>By position</h3></div><div className="card-body"><div className="table-wrap"><table className="table"><thead><tr><th>Position</th><th>Department</th><th>Employees</th></tr></thead><tbody>{(data?.by_position||[]).map((p,i)=><tr key={i}><td>{p.position_title}</td><td>{p.department_name||'-'}</td><td>{p.total_employees}</td></tr>)}</tbody></table></div></div></div>
    </div>
    <div className="card" style={{marginTop:16}}><div className="card-head"><h3>Recent hires</h3></div><div className="table-wrap"><table className="table"><thead><tr><th>Employee</th><th>Code</th><th>Department</th><th>Position</th><th>Date hired</th></tr></thead><tbody>{(data?.recent_hires||[]).map(r=><tr key={r.id}><td>{r.full_name}</td><td>{r.employee_code}</td><td>{r.department_name||'-'}</td><td>{r.position_title||'-'}</td><td>{formatDate(r.date_hired)}</td></tr>)}</tbody></table></div></div>
  </>;
}

function AttendanceReport({data}){
  const totals=data?.totals||{};
  const chart=[{name:'Present',value:totals.present_days||0,color:'#10B981'},{name:'Late',value:totals.late_days||0,color:'#F59E0B'},{name:'Absent',value:totals.absent_days||0,color:'#F43F5E'}];
  return <>
    <div className="grid grid-3"><StatCard label="Present days" value={totals.present_days} tone="success"/><StatCard label="Late days" value={totals.late_days} tone="warning"/><StatCard label="Absent days" value={totals.absent_days} tone="primary"/></div>
    <div className="grid grid-2" style={{marginTop:16}}><div className="card"><div className="card-head"><h3>Attendance totals</h3></div><div className="card-body chart-card"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chart} dataKey="value" innerRadius={55} outerRadius={85}>{chart.map(c=><Cell key={c.name} fill={c.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></div><div className="card"><div className="card-head"><h3>Per employee</h3></div><div className="table-wrap"><table className="table"><thead><tr><th>Employee</th><th>Present</th><th>Late</th><th>Absent</th><th>Avg hours</th></tr></thead><tbody>{(data?.per_employee||[]).map(r=><tr key={r.employee_id}><td>{r.employee_name}</td><td>{r.present_days}</td><td>{r.late_days}</td><td>{r.absent_days}</td><td>{r.avg_hours_per_day||'-'}</td></tr>)}</tbody></table></div></div></div>
  </>;
}

function LeaveReport({data}){
  const byStatus=data?.by_status||{};
  return <>
    <div className="grid grid-3"><StatCard label="Pending" value={byStatus.Pending} tone="warning"/><StatCard label="Approved" value={byStatus.Approved} tone="success"/><StatCard label="Rejected" value={byStatus.Rejected} tone="primary"/></div>
    <div className="grid grid-2" style={{marginTop:16}}>
      <div className="card"><div className="card-head"><h3>By leave type</h3></div><div className="card-body"><div className="table-wrap"><table className="table"><thead><tr><th>Type</th><th>Requests</th></tr></thead><tbody>{(data?.by_type||[]).map(r=><tr key={r.leave_type}><td>{r.leave_type}</td><td>{r.requests}</td></tr>)}</tbody></table></div></div></div>
      <div className="card"><div className="card-head"><h3>On leave today</h3></div><div className="card-body">{(data?.on_leave_today||[]).map((r,i)=><div className="list-item" key={i}><div className="list-item-main" style={{flex:1}}><strong>{r.employee_name}</strong><span>{r.department_name||'-'} · {r.leave_type}</span></div></div>)}</div></div>
    </div>
    <div className="card" style={{marginTop:16}}><div className="card-head"><h3>Per employee</h3></div><div className="table-wrap"><table className="table"><thead><tr><th>Employee</th><th>Department</th><th>Requests</th><th>Pending</th><th>Approved</th><th>Rejected</th><th>Approved days</th></tr></thead><tbody>{(data?.per_employee||[]).map(r=><tr key={r.employee_id}><td>{r.employee_name}</td><td>{r.department_name||'-'}</td><td>{r.requests}</td><td>{r.pending}</td><td>{r.approved}</td><td>{r.rejected}</td><td>{r.approved_days}</td></tr>)}</tbody></table></div></div>
  </>;
}
