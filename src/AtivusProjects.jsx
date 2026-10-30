import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {Building2,Plus,RefreshCw,ChevronRight,ArrowLeft,AlertTriangle} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const TYPES=['Edifício multifamiliar','Edifício unifamiliar','Edifício de serviços / escritórios','Edifício comercial','Instalação industrial','Infraestrutura rodoviária','Ponte / viaduto','Infraestrutura ferroviária','Infraestrutura hidráulica','Equipamento público','Outro'];
const typeToDb=v=>v==='Edifício multifamiliar'||v==='Edifício unifamiliar'?'edificio':v==='Ponte / viaduto'?'ponte':v==='Infraestrutura rodoviária'?'infraestrutura_rodoviaria':v==='Infraestrutura ferroviária'?'infraestrutura_ferroviaria':v==='Instalação industrial'?'instalacao_industrial':v==='Equipamento público'?'equipamento_publico':v==='Outro'?'outro':v.toLowerCase().replaceAll(' ','_').replaceAll('/','_');
const typeFromDb=v=>({edificio:'Edifício',ponte:'Ponte / viaduto',infraestrutura_rodoviaria:'Infraestrutura rodoviária',infraestrutura_ferroviaria:'Infraestrutura ferroviária',instalacao_industrial:'Instalação industrial',equipamento_publico:'Equipamento público'}[v]||String(v||'—').replaceAll('_',' '));
export default function AtivusProjects(){
 const [rows,setRows]=useState([]),[entities,setEntities]=useState([]),[assets,setAssets]=useState([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [formOpen,setFormOpen]=useState(false),[selected,setSelected]=useState(null);
 const [form,setForm]=useState({nome:'',morada:'',tipo:'Edifício multifamiliar',descricao:'',entidade_id:''});
 const load=useCallback(async()=>{
  if(!supabase){setError('A ligação ao Supabase não está configurada.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();
   if(userError)throw userError;
   if(!userData?.user)throw new Error('Inicia sessão para gerir empreendimentos.');
   const [entityResult,projectResult]=await Promise.all([
    supabase.from('entidades').select('id,nome,ativa').eq('ativa',true).order('nome'),
    supabase.from('empreendimentos').select('id,entidade_id,codigo,codigo_interno,nome,tipo,morada,descricao,ativo,estado_manutencao,classe_estado_conservacao,criado_em').eq('ativo',true).order('nome')
   ]);
   if(entityResult.error)throw entityResult.error;
   if(projectResult.error)throw projectResult.error;
   setEntities(entityResult.data||[]);setRows(projectResult.data||[]);
  }catch(e){setError(e?.message||'Não foi possível carregar os empreendimentos.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{load();},[load]);
 const openProject=async p=>{
  setSelected(p);setAssets([]);
  const {data,error:e}=await supabase.from('ativos').select('id,codigo,nome,tipo,localizacao,estado,classe_estado_conservacao').eq('empreendimento_id',p.id).order('nome');
  if(e){setError(e.message);return;}
  setAssets(data||[]);
 };
 const submit=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{
   if(!form.entidade_id)throw new Error('Seleciona a entidade responsável pelo empreendimento.');
   const {data:userData,error:userError}=await supabase.auth.getUser();
   if(userError)throw userError;
   if(!userData?.user)throw new Error('A sessão expirou. Inicia sessão novamente.');
   const codigo='EMP-'+Date.now().toString().slice(-8);
   const payload={entidade_id:form.entidade_id,codigo,nome:form.nome.trim(),tipo:typeToDb(form.tipo),morada:form.morada.trim()||null,descricao:form.descricao.trim()||null};
   const {data,error:insertError}=await supabase.from('empreendimentos').insert(payload).select('id,entidade_id,codigo,nome,tipo,morada,descricao,ativo,estado_manutencao,classe_estado_conservacao,criado_em').single();
   if(insertError)throw insertError;
   setRows(v=>[data,...v]);setForm({nome:'',morada:'',tipo:'Edifício multifamiliar',descricao:'',entidade_id:''});setFormOpen(false);setMessage('Empreendimento guardado no Supabase.');
  }catch(e){setError(e?.message||'Não foi possível guardar o empreendimento.');}
  finally{setSaving(false);}
 };
 const entityName=id=>entities.find(x=>x.id===id)?.nome||'Entidade sem nome ou sem acesso';
 const selectedAssets=useMemo(()=>assets,[assets]);
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar empreendimentos do Supabase…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">{selected?'Ficha do empreendimento':'Empreendimentos'}</h2><p className="muted">Registos partilhados na base de dados Seven M Ativus.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{selected?<button className="secondary" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> Voltar</button>:<><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button><button className="primary" onClick={()=>{setForm({nome:'',morada:'',tipo:'Edifício multifamiliar',descricao:'',entidade_id:entities.length===1?entities[0].id:''});setFormOpen(true);}} disabled={!entities.length}><Plus size={17}/> Novo empreendimento</button></>}</div></div>
  {error&&<div className="panel" role="alert" style={{padding:14,marginBottom:14,borderLeft:'4px solid #b42318',color:'#8f1d1d'}}><AlertTriangle size={17}/> {error}</div>}
  {message&&<div className="panel" role="status" style={{padding:14,marginBottom:14,color:'#176344'}}>{message}</div>}
  {!entities.length&&!selected&&<div className="panel" style={{padding:18,marginBottom:14}}><strong>Não foi possível identificar entidades disponíveis.</strong><p className="muted">A conta autenticada precisa de permissões para consultar as entidades. Não vamos criar uma entidade automaticamente nem associar empreendimentos à empresa errada.</p></div>}
  {selected?<><div className="panel" style={{padding:20,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}><div><small className="muted">Código</small><p><strong>{selected.codigo_interno||selected.codigo}</strong></p></div><div><small className="muted">Entidade responsável</small><p><strong>{entityName(selected.entidade_id)}</strong></p></div><div><small className="muted">Localização</small><p><strong>{selected.morada||'Não indicada'}</strong></p></div><div><small className="muted">Tipo</small><p><strong>{typeFromDb(selected.tipo)}</strong></p></div><div><small className="muted">Estado de manutenção</small><p><strong>{selected.estado_manutencao||'Por avaliar'}</strong></p></div><div><small className="muted">Estado de conservação</small><p><strong>{selected.classe_estado_conservacao??'Por avaliar'}</strong></p></div><div style={{gridColumn:'1/-1'}}><small className="muted">Descrição</small><p>{selected.descricao||'Sem descrição registada.'}</p></div></div><div className="panel" style={{padding:20,marginTop:16}}><h3>Ativos associados</h3>{selectedAssets.length?selectedAssets.map(a=><div className="trow" key={a.id}><div><strong>{a.nome}</strong><small>{a.codigo}</small></div><span>{a.tipo}</span><span>{a.localizacao||'—'}</span><span>{a.classe_estado_conservacao??'—'}</span></div>):<p className="empty">Ainda não existem ativos associados a este empreendimento.</p>}</div></>:<div className="panel table"><div className="thead"><span>Código / Empreendimento</span><span>Entidade</span><span>Localização</span><span>Tipo</span><span></span></div>{rows.length?rows.map(p=><div className="trow" key={p.id} role="button" tabIndex={0} onClick={()=>openProject(p)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProject(p)}}} style={{cursor:'pointer'}}><div><strong>{p.nome}</strong><small>{p.codigo_interno||p.codigo}</small></div><span>{entityName(p.entidade_id)}</span><span>{p.morada||'—'}</span><span>{typeFromDb(p.tipo)}</span><span><button type="button" className="secondary" onClick={e=>{e.stopPropagation();openProject(p);}}>Ver ficha <ChevronRight size={16}/></button></span></div>):<p className="empty">Ainda não existem empreendimentos na base de dados para esta conta.</p>}</div>}
  {formOpen&&<div role="presentation" onClick={()=>setFormOpen(false)} style={{position:'fixed',inset:0,zIndex:2200,background:'rgba(10,28,44,.58)',display:'grid',placeItems:'center',padding:18}}><form onSubmit={submit} onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:18,padding:22,boxSizing:'border-box'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><span className="eyebrow">SEVEN M ATIVUS</span><h2 style={{margin:'8px 0',color:'#173b59'}}>Novo empreendimento</h2><p className="muted">O registo será guardado na base de dados partilhada.</p></div><button type="button" className="secondary" onClick={()=>setFormOpen(false)}>Fechar</button></div><label style={{display:'block',marginTop:14,fontWeight:700}}>Entidade responsável *</label><select required value={form.entidade_id} onChange={e=>setForm(v=>({...v,entidade_id:e.target.value}))} style={{width:'100%',padding:12,marginTop:6,border:'1px solid #cad8e5',borderRadius:9,background:'#fff'}}><option value="">Selecionar empresa / cliente</option>{entities.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select><label style={{display:'block',marginTop:14,fontWeight:700}}>Nome do empreendimento *</label><input required maxLength={180} value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Edifício Rua Central" style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9}}/><label style={{display:'block',marginTop:14,fontWeight:700}}>Morada / Localização</label><input value={form.morada} onChange={e=>setForm(v=>({...v,morada:e.target.value}))} placeholder="Morada, localidade ou coordenadas" style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9}}/><label style={{display:'block',marginTop:14,fontWeight:700}}>Tipo de empreendimento *</label><select required value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))} style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9,background:'#fff'}}>{TYPES.map(x=><option key={x}>{x}</option>)}</select><label style={{display:'block',marginTop:14,fontWeight:700}}>Descrição</label><textarea rows={3} value={form.descricao} onChange={e=>setForm(v=>({...v,descricao:e.target.value}))} style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9}}/><div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}><button type="button" className="secondary" onClick={()=>setFormOpen(false)}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?'A guardar…':'Guardar no Supabase'}</button></div></form></div>}
 </section>;
}
