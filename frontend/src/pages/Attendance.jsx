import { useEffect, useState } from 'react';
import { Plus, CalendarCheck, Pencil, Trash2, Clock3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import { formatDate,formatTime,getErrorMessage,toDateInput,monthRange } from '../utils/helpers';
import PageTransition from '../components/ui/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export default function Attendance(){
  const {isAdmin}=useAuth();
  return isAdmin?<AdminAttendance/>:<EmployeeAttendance/>;
}

function EmployeeAttendance(){
  const [today,setToday]=useState(null);const [rows,setRows]=useState([]);const [pagination,setPagination]=useState(null);const [page,setPage]=useState(1);const [status,setStatus]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [now,setNow]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);
  const load=async()=>{
    setLoading(true);setError('');
    try{const [t,h]=await Promise.all([api.get('/attendance/today'),api.get('/attendance/my',{params:{status:status||undefined,from:from||undefined,to:to||undefined,page,limit:20}})]);setToday(t.data.data?.record||null);setRows(h.data.data||[]);setPagination(h.data.pagination||null);}catch(err){setError(getErrorMessage(err));}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[status,from,to,page]);
  const clock=async(action)=>{
    try{const r=await api.post(`/attendance/${action}`);toast.success(r.data.message);load();}catch(err){toast.error(getErrorMessage(err));}
  };
  const range=monthRange();const monthRows=rows.filter(r=>r.attendance_date>=range.from&&r.attendance_date<=range.to);const counts={Present:0,Late:0,Absent:0};monthRows.forEach(r=>counts[r.status]=(counts[r.status]||0)+1);
  if(error)return <PageTransition><EmptyState title="Could not load attendance" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;
  return <PageTransition>
    <PageHeader title="My Attendance"/>
    <div className="card time-card"><div className="live-time">{now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div><div className="live-date">{now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div><div className={`time-ring ${today&&!today.time_out?'available':''}`}><Button size="lg" onClick={()=>clock(!today?.time_in?'time-in':'time-out')} disabled={Boolean(today?.time_in&&today?.time_out)}>{!today?.time_in?'Time In':!today?.time_out?'Time Out':'Done for today'}</Button></div>{today&&<div>{today.time_in&&`Time in ${formatTime(today.time_in)} · `}{today.time_out&&`Time out ${formatTime(today.time_out)} · `}<StatusBadge status={today.status}/>{today.status==='Late'&&<span style={{display:'block',fontSize:11,color:'var(--warning)',marginTop:7}}>You were marked Late.</span>}</div>}</div>
    <div className="summary-strip" style={{marginTop:16}}><div className="summary-chip"><span>Present this month</span><strong>{counts.Present}</strong></div><div className="summary-chip"><span>Late this month</span><strong>{counts.Late}</strong></div><div className="summary-chip"><span>Absent this month</span><strong>{counts.Absent}</strong></div></div>
    <div className="toolbar"><div className="toolbar-left"><select className="search-input" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option>Present</option><option>Late</option><option>Absent</option></select><input className="search-input" type="date" aria-label="From date" value={from} onChange={e=>setFrom(e.target.value)}/><input className="search-input" type="date" aria-label="To date" value={to} onChange={e=>setTo(e.target.value)}/></div></div>
    {loading?<Skeleton rows={5} type="table"/>:rows.length?<><div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Time in</th><th>Time out</th><th>Hours</th><th>Status</th><th>Remarks</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{formatDate(r.attendance_date)}</td><td>{formatTime(r.time_in)}</td><td>{formatTime(r.time_out)}</td><td>{r.hours_worked||'-'}</td><td><StatusBadge status={r.status}/></td><td>{r.remarks||'-'}</td></tr>)}</tbody></table></div><Pagination pagination={pagination} page={page} onPageChange={setPage}/></>:<EmptyState title="No attendance records"/>}
  </PageTransition>;
}

