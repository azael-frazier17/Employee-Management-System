import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, KeyRound, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useDebounce from '../hooks/useDebounce';
import { getErrorMessage, formatDate } from '../utils/helpers';
import PageTransition from '../components/ui/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import SearchInput from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import EmployeeTable from '../components/EmployeeTable';
import EmployeeForm from '../components/EmployeeForm';
import Drawer from '../components/ui/Drawer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function Employees(){
  const [employees,setEmployees]=useState([]);const [pagination,setPagination]=useState(null);const [page,setPage]=useState(1);const [search,setSearch]=useState('');const debounced=useDebounce(search);const [department,setDepartment]=useState('');const [position,setPosition]=useState('');const [status,setStatus]=useState('');const [departments,setDepartments]=useState([]);const [positions,setPositions]=useState([]);const [sort,setSort]=useState('name');const [order,setOrder]=useState('asc');const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const [formOpen,setFormOpen]=useState(false);const [selected,setSelected]=useState(null);const [drawer,setDrawer]=useState(false);const [deleteTarget,setDeleteTarget]=useState(null);const [accountModal,setAccountModal]=useState(false);const [account,setAccount]=useState({username:'',password:''});
  const load=async()=>{
    setLoading(true);setError('');
    try{const r=await api.get('/employees',{params:{search:debounced,department_id:department||undefined,position_id:position||undefined,status:status||undefined,sort,order,page,limit:10}});setEmployees(r.data.data||[]);setPagination(r.data.pagination||null);}
    catch(err){setError(getErrorMessage(err));}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[debounced,department,position,status,sort,order,page]);
  useEffect(()=>{api.get('/departments',{params:{limit:100}}).then(r=>setDepartments(r.data.data||[])).catch(()=>{});},[]);
  useEffect(()=>{if(!department){setPositions([]);setPosition('');return;}api.get('/departments/positions',{params:{department_id:department}}).then(r=>setPositions(r.data.data||[])).catch(()=>setPositions([]));},[department]);
  const save=async(payload,id)=>{
    try{const r=id?await api.put(`/employees/${id}`,payload):await api.post('/employees',payload);toast.success(r.data.message);load();if(selected&&id)setSelected(r.data.data);}
    catch(err){toast.error(getErrorMessage(err));throw err;}
  };
  const remove=async()=>{try{const r=await api.delete(`/employees/${deleteTarget.id}`);toast.success(r.data.message);setDeleteTarget(null);setDrawer(false);load();}catch(err){toast.error(getErrorMessage(err));}};
  const createAccount=async(e)=>{
    e.preventDefault();
    try{
      const r=selected.user_id
        ? await api.patch(`/employees/${selected.id}/password`,{new_password:account.password})
        : await api.post(`/employees/${selected.id}/account`,account);
      toast.success(r.data.message);
      setAccountModal(false);
      setAccount({username:'',password:''});
      load();
    }catch(err){toast.error(getErrorMessage(err));}
  };
  const view=(employee)=>{setSelected(employee);setDrawer(true);};
  if(error)return <PageTransition><EmptyState title="Could not load employees" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;
  return (
    <PageTransition>
      <PageHeader title="Employees" description="Manage employee records and accounts." actions={<Button icon={Plus} onClick={()=>{setSelected(null);setFormOpen(true);}}>Add Employee</Button>}/>
      <div className="toolbar"><div className="toolbar-left"><SearchInput value={search} onChange={setSearch} placeholder="Search name, code or email"/><select className="search-input" aria-label="Department filter" value={department} onChange={e=>{setDepartment(e.target.value);setPage(1)}}><option value="">All departments</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><select className="search-input" aria-label="Position filter" value={position} onChange={e=>{setPosition(e.target.value);setPage(1)}}><option value="">All positions</option>{positions.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><select className="search-input" aria-label="Status filter" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option><option>Active</option><option>Inactive</option></select></div><div className="toolbar-right"><select className="search-input" aria-label="Sort" value={`${sort}:${order}`} onChange={e=>{const[v,o]=e.target.value.split(':');setSort(v);setOrder(o)}}><option value="name:asc">Name A-Z</option><option value="name:desc">Name Z-A</option><option value="code:asc">Code</option><option value="department:asc">Department</option><option value="position:asc">Position</option><option value="date_hired:desc">Newest hired</option><option value="status:asc">Status</option></select></div></div>
      {loading?<Skeleton rows={6} type="table"/>:employees.length?<><EmployeeTable employees={employees} onView={view} onEdit={e=>{setSelected(e);setFormOpen(true);}} onDelete={e=>setDeleteTarget(e)}/><Pagination pagination={pagination} page={page} onPageChange={setPage}/></>:<EmptyState title="No employees found" description="Try changing filters or add a new employee." actionLabel="Add employee" onAction={()=>setFormOpen(true)}/>}
      <EmployeeForm open={formOpen} employee={selected?.id&&formOpen?selected:null} onClose={()=>{setFormOpen(false);setSelected(null)}} onSaved={save}/>
      <Drawer open={drawer} onClose={()=>setDrawer(false)} title="Employee details">{selected&&<><div style={{textAlign:'center',marginBottom:20}}><Avatar name={selected.full_name} size={72}/><h3 style={{marginTop:10}}>{selected.full_name}</h3><p style={{color:'var(--muted)',fontSize:12,marginTop:4}}>{selected.position_title||'Unassigned'} · {selected.department_name||'No department'}</p><div style={{margin:'10px auto'}}><StatusBadge status={selected.status}/></div></div><div className="info-grid">{[['Employee code',selected.employee_code],['Email',selected.email],['Phone',selected.phone],['Address',selected.address],['Date hired',formatDate(selected.date_hired)],['Birth date',formatDate(selected.birth_date)],['Gender',selected.gender],['Username',selected.username],['Role',selected.role]].map(([k,v])=><div className="info-item" key={k}><span>{k}</span><strong>{v||'-'}</strong></div>)}</div><div className="modal-actions"><Button variant="secondary" icon={Pencil} onClick={()=>{setDrawer(false);setFormOpen(true);}}>Edit</Button>{!selected.user_id&&<Button icon={UserPlus} onClick={()=>setAccountModal(true)}>Create account</Button>}</div>{selected.user_id&&<Button variant="secondary" icon={KeyRound} onClick={()=>setAccountModal(true)} style={{width:'100%',marginTop:8}}>Reset password</Button>}</>}</Drawer>
      <ConfirmDialog open={Boolean(deleteTarget)} onClose={()=>setDeleteTarget(null)} onConfirm={remove} title="Delete employee" description="This will permanently delete the employee and their attendance and leave records." confirmText="Delete employee"/>
      <Modal open={accountModal} onClose={()=>setAccountModal(false)} title={selected?.user_id?'Reset password':'Create login account'} width={420}><form onSubmit={createAccount}>{!selected?.user_id&&<div className="field"><label>Username</label><input value={account.username} onChange={e=>setAccount(v=>({...v,username:e.target.value}))} required/></div>}<div className="field"><label>{selected?.user_id?'New password':'Password'}</label><input type="password" value={account.password} onChange={e=>setAccount(v=>({...v,password:e.target.value}))} required/></div><div className="modal-actions"><Button variant="secondary" type="button" onClick={()=>setAccountModal(false)}>Cancel</Button><Button type="submit">{selected?.user_id?'Reset':'Create account'}</Button></div></form></Modal>
    </PageTransition>
  );
}
