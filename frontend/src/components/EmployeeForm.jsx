import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import Modal from './ui/Modal';
import Button from './ui/Button';

const blank = {first_name:'',last_name:'',email:'',phone:'',address:'',birth_date:'',gender:'',department_id:'',position_id:'',date_hired:'',status:'Active',employee_code:''};

export default function EmployeeForm({ open, employee, onClose, onSaved }) {
  const [form,setForm]=useState(blank);const [departments,setDepartments]=useState([]);const [positions,setPositions]=useState([]);const [createAccount,setCreateAccount]=useState(false);const [username,setUsername]=useState('');const [password,setPassword]=useState('');const [show,setShow]=useState(false);const [errors,setErrors]=useState({});const [saving,setSaving]=useState(false);
  useEffect(()=>{
    if(!open)return;
    api.get('/departments',{params:{limit:100}}).then(r=>setDepartments(r.data.data||[])).catch(()=>setDepartments([]));
    if(employee)setForm({first_name:employee.first_name||'',last_name:employee.last_name||'',email:employee.email||'',phone:employee.phone||'',address:employee.address||'',birth_date:employee.birth_date?.slice(0,10)||'',gender:employee.gender||'',department_id:employee.department_id||'',position_id:employee.position_id||'',date_hired:employee.date_hired?.slice(0,10)||'',status:employee.status||'Active',employee_code:employee.employee_code||''});
    else setForm(blank);
  },[open,employee]);
  useEffect(()=>{
    if(!form.department_id){setPositions([]);return;}
    api.get('/departments/positions',{params:{department_id:form.department_id}}).then(r=>setPositions(r.data.data||[])).catch(()=>setPositions([]));
  },[form.department_id]);
  const change=(field,value)=>setForm(v=>({...v,[field]:value,...(field==='department_id'?{position_id:''}:{})}));
  const validate=()=>{
    const next={};
    if(!form.first_name.trim())next.first_name='First name is required.';
    if(!form.last_name.trim())next.last_name='Last name is required.';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))next.email='A valid email is required.';
    if(!form.date_hired)next.date_hired='Date hired is required.';
    if(form.first_name.length>60)next.first_name='Maximum 60 characters.';
    if(form.last_name.length>60)next.last_name='Maximum 60 characters.';
    if(form.phone.length>30)next.phone='Maximum 30 characters.';
    if(form.address.length>255)next.address='Maximum 255 characters.';
    setErrors(next);return Object.keys(next).length===0;
  };
  const submit=async(e)=>{
    e.preventDefault();if(!validate())return;
    setSaving(true);
    const payload={...form,department_id:form.department_id||null,position_id:form.position_id||null,birth_date:form.birth_date||null,gender:form.gender||null};
    if(!employee&&createAccount){payload.username=username;payload.password=password;}
    Object.keys(payload).forEach(k=>{if(payload[k]==='')delete payload[k];});
    try{await onSaved(payload,employee?.id);onClose();}
    catch(err){throw err;}finally{setSaving(false);}
  };
  const strength=password.length>=12?3:password.length>=8?2:password.length?1:0;
  return (
    <Modal open={open} onClose={onClose} title={employee?'Edit employee':'Add employee'} width={680}>
      <form onSubmit={submit}>
        <div className="form-grid">
          {[['first_name','First name','text'],['last_name','Last name','text'],['email','Email','email'],['phone','Phone','text'],['address','Address','text'],['date_hired','Date hired','date'],['birth_date','Birth date','date']].map(([field,label,type])=><div className={`field ${field==='address'?'span-2':''}`} key={field}><label htmlFor={field}>{label}{['first_name','last_name','email','date_hired'].includes(field)&&' *'}</label><input id={field} className={errors[field]?'field-error':''} type={type} value={form[field]} maxLength={field==='address'?255:undefined} onChange={e=>change(field,e.target.value)}/>{errors[field]&&<span className="error-text">{errors[field]}</span>}</div>)}
          <div className="field"><label htmlFor="gender">Gender</label><select id="gender" value={form.gender} onChange={e=>change('gender',e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
          <div className="field"><label htmlFor="department">Department</label><select id="department" value={form.department_id} onChange={e=>change('department_id',e.target.value)}><option value="">No department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="field"><label htmlFor="position">Position</label><select id="position" value={form.position_id} onChange={e=>change('position_id',e.target.value)}><option value="">No position</option>{positions.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
          <div className="field"><label htmlFor="status">Status</label><select id="status" value={form.status} onChange={e=>change('status',e.target.value)}><option>Active</option><option>Inactive</option></select></div>
          {!employee&&<div className="field span-2"><label><input type="checkbox" checked={createAccount} onChange={e=>setCreateAccount(e.target.checked)} style={{width:'auto',height:'auto',marginRight:8}}/>Create login account</label></div>}
          {!employee&&createAccount&&<>
            <div className="field"><label htmlFor="username">Username</label><input id="username" value={username} onChange={e=>setUsername(e.target.value)} required/></div>
            <div className="field"><label htmlFor="new-password">Password</label><div className="password-wrap"><input id="new-password" type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" onClick={()=>setShow(!show)} aria-label="Toggle password">{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div><div className="mini-bars" style={{height:5,padding:0}}>{[1,2,3].map(n=><span key={n} style={{height:5,background:n<=strength?'var(--primary)':'var(--border)',borderRadius:4,width:'100%'}}/>)}</div></div>
          </>}
        </div>
        <div className="modal-actions"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>{employee?'Save changes':'Create employee'}</Button></div>
      </form>
    </Modal>
  );
}