function AdminAttendance(){
  const [rows,setRows]=useState([]);const [pagination,setPagination]=useState(null);const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [department,setDepartment]=useState('');const [status,setStatus]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('');const [departments,setDepartments]=useState([]);const [employees,setEmployees]=useState([]);const [summary,setSummary]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const [modal,setModal]=useState(false);const [editing,setEditing]=useState(null);const [form,setForm]=useState({employee_id:'',attendance_date:toDateInput(),time_in:'',time_out:'',status:'Present',remarks:''});const [deleteTarget,setDeleteTarget]=useState(null);const [markOpen,setMarkOpen]=useState(false);const [markDate,setMarkDate]=useState(toDateInput());
  const load=async()=>{
    setLoading(true);setError('');
    try{const [r,s]=await Promise.all([api.get('/attendance',{params:{search:search||undefined,department_id:department||undefined,status:status||undefined,from:from||undefined,to:to||undefined,page,limit:20}}),api.get('/attendance/reports/summary',{params:{from:from||undefined,to:to||undefined,department_id:department||undefined}})]);setRows(r.data.data||[]);setPagination(r.data.pagination||null);setSummary(s.data.data);}
    catch(err){setError(getErrorMessage(err));}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[search,department,status,from,to,page]);
  useEffect(()=>{Promise.all([api.get('/departments'),api.get('/employees',{params:{limit:100}})]).then(([d,e])=>{setDepartments(d.data.data||[]);setEmployees(e.data.data||[]);}).catch(()=>{});},[]);
  const preset=(kind)=>{
    const now=new Date();const end=toDateInput(now);
    if(kind==='today')setFrom(end),setTo(end);
    if(kind==='week'){const start=new Date(now);start.setDate(now.getDate()-now.getDay());setFrom(toDateInput(start));setTo(end);}
    if(kind==='month'){const start=new Date(now.getFullYear(),now.getMonth(),1);setFrom(toDateInput(start));setTo(end);}
  };
  const openAdd=()=>{setEditing(null);setForm({employee_id:'',attendance_date:toDateInput(),time_in:'',time_out:'',status:'Present',remarks:''});setModal(true);}
  const openEdit=row=>{setEditing(row);setForm({employee_id:row.employee_id,attendance_date:row.attendance_date?.slice(0,10),time_in:row.time_in||'',time_out:row.time_out||'',status:row.status,remarks:row.remarks||''});setModal(true);}
  const save=async(e)=>{
    e.preventDefault();
    try{const payload={...form,employee_id:Number(form.employee_id)};const r=editing?await api.put(`/attendance/${editing.id}`,payload):await api.post('/attendance',payload);toast.success(r.data.message);setModal(false);load();}catch(err){toast.error(getErrorMessage(err));}
  };
  const remove=async()=>{try{const r=await api.delete(`/attendance/${deleteTarget.id}`);toast.success(r.data.message);setDeleteTarget(null);load();}catch(err){toast.error(getErrorMessage(err));}};
  const mark=async()=>{try{const r=await api.post('/attendance/mark-absent',{date:markDate,department_id:department||undefined});toast.success(r.data.message);setMarkOpen(false);load();}catch(err){toast.error(getErrorMessage(err));}};
  if(error)return <PageTransition><EmptyState title="Could not load attendance" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;
  const totals=summary?.totals||{};
  return <PageTransition>
    <PageHeader title="Attendance" description="Monitor employee attendance and manual records." actions={<><Button variant="secondary" icon={CalendarCheck} onClick={()=>setMarkOpen(true)}>Mark absentees</Button><Button icon={Plus} onClick={openAdd}>Add record</Button></>}/>
    <div className="summary-strip"><div className="summary-chip"><span>Present</span><strong>{totals.present_days||0}</strong></div><div className="summary-chip"><span>Late</span><strong>{totals.late_days||0}</strong></div><div className="summary-chip"><span>Absent</span><strong>{totals.absent_days||0}</strong></div></div>
    <div className="toolbar"><div className="toolbar-left"><input className="search-input" placeholder="Search employee" value={search} onChange={e=>setSearch(e.target.value)}/><select className="search-input" value={department} onChange={e=>setDepartment(e.target.value)}><option value="">All departments</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><select className="search-input" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option>Present</option><option>Late</option><option>Absent</option></select><input className="search-input" type="date" value={from} onChange={e=>setFrom(e.target.value)} aria-label="From"/><input className="search-input" type="date" value={to} onChange={e=>setTo(e.target.value)} aria-label="To"/></div><div className="toolbar-right"><Button size="sm" variant="secondary" onClick={()=>preset('today')}>Today</Button><Button size="sm" variant="secondary" onClick={()=>preset('week')}>This week</Button><Button size="sm" variant="secondary" onClick={()=>preset('month')}>This month</Button></div></div>
    {loading?<Skeleton rows={6} type="table"/>:rows.length?<><div className="table-wrap"><table className="table"><thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Time in</th><th>Time out</th><th>Hours</th><th>Status</th><th>Remarks</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.employee_name}</td><td>{r.department_name||'-'}</td><td>{formatDate(r.attendance_date)}</td><td>{formatTime(r.time_in)}</td><td>{formatTime(r.time_out)}</td><td>{r.hours_worked||'-'}</td><td><StatusBadge status={r.status}/></td><td>{r.remarks||'-'}</td><td><div className="row-actions touch"><button className="icon-button" aria-label="Edit" onClick={()=>openEdit(r)}><Pencil size={15}/></button><button className="icon-button" aria-label="Delete" onClick={()=>setDeleteTarget(r)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div><Pagination pagination={pagination} page={page} onPageChange={setPage}/></>:<EmptyState title="No attendance records"/>}
    <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit attendance':'Add attendance'}><form onSubmit={save}><div className="form-grid"><div className="field span-2"><label>Employee</label><select value={form.employee_id} onChange={e=>setForm(v=>({...v,employee_id:e.target.value}))} required disabled={Boolean(editing)}><option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.full_name}</option>)}</select></div><div className="field"><label>Date</label><input type="date" value={form.attendance_date} onChange={e=>setForm(v=>({...v,attendance_date:e.target.value}))} disabled={Boolean(editing)} required/></div><div className="field"><label>Status</label><select value={form.status} onChange={e=>setForm(v=>({...v,status:e.target.value}))}><option>Present</option><option>Late</option><option>Absent</option></select></div><div className="field"><label>Time in</label><input type="time" value={form.time_in} onChange={e=>setForm(v=>({...v,time_in:e.target.value}))}/></div><div className="field"><label>Time out</label><input type="time" value={form.time_out} onChange={e=>setForm(v=>({...v,time_out:e.target.value}))}/></div><div className="field span-2"><label>Remarks</label><textarea value={form.remarks} onChange={e=>setForm(v=>({...v,remarks:e.target.value}))}/></div></div><div className="modal-actions"><Button variant="secondary" type="button" onClick={()=>setModal(false)}>Cancel</Button><Button type="submit">{editing?'Save':'Create'}</Button></div></form></Modal>
    <ConfirmDialog open={Boolean(deleteTarget)} onClose={()=>setDeleteTarget(null)} onConfirm={remove} title="Delete attendance" description="This attendance record will be permanently deleted." confirmText="Delete"/>
    <Modal open={markOpen} onClose={()=>setMarkOpen(false)} title="Mark absentees" width={420}>
      <div className="field"><label htmlFor="mark-date">Date</label><input id="mark-date" type="date" max={toDateInput()} value={markDate} onChange={e=>setMarkDate(e.target.value)}/></div>
      <p className="confirm-copy">Employees without a record for this date will be marked absent.</p>
      <div className="modal-actions"><Button variant="secondary" onClick={()=>setMarkOpen(false)}>Cancel</Button><Button onClick={mark}>Mark absent</Button></div>
    </Modal>
  </PageTransition>;
}
