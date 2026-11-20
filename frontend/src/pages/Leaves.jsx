import { useEffect, useState } from 'react';
import { Plus, CalendarDays, BriefcaseBusiness } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import { LEAVE_TYPES } from '../utils/constants';
import { formatDate,getErrorMessage } from '../utils/helpers';
import PageTransition from '../components/ui/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export default function Leaves(){const {isAdmin}=useAuth();return isAdmin?<AdminLeaves/>:<EmployeeLeaves/>;}

function EmployeeLeaves(){
  const [rows,setRows]=useState([]);const [pagination,setPagination]=useState(null);const [page,setPage]=useState(1);const [tab,setTab]=useState('All');const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [open,setOpen]=useState(false);const [cancelTarget,setCancelTarget]=useState(null);const [form,setForm]=useState({leave_type:'Vacation',start_date:'',end_date:'',reason:''});
  const load=async()=>{setLoading(true);setError('');try{const r=await api.get('/leaves/my',{params:{status:tab==='All'?undefined:tab,page,limit:10}});setRows(r.data.data||[]);setPagination(r.data.pagination||null);}catch(err){setError(getErrorMessage(err));}finally{setLoading(false);}};
  useEffect(()=>{load();},[tab,page]);
  const submit=async(e)=>{
    e.preventDefault();
    try{const r=await api.post('/leaves',form);toast.success(r.data.message);setOpen(false);setForm({leave_type:'Vacation',start_date:'',end_date:'',reason:''});load();}catch(err){toast.error(getErrorMessage(err));}
  };
  const cancel=async()=>{try{const r=await api.delete(`/leaves/${cancelTarget.id}`);toast.success(r.data.message);setCancelTarget(null);load();}catch(err){toast.error(getErrorMessage(err));}};
  const days=form.start_date&&form.end_date&&form.end_date>=form.start_date?(Math.round((new Date(form.end_date)-new Date(form.start_date))/86400000)+1):0;
  if(error)return <PageTransition><EmptyState title="Could not load leave requests" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;
  return <PageTransition><PageHeader title="My Leaves" actions={<Button icon={Plus} onClick={()=>setOpen(true)}>Request leave</Button>}/>
    <div className="tabs">{['All','Pending','Approved','Rejected'].map(t=><button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>{setTab(t);setPage(1)}}>{t}</button>)}</div>
    {loading?<Skeleton rows={5} type="table"/>:rows.length?<>{rows.map(item=><div className="card" key={item.id} style={{marginBottom:12,padding:16}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><div style={{display:'flex',gap:12,alignItems:'flex-start'}}><span className="stat-icon tone-primary"><BriefcaseBusiness size={18}/></span><div><h3 style={{fontSize:14}}>{item.leave_type}</h3><p style={{color:'var(--muted)',fontSize:12,marginTop:5}}>{formatDate(item.start_date)} - {formatDate(item.end_date)} · {item.total_days} day(s)</p></div></div><StatusBadge status={item.status}/></div><p style={{fontSize:13,lineHeight:1.6,margin:'14px 0'}}>{item.reason}</p>{(item.admin_remarks||item.reviewed_by_username)&&<div className="info-item"><span>Admin review</span><strong>{item.admin_remarks||'Reviewed'} · {item.reviewed_by_username||''}</strong></div>}<div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>{item.status==='Pending'&&<Button size="sm" variant="danger" onClick={()=>setCancelTarget(item)}>Cancel</Button>}</div></div>)}<Pagination pagination={pagination} page={page} onPageChange={setPage}/></>:<EmptyState title="No leave requests" description="Submit a request when you need time away." actionLabel="Request leave" onAction={()=>setOpen(true)}/>}
    <Modal open={open} onClose={()=>setOpen(false)} title="Request leave"><form onSubmit={submit}><div className="form-grid"><div className="field span-2"><label>Leave type</label><select value={form.leave_type} onChange={e=>setForm(v=>({...v,leave_type:e.target.value}))}>{LEAVE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div className="field"><label>Start date</label><input type="date" value={form.start_date} onChange={e=>setForm(v=>({...v,start_date:e.target.value}))} required/></div><div className="field"><label>End date</label><input type="date" min={form.start_date} value={form.end_date} onChange={e=>setForm(v=>({...v,end_date:e.target.value}))} required/></div><div className="field span-2"><label>Reason · {days} day(s) · {form.reason.length}/500</label><textarea maxLength={500} value={form.reason} onChange={e=>setForm(v=>({...v,reason:e.target.value}))} required/></div></div><div className="modal-actions"><Button variant="secondary" type="button" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit">Submit request</Button></div></form></Modal>
    <ConfirmDialog open={Boolean(cancelTarget)} onClose={()=>setCancelTarget(null)} onConfirm={cancel} title="Cancel leave request" description="This pending leave request will be removed." confirmText="Cancel request"/>
  </PageTransition>;
}

function AdminLeaves(){
  const {user}=useAuth();
  const [rows,setRows]=useState([]);const [pagination,setPagination]=useState(null);const [page,setPage]=useState(1);const [tab,setTab]=useState('Pending');const [counts,setCounts]=useState({Pending:0,Approved:0,Rejected:0,All:0});const [search,setSearch]=useState('');const [department,setDepartment]=useState('');const [leaveType,setLeaveType]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('');const [departments,setDepartments]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [review,setReview]=useState(null);const [reviewStatus,setReviewStatus]=useState('Approved');const [remarks,setRemarks]=useState('');
  const load=async()=>{
    setLoading(true);setError('');
    try{const params={status:tab==='All'?undefined:tab,search:search||undefined,department_id:department||undefined,leave_type:leaveType||undefined,from:from||undefined,to:to||undefined,page,limit:10};const [r,...rest]=await Promise.all([api.get('/leaves',{params}),...['Pending','Approved','Rejected'].map(status=>api.get('/leaves',{params:{status,limit:1,page:1}})),api.get('/leaves',{params:{limit:1,page:1}})]);setRows(r.data.data||[]);setPagination(r.data.pagination||null);setCounts({Pending:rest[0].data.pagination?.total||0,Approved:rest[1].data.pagination?.total||0,Rejected:rest[2].data.pagination?.total||0,All:rest[3].data.pagination?.total||0});}catch(err){setError(getErrorMessage(err));}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[tab,page,search,department,leaveType,from,to]);
  useEffect(()=>{api.get('/departments').then(r=>setDepartments(r.data.data||[])).catch(()=>{});},[]);
  const submitReview=async(e)=>{e.preventDefault();try{const r=await api.patch(`/leaves/${review.id}/status`,{status:reviewStatus,admin_remarks:remarks});toast.success(r.data.message);setReview(null);setRemarks('');load();}catch(err){toast.error(getErrorMessage(err));}};
  if(error)return <PageTransition><EmptyState title="Could not load leave requests" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;
  return <PageTransition><PageHeader title="Leave Requests" description="Review and manage employee leave."/><div className="tabs">{['Pending','Approved','Rejected','All'].map(t=><button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>{setTab(t);setPage(1)}}>{t}<span className="tab-count">{t==='All'?counts.All:counts[t]}</span></button>)}</div>
    <div className="toolbar"><div className="toolbar-left"><input className="search-input" placeholder="Search employee" value={search} onChange={e=>setSearch(e.target.value)}/><select className="search-input" value={department} onChange={e=>setDepartment(e.target.value)}><option value="">All departments</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><select className="search-input" value={leaveType} onChange={e=>setLeaveType(e.target.value)}><option value="">All types</option>{LEAVE_TYPES.map(t=><option key={t}>{t}</option>)}</select><input className="search-input" type="date" value={from} onChange={e=>setFrom(e.target.value)} aria-label="From"/><input className="search-input" type="date" value={to} onChange={e=>setTo(e.target.value)} aria-label="To"/></div></div>
    {loading?<Skeleton rows={6} type="table"/>:rows.length?<>{rows.map(item=><div className="card" key={item.id} style={{marginBottom:12,padding:16}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><div><h3 style={{fontSize:14}}>{item.employee_name}</h3><p style={{color:'var(--muted)',fontSize:12,marginTop:4}}>{item.department_name||'No department'} · {item.leave_type}</p></div><StatusBadge status={item.status}/></div><p style={{fontSize:13,lineHeight:1.6,margin:'12px 0'}}>{item.reason}</p><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:12,color:'var(--muted)',fontVariantNumeric:'tabular-nums'}}>{formatDate(item.start_date)} - {formatDate(item.end_date)} · {item.total_days} day(s)</span>{item.status==='Pending'&&<div style={{display:'flex',gap:7}}><Button size="sm" variant="secondary" disabled={item.employee_id===user?.employeeId} title={item.employee_id===user?.employeeId?'You cannot review your own request':''} onClick={()=>{setReview(item);setReviewStatus('Rejected')}}>Reject</Button><Button size="sm" disabled={item.employee_id===user?.employeeId} title={item.employee_id===user?.employeeId?'You cannot review your own request':''} onClick={()=>{setReview(item);setReviewStatus('Approved')}}>Approve</Button></div>}</div></div>)}<Pagination pagination={pagination} page={page} onPageChange={setPage}/></>:<EmptyState title="No leave requests found"/>}
    <Modal open={Boolean(review)} onClose={()=>setReview(null)} title={`${reviewStatus} leave request`} width={420}><form onSubmit={submitReview}><div className="field"><label>Admin remarks · {remarks.length}/255</label><textarea maxLength={255} value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Optional"/></div><div className="modal-actions"><Button variant="secondary" type="button" onClick={()=>setReview(null)}>Cancel</Button><Button type="submit">{reviewStatus}</Button></div></form></Modal>
  </PageTransition>;
}
