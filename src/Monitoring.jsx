import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './lib/supabase.js';
import {Activity,Plus,RefreshCw,AlertTriangle} from 'lucide-react';
const blank={empreendimento_id:'',ativo_id:'',componente_id:'',codigo:'',nome:'',tipo_sensor:'temperatura',unidade:'°C',limite_inferior:'',limite_superior:'',intervalo_leitura_min:'',observacoes:''};
const types=[['temperatura','Temperatura'],['humidade','Humidade'],['deslocamento','Deslocamento'],['vibracao','Vibração'],['corrosao','Corrosão'],['pressao','Pressão'],['caudal','Caudal'],['outro','Outro']];
export default function Monitoring(){
 const [projects,setProjects]=useState([]),[devices,setDevices]=useState([]),[assets,setAssets]=useState([]),[components,setComponents]=useState([]),[readings,setReadings]=useState([]);
 const [form,setForm]=useState(blank),[reading,setReading]=useState({dispositivo_id:'',valor:'',observacoes:''}),[open,setOpen]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setError('Supabase não configurado.');setLoading(false);return}
  setLoading(true);setError('');
  try{
   const {data:u,error:ue}=await supabase.auth.getUser();if(ue)throw ue;if(!u?.user)throw new Error('Inicia sessão para aceder à monitorização.');
   const {data:m,error:me}=await supabase.from('membros_entidade').select('entidade_id').eq('utilizador_id',u.user.id).eq('ativo',true);if(me)throw me;
   const ids=[...new Set((m||[]).map(x=>x.entidade_id))];if(!ids.length)throw new Error('Não existem entidades associadas.');
   const {data:p,error:pe}=await supabase.from('empreendimentos').select('id,nome,entidade_id').in('entidade_id',ids).eq('ativo',true).order('nome');if(pe)throw pe;setProjects(p||[]);
   const {data:d,error:de}=await supabase.from('dispositivos_monitorizacao').select('*').order('nome');if(de)throw de;setDevices(d||[]);
   const did=(d||[]).map(x=>x.id);
   if(did.length){const {data:l,error:le}=await supabase.from('leituras_monitorizacao').select('*').in('dispositivo_id',did).order('data_leitura',{ascending:false}).limit(500);if(le)throw le;setReadings(l||[])}else setReadings([]);
  }catch(e){setError(e.message||'Não foi possível carregar a monitorização.')}finally{setLoading(false)}
 },[]);
 useEffect(()=>{load()},[load]);
 const loadChoices=async id=>{
  setForm(v=>({...v,empreendimento_id:id,ativo_id:'',componente_id:''}));
  if(!id){setAssets([]);setComponents([]);return}
  const [a,c]=await Promise.all([supabase.from('ativos').select('id,codigo,nome').eq('empreendimento_id',id).order('nome'),supabase.from('componentes').select('id,codigo,nome,ativo_id').eq('empreendimento_id',id).order('nome')]);
  if(a.error||c.error){setError(a.error?.message||c.error?.message);return}setAssets(a.data||[]);setComponents(c.data||[]);
 };
 const saveDevice=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{const {data:u}=await supabase.auth.getUser();const payload={...form,ativo_id:form.ativo_id||null,componente_id:form.componente_id||null,limite_inferior:form.limite_inferior===''?null:Number(form.limite_inferior),limite_superior:form.limite_superior===''?null:Number(form.limite_superior),intervalo_leitura_min:form.intervalo_leitura_min===''?null:Number(form.intervalo_leitura_min),criado_por:u?.user?.id||null};const {error:e2}=await supabase.from('dispositivos_monitorizacao').insert(payload);if(e2)throw e2;setForm({...blank,empreendimento_id:form.empreendimento_id});setOpen(false);setMessage('Ponto de monitorização registado.');await load()}catch(e){setError(e.message||'Não foi possível guardar o ponto.')}finally{setSaving(false)}
 };
 const saveReading=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{const d=devices.find(x=>x.id===reading.dispositivo_id);if(!d)throw new Error('Seleciona um ponto de monitorização.');const {data:u}=await supabase.auth.getUser();const value=Number(reading.valor);if(!Number.isFinite(value))throw new Error('Indica um valor numérico.');const state=(d.limite_inferior!==null&&value<Number(d.limite_inferior))||(d.limite_superior!==null&&value>Number(d.limite_superior))?'alerta':'normal';const {error:e2}=await supabase.from('leituras_monitorizacao').insert({dispositivo_id:d.id,valor:value,unidade:d.unidade,estado:state,origem:'manual',observacoes:reading.observacoes||null,registado_por:u?.user?.id||null});if(e2)throw e2;setReading(v=>({...v,valor:'',observacoes:''}));setMessage(state==='alerta'?'Leitura guardada com alerta por ultrapassar os limites configurados.':'Leitura guardada.');await load()}catch(e){setError(e.message||'Não foi possível guardar a leitura.')}finally{setSaving(false)}
 };
 const latest=useMemo(()=>{const m=new Map();readings.forEach(x=>{if(!m.has(x.dispositivo_id))m.set(x.dispositivo_id,x)});return m},[readings]);
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar monitorização…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">Sistemas de monitorização</h2><p className="muted">Registo de sensores, limites de referência e leituras técnicas.</p></div><div style={{display:'flex',gap:8}}><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button><button className="primary" onClick={()=>setOpen(v=>!v)}><Plus size={16}/> Novo ponto</button></div></div>
  {error&&<div className="panel" role="alert" style={{padding:12,color:'#9b2525',marginBottom:12}}>{error}</div>}{message&&<div className="panel" role="status" style={{padding:12,color:'#176344',marginBottom:12}}>{message}</div>}
  {open&&<form className="panel" onSubmit={saveDevice} style={{padding:18,marginBottom:16}}><h3>Novo ponto de monitorização</h3><div className="grid2">
   <label>Empreendimento *<select required value={form.empreendimento_id} onChange={e=>loadChoices(e.target.value)}><option value="">Selecionar</option>{projects.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
   <label>Tipo de sensor<select value={form.tipo_sensor} onChange={e=>setForm(v=>({...v,tipo_sensor:e.target.value,unidade:e.target.value==='temperatura'?'°C':e.target.value==='humidade'?'%':e.target.value==='deslocamento'?'mm':e.target.value==='vibracao'?'mm/s':e.target.value==='corrosao'?'µm/ano':v.unidade}))}>{types.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
   <label>Código *<input required value={form.codigo} onChange={e=>setForm(v=>({...v,codigo:e.target.value}))}/></label><label>Designação *<input required value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))}/></label>
   <label>Ativo<select value={form.ativo_id} onChange={e=>setForm(v=>({...v,ativo_id:e.target.value,componente_id:''}))}><option value="">Não associado</option>{assets.map(a=><option key={a.id} value={a.id}>{a.codigo} · {a.nome}</option>)}</select></label>
   <label>Componente<select value={form.componente_id} onChange={e=>setForm(v=>({...v,componente_id:e.target.value}))}><option value="">Não associado</option>{components.filter(c=>!form.ativo_id||c.ativo_id===form.ativo_id).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nome}</option>)}</select></label>
   <label>Unidade *<input required value={form.unidade} onChange={e=>setForm(v=>({...v,unidade:e.target.value}))}/></label><label>Intervalo previsto (minutos)<input type="number" min="1" value={form.intervalo_leitura_min} onChange={e=>setForm(v=>({...v,intervalo_leitura_min:e.target.value}))}/></label>
   <label>Limite inferior<input type="number" step="any" value={form.limite_inferior} onChange={e=>setForm(v=>({...v,limite_inferior:e.target.value}))}/></label><label>Limite superior<input type="number" step="any" value={form.limite_superior} onChange={e=>setForm(v=>({...v,limite_superior:e.target.value}))}/></label>
  </div><button className="primary" disabled={saving}>Guardar ponto</button></form>}
  <form className="panel" onSubmit={saveReading} style={{padding:16,marginBottom:16}}><h3>Registar leitura manual</h3><div className="grid2"><label>Ponto<select required value={reading.dispositivo_id} onChange={e=>setReading(v=>({...v,dispositivo_id:e.target.value}))}><option value="">Selecionar ponto</option>{devices.filter(d=>d.ativo).map(d=><option key={d.id} value={d.id}>{d.codigo} · {d.nome}</option>)}</select></label><label>Valor medido<input required type="number" step="any" value={reading.valor} onChange={e=>setReading(v=>({...v,valor:e.target.value}))}/></label></div><label style={{display:'block'}}>Observações<input value={reading.observacoes} onChange={e=>setReading(v=>({...v,observacoes:e.target.value}))}/></label><button className="primary" disabled={saving||!devices.length}>Guardar leitura</button></form>
  <div className="panel table"><div className="thead"><span>Ponto / Sensor</span><span>Empreendimento</span><span>Última leitura</span><span>Limites</span><span>Estado</span></div>{devices.length?devices.map(d=>{const l=latest.get(d.id);return <div className="trow" key={d.id}><div><strong>{d.codigo} · {d.nome}</strong><small>{types.find(x=>x[0]===d.tipo_sensor)?.[1]||d.tipo_sensor}</small></div><span>{projects.find(p=>p.id===d.empreendimento_id)?.nome||'—'}</span><span>{l?Number(l.valor)+' '+l.unidade+' · '+new Date(l.data_leitura).toLocaleString('pt-PT'):'Sem leituras'}</span><span>{d.limite_inferior??'—'} / {d.limite_superior??'—'} {d.unidade}</span><span>{l?.estado==='alerta'?<b style={{color:'#b42318'}}>Alerta</b>:<b style={{color:'#16835d'}}>Normal</b>}</span></div>}):<p className="empty">Ainda não existem pontos de monitorização registados.</p>}</div>
  <p className="muted"><Activity size={14}/> {devices.length} ponto(s) · {readings.length} leitura(s). Nesta fase, a recolha é manual; a integração automática com hardware e gateways ainda não está ligada.</p>
 </section>
}
