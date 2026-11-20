import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { getErrorMessage } from '../utils/helpers';
import PageTransition from '../components/ui/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export default function Departments(){
  const [departments,setDepartments]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const [expanded,setExpanded]=useState(null);const [positions,setPositions]=useState({});
  const [deptModal,setDeptModal]=useState(false);const [deptForm,setDeptForm]=useState({name:'',description:''});const [editingDept,setEditingDept]=useState(null);
  const [positionModal,setPositionModal]=useState(false);const [positionForm,setPositionForm]=useState({department_id:'',title:'',description:''});const [editingPosition,setEditingPosition]=useState(null);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const load=async()=>{
    setLoading(true);setError('');
    try{const r=await api.get('/departments');setDepartments(r.data.data||[]);}catch(err){setError(getErrorMessage(err));}finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);
  const toggle=async(department)=>{
    if(expanded===department.id){setExpanded(null);return;}
    setExpanded(department.id);
    if(!positions[department.id]){
      try{const r=await api.get(`/departments/${department.id}`);setPositions(p=>({...p,[department.id]:r.data.data.positions||[]}));}catch(err){toast.error(getErrorMessage(err));}
    }
  };
  const saveDepartment=async(e)=>{
    e.preventEvent?.();
    e.preventDefault();
    try{const r=editingDept?await api.put(`/departments/${editingDept.id}`,deptForm):await api.post('/departments',deptForm);toast.success(r.data.message);setDeptModal(false);load();}
    catch(err){toast.error(getErrorMessage(err));}
  };
  const openDept=(department=null)=>{setEditingDept(department);setDeptForm(department?{name:department.name,description:department.description||''}:{name:'',description:''});setDeptModal(true);};
  const openPosition=(department,position=null)=>{setEditingPosition(position);setPositionForm(position?{department_id:department.id,title:position.title,description:position.description||''}:{department_id:department.id,title:'',description:''});setPositionModal(true);};
  const savePosition=async(e)=>{
    e.preventDefault();
    try{const r=editingPosition?await api.put(`/departments/positions/${editingPosition.id}`,positionForm):await api.post('/departments/positions',positionForm);toast.success(r.data.message);setPositionModal(false);setPositions(p=>({...p,[positionForm.department_id]:undefined}));const department=departments.find(d=>d.id===Number(positionForm.department_id));if(department){const rr=await api.get(`/departments/${department.id}`);setPositions(p=>({...p,[department.id]:rr.data.data.positions||[]}));}load();}
    catch(err){toast.error(getErrorMessage(err));}
  };
  const remove=async()=>{
    try{
      if(deleteTarget.type==='department'){const r=await api.delete(`/departments/${deleteTarget.id}`);toast.success(r.data.message);}
      else{const r=await api.delete(`/departments/positions/${deleteTarget.id}`);toast.success(r.data.message);}
      setDeleteTarget(null);setPositions({});load();if(expanded&&deleteTarget.type==='department')setExpanded(null);
    }catch(err){toast.error(getErrorMessage(err));}
  };
  if(error)return <PageTransition><EmptyState title="Could not load departments" description={error} actionLabel="Retry" onAction={load}/></PageTransition>;
  return (
    <PageTransition>
      <PageHeader title="Departments & Positions" description="Organize teams and roles across the company." actions={<Button icon={Plus} onClick={()=>openDept()}>Add Department</Button>}/>
      {loading?<Skeleton rows={6} type="card"/>:<div className="dept-grid">{departments.map(department=><div className="card department-card" key={department.id}>
        <div className="department-card-head" onClick={()=>toggle(department)}><div><h3>{department.name}</h3><p>{department.description||'No description'}</p></div><div style={{display:'flex',gap:5}}><button className="icon-button" aria-label="Edit department" onClick={e=>{e.stopPropagation();openDept(department)}}><Pencil size={15}/></button><button className="icon-button" aria-label="Delete department" onClick={e=>{e.stopPropagation();setDeleteTarget({type:'department',...department})}}><Trash2 size={15}/></button></div></div>
        <div className="dept-stats"><span><strong>{department.employee_count}</strong> employees</span><span><strong>{department.position_count}</strong> positions</span></div>
        {expanded===department.id&&<div className="positions"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0'}}><strong style={{fontSize:12}}>Positions</strong><Button size="sm" variant="secondary" icon={Plus} onClick={()=>openPosition(department)}>Add</Button></div>{(positions[department.id]||[]).map(position=><div className="position-row" key={position.id}><div><strong>{position.title}</strong>{position.description&&<span>{position.description}</span>}<span>{position.employee_count} employee(s)</span></div><div style={{display:'flex',gap:4}}><button className="icon-button" aria-label="Edit position" onClick={()=>openPosition(department,position)}><Pencil size={14}/></button><button className="icon-button" aria-label="Delete position" onClick={()=>setDeleteTarget({type:'position',...position})}><Trash2 size={14}/></button></div></div>)}{!(positions[department.id]||[]).length&&<EmptyState title="No positions yet"/>}</div>}
      </div>)}</div>}
      <Modal open={deptModal} onClose={()=>setDeptModal(false)} title={editingDept?'Edit department':'Add department'}><form onSubmit={saveDepartment}><div className="field"><label>Name</label><input value={deptForm.name} onChange={e=>setDeptForm(v=>({...v,name:e.target.value}))} required maxLength={100}/></div><div className="field"><label>Description</label><textarea value={deptForm.description} onChange={e=>setDeptForm(v=>({...v,description:e.target.value}))}/></div><div className="modal-actions"><Button variant="secondary" type="button" onClick={()=>setDeptModal(false)}>Cancel</Button><Button type="submit">{editingDept?'Save':'Create'}</Button></div></form></Modal>
      <Modal open={positionModal} onClose={()=>setPositionModal(false)} title={editingPosition?'Edit position':'Add position'}><form onSubmit={savePosition}><div className="field"><label>Department</label><select value={positionForm.department_id} onChange={e=>setPositionForm(v=>({...v,department_id:e.target.value}))}>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div><div className="field"><label>Title</label><input value={positionForm.title} onChange={e=>setPositionForm(v=>({...v,title:e.target.value}))} required/></div><div className="field"><label>Description</label><textarea value={positionForm.description} onChange={e=>setPositionForm(v=>({...v,description:e.target.value}))}/></div><div className="modal-actions"><Button variant="secondary" type="button" onClick={()=>setPositionModal(false)}>Cancel</Button><Button type="submit">{editingPosition?'Save':'Create'}</Button></div></form></Modal>
      <ConfirmDialog open={Boolean(deleteTarget)} onClose={()=>setDeleteTarget(null)} onConfirm={remove} title={`Delete ${deleteTarget?.type||'record'}`} description="This action cannot be undone. Records in use may be blocked by the server." confirmText="Delete"/>
    </PageTransition>
  );
}
