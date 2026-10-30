import React,{useEffect,useState} from 'react';
import {Building2,Plus,Search,X} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const empty={nome:'',nif:'',morada:'',codigo_postal:'',localidade:'',concelho:'',distrito:'',email_geral:'',telefone_geral:'',website:'',natureza_juridica:'',cae:'',papel_cliente:true,papel_fornecedor:false};
const labels={morada:'Morada',codigo_postal:'Código postal',localidade:'Localidade',concelho:'Concelho',distrito:'Distrito',natureza_juridica:'Natureza jurídica',cae:'CAE',email_geral:'Email geral',telefone_geral:'Telefone geral',website:'Website'};

export default function CRMCompanies({spaceId}){
 const [rows,setRows]=useState([]),[roles,setRoles]=useState({}),[filter,setFilter]=useState('');
 const [open,setOpen]=useState(false),[form,setForm]=useState(empty),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=async()=>{
  const {data,error}=await supabase.from('crm_empresas').select('entidade_id,papel,estado,entidades(id,nome,nif,morada,codigo_postal,localidade,concelho,distrito,email_geral,telefone_geral,website,natureza_juridica,cae)').eq('crm_espaco_id',spaceId).eq('estado','ativo');
  if(error)throw error;
  const map={},unique={};(data||[]).forEach(x=>{(map[x.entidade_id] ||= []).push(x.papel);if(x.entidades)unique[x.entidade_id]=x.entidades;});
  setRows(Object.values(unique));setRoles(map);
 };
 useEffect(()=>{if(spaceId)load().catch(e=>setError(e.message));},[spaceId]);
 const save=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{
   const nif=form.nif.replace(/\s/g,'');
   if(!/^\d{9}$/.test(nif))throw new Error('O NIF deve ter 9 algarismos.');
   if(!form.papel_cliente&&!form.papel_fornecedor)throw new Error('Seleciona pelo menos um papel.');
   const payload={nome:form.nome.trim(),nif,morada:form.morada.trim()||null,codigo_postal:form.codigo_postal.trim()||null,localidade:form.localidade.trim()||null,concelho:form.concelho.trim()||null,distrito:form.distrito.trim()||null,email_geral:form.email_geral.trim()||null,telefone_geral:form.telefone_geral.trim()||null,website:form.website.trim()||null,natureza_juridica:form.natureza_juridica.trim()||null,cae:form.cae.trim()||null,origem_dados:'manual'};
   const {data:existing,error:lookup}=await supabase.from('entidades').select('id').eq('nif',nif).maybeSingle();
   if(lookup)throw lookup;let id;
   if(existing){id=existing.id;const {error}=await supabase.from('entidades').update(payload).eq('id',id);if(error)throw error;}
   else{const {data,error}=await supabase.from('entidades').insert(payload).select('id').single();if(error)throw error;id=data.id;}
   const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;
   const wanted=[...(form.papel_cliente?['cliente']:[]),...(form.papel_fornecedor?['fornecedor']:[])];
   for(const papel of wanted){
    const {error:linkError}=await supabase.from('crm_empresas').upsert({crm_espaco_id:spaceId,entidade_id:id,papel,estado:'ativo',criado_por:userData.user.id},{onConflict:'crm_espaco_id,entidade_id,papel'});
    if(linkError)throw linkError;
   }
   setForm(empty);setOpen(false);setMessage(existing?'Ficha existente atualizada; papéis associados.':'Empresa registada com sucesso.');await load();
  }catch(e){setError(e.message||'Erro ao guardar empresa.');}
  finally{setSaving(false);}
 };
 const filtered=rows.filter(x=>(x.nome+' '+(x.nif||'')+' '+(x.localidade||'')+' '+(roles[x.id]||[]).join(' ')).toLowerCase().includes(filter.toLowerCase()));
 return <div className="panel" style={{padding:18,marginTop:18}}>
  <div className="panelhead"><div><h3><Building2 size={18} style={{verticalAlign:'middle',marginRight:7}}/>Empresas e organizações</h3><span>Ficha empresarial única: cliente, fornecedor ou ambos.</span></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Nova empresa</button></div>
  {error&&<p role="alert" style={{color:'#a52828'}}>{error}</p>}{message&&<p role="status" style={{color:'#176344'}}>{message}</p>}
  <div className="search" style={{margin:'12px 0'}}><Search size={16}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Pesquisar por nome, NIF ou localidade…"/></div>
  {filtered.length?<div className="table"><div className="thead"><span>Empresa</span><span>NIF</span><span>Localidade</span><span>Papel</span></div>{filtered.map(x=><div className="trow" key={x.id}><div><strong>{x.nome}</strong><small>{x.email_geral||x.telefone_geral||'Sem contacto geral'}</small></div><span>{x.nif||'—'}</span><span>{x.localidade||x.concelho||'—'}</span><span>{(roles[x.id]||[]).map(p=><span className="pill" key={p} style={{marginRight:4}}>{p}</span>)}</span></div>)}</div>:<p className="empty">Ainda não existem empresas registadas neste CRM.</p>}
  {open&&<div role="presentation" onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:2200,background:'rgba(10,28,44,.58)',display:'grid',placeItems:'center',padding:16}}>
   <form onSubmit={save} onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:620,maxHeight:'92vh',overflowY:'auto',background:'#fff',borderRadius:16,padding:22,boxSizing:'border-box'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><span className="eyebrow">CRM · EMPRESAS</span><h2 style={{margin:'8px 0',color:'#173b59'}}>Nova ficha empresarial</h2></div><button type="button" className="secondary" onClick={()=>setOpen(false)}><X size={18}/></button></div>
    <p className="muted" style={{fontSize:13}}>Preenche os dados disponíveis. A consulta automática ao NIF será integrada depois de validarmos a fonte de dados.</p>
    <label style={{display:'block',marginTop:10,fontWeight:700}}>NIF (9 algarismos) *</label><input required maxLength={9} inputMode="numeric" value={form.nif} onChange={e=>setForm({...form,nif:e.target.value.replace(/\D/g,'')})} style={{width:'100%',boxSizing:'border-box',marginTop:5,padding:11,border:'1px solid #cad8e5',borderRadius:8}}/>
    <label style={{display:'block',marginTop:10,fontWeight:700}}>Denominação social *</label><input required value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={{width:'100%',boxSizing:'border-box',marginTop:5,padding:11,border:'1px solid #cad8e5',borderRadius:8}}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{Object.keys(labels).map(k=><label key={k} style={{display:'block',marginTop:10,fontWeight:700,fontSize:13}}>{labels[k]}<input type={k==='email_geral'?'email':'text'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:5,padding:10,border:'1px solid #cad8e5',borderRadius:8}}/></label>)}</div>
    <div style={{marginTop:16,fontWeight:700}}>Papel da empresa</div><div style={{display:'flex',gap:18,flexWrap:'wrap',marginTop:8}}><label><input type="checkbox" checked={form.papel_cliente} onChange={e=>setForm({...form,papel_cliente:e.target.checked})}/> Cliente</label><label><input type="checkbox" checked={form.papel_fornecedor} onChange={e=>setForm({...form,papel_fornecedor:e.target.checked})}/> Fornecedor</label></div>
    <p className="muted" style={{fontSize:12}}>Se o NIF já existir, reutilizamos a mesma ficha empresarial para evitar duplicações.</p>
    <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}><button type="button" className="secondary" onClick={()=>setOpen(false)}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?'A guardar…':'Guardar empresa'}</button></div>
   </form>
  </div>}
 </div>;
}
