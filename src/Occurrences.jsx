import React,{useCallback,useEffect,useState} from 'react';
import {Plus,RefreshCw,AlertTriangle,ArrowLeft,Save,Search,ClipboardList} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const categories=['Humidade ou água','Fissura ou racha','Elemento partido ou danificado','Equipamento avariado','Ruído ou vibração','Mau cheiro','Eletricidade ou iluminação','Outro'];
const statuses=[['por_analisar','Por analisar'],['em_triagem','Em triagem'],['aguarda_informacao','Aguarda informação'],['convertida','Convertida em registo técnico'],['sem_anomalia','Sem anomalia confirmada'],['duplicada','Duplicada'],['encerrada','Encerrada']];
const field={width:'100%',boxSizing:'border-box',padding:11,marginTop:6,marginBottom:12,border:'1px solid #cad8e5',borderRadius:9,background:'#fff',color:'#23415b',fontSize:14};
const label={display:'block',fontWeight:700,color:'#23415b',marginTop:10,fontSize:13};
const blank=()=>({empreendimento_id:'',ativo_id:'',componente_id:'',categoria_comunicada:categories[0],descricao_observada:'',localizacao_texto:'',urgencia_comunicada:'nao_sei',reportado_nome:'',reportado_contacto:'',canal_origem:'aplicacao'});
export default function Occurrences(){
 const [enterprises,setEnterprises]=useState([]),[assets,setAssets]=useState([]),[components,setComponents]=useState([]),[rows,setRows]=useState([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [open,setOpen]=useState(false),[form,setForm]=useState(blank),[selected,setSelected]=useState(null),[filter,setFilter]=useState(''),[analysis,setAnalysis]=useState({estado:'por_analisar',classificacao_tecnica:'',conclusao_triagem:'',observacoes_tecnicas:''});
 const load=useCallback(async()=>{
  if(!supabase){setError('A ligação ao Supabase não está configurada.');setLoading(false);return}
  setLoading(true);setError('');
  try{
   const {data:u,error:ue}=await supabase.auth.getUser();if(ue)throw ue;if(!u?.user)throw new Error('Inicia sessão para consultar as ocorrências.');
   const {data:m,error:me}=await supabase.from('membros_entidade').select('entidade_id').eq('utilizador_id',u.user.id).eq('ativo',true);if(me)throw me;
   const ids=[...new Set((m||[]).map(x=>x.entidade_id))];if(!ids.length)throw new Error('A conta não tem entidades ativas associadas.');
   const [e,a,c,o]=await Promise.all([
    supabase.from('empreendimentos').select('id,nome,codigo,entidade_id').eq('ativo',true).in('entidade_id',ids).order('nome'),
    supabase.from('ativos').select('id,empreendimento_id,codigo,nome').order('nome'),
    supabase.from('componentes').select('id,empreendimento_id,ativo_id,codigo,nome').order('nome'),
    supabase.from('ocorrencias').select('*').order('identificada_em',{ascending:false})
   ]);
   if(e.error||a.error||c.error||o.error)throw e.error||a.error||c.error||o.error;
   setEnterprises(e.data||[]);setAssets(a.data||[]);setComponents(c.data||[]);setRows(o.data||[]);
  }catch(err){setError(err?.message||'Não foi possível carregar as ocorrências.')}finally{setLoading(false)}
 },[]);
 useEffect(()=>{load()},[load]);
 const enterpriseName=id=>enterprises.find(x=>x.id===id)?.nome||'Empreendimento';
 const create=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{
   if(!form.empreendimento_id||!form.descricao_observada.trim())throw new Error('Seleciona o empreendimento e descreve o que observaste.');
   const {data:u,error:ue}=await supabase.auth.getUser();if(ue)throw ue;
   const code='OCR-'+Date.now().toString().slice(-8);
   const payload={...form,codigo:code,ativo_id:form.ativo_id||null,componente_id:form.componente_id||null,descricao_observada:form.descricao_observada.trim(),localizacao_texto:form.localizacao_texto.trim()||null,reportado_nome:form.reportado_nome.trim()||u?.user?.email||null,reportado_contacto:form.reportado_contacto.trim()||null,reportado_por:u?.user?.id||null};
   const {data,error:e2}=await supabase.from('ocorrencias').insert(payload).select('*').single();if(e2)throw e2;
   setRows(v=>[data,...v]);setOpen(false);setForm(blank());setMessage('Ocorrência registada. Aguarda agora a análise técnica.');
  }catch(err){setError(err?.message||'Não foi possível registar a ocorrência.')}finally{setSaving(false)}
 };
 const inspect=row=>{setSelected(row);setAnalysis({estado:row.estado||'por_analisar',classificacao_tecnica:row.classificacao_tecnica||'',conclusao_triagem:row.conclusao_triagem||'',observacoes_tecnicas:row.observacoes_tecnicas||''});setError('');setMessage('')};
 const saveAnalysis=async e=>{
  e.preventDefault();if(!selected)return;setSaving(true);setError('');setMessage('');
  try{
   const {data:u,error:ue}=await supabase.auth.getUser();if(ue)throw ue;
   const payload={...analysis,analisado_por:u?.user?.id||null,analisado_em:new Date().toISOString(),atualizado_em:new Date().toISOString()};
   const {data,error:e2}=await supabase.from('ocorrencias').update(payload).eq('id',selected.id).select('*').single();if(e2)throw e2;
   setSelected(data);setRows(v=>v.map(x=>x.id===data.id?data:x));setMessage('Triagem técnica atualizada.');
  }catch(err){setError(err?.message||'Não foi possível guardar a análise.')}finally{setSaving(false)}
 };
 const visible=rows.filter(x=>(x.codigo+' '+x.descricao_observada+' '+enterpriseName(x.empreendimento_id)+' '+x.estado).toLowerCase().includes(filter.toLowerCase()));
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar ocorrências…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">{selected?'Análise da ocorrência':'Ocorrências comunicadas'}</h2><p className="muted">Qualquer utilizador pode comunicar o que observou. A classificação técnica é feita posteriormente.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{selected?<button className="secondary" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> Voltar</button>:<><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button><button className="primary" onClick={()=>{setOpen(true);setForm(blank());setError('')}}><Plus size={17}/> Comunicar problema</button></>}</div></div>
  {error&&<div className="panel" role="alert" style={{padding:14,marginBottom:14,color:'#8f1d1d',borderLeft:'4px solid #b42318'}}><AlertTriangle size={17}/> {error}</div>}
  {message&&<div className="panel" role="status" style={{padding:14,marginBottom:14,color:'#176344'}}>{message}</div>}
  {!selected&&<><div className="search" style={{marginBottom:14}}><Search size={18}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Pesquisar código, descrição ou empreendimento…"/></div><div className="panel table"><div className="thead"><span>Código / Descrição</span><span>Empreendimento</span><span>Data</span><span>Urgência</span><span>Estado</span><span></span></div>{visible.length?visible.map(o=><div className="trow" key={o.id} role="button" tabIndex={0} onClick={()=>inspect(o)} onKeyDown={e=>{if(e.key==='Enter')inspect(o)}} style={{cursor:'pointer'}}><div><strong>{o.codigo}</strong><small>{o.categoria_comunicada} · {o.descricao_observada}</small></div><span>{enterpriseName(o.empreendimento_id)}</span><span>{new Date(o.identificada_em).toLocaleDateString('pt-PT')}</span><span>{o.urgencia_comunicada==='urgente'?'Urgente':o.urgencia_comunicada==='normal'?'Normal':'Não indicada'}</span><span>{statuses.find(s=>s[0]===o.estado)?.[1]||o.estado}</span><span><ClipboardList size={17}/></span></div>):<p className="empty">Ainda não existem ocorrências comunicadas.</p>}</div></>}
  {selected&&<><div className="panel" style={{padding:20,marginBottom:16}}><span className="eyebrow">{selected.codigo}</span><h3 style={{margin:'8px 0'}}>{selected.categoria_comunicada}</h3><p>{selected.descricao_observada}</p><div className="grid2"><p><b>Empreendimento:</b> {enterpriseName(selected.empreendimento_id)}</p><p><b>Localização:</b> {selected.localizacao_texto||'Não indicada'}</p><p><b>Comunicado por:</b> {selected.reportado_nome||'Não indicado'}</p><p><b>Contacto:</b> {selected.reportado_contacto||'Não indicado'}</p><p><b>Urgência indicada:</b> {selected.urgencia_comunicada}</p><p><b>Canal:</b> {selected.canal_origem}</p></div><p className="muted">A comunicação original é preservada. A classificação técnica não deve ser presumida a partir da descrição do comunicante.</p></div>
   <form className="panel" onSubmit={saveAnalysis} style={{padding:20}}><h3>Triagem e análise técnica</h3><label style={label}>Estado</label><select style={field} value={analysis.estado} onChange={e=>setAnalysis(v=>({...v,estado:e.target.value}))}>{statuses.map(s=><option value={s[0]} key={s[0]}>{s[1]}</option>)}</select><label style={label}>Classificação técnica (após análise)</label><select style={field} value={analysis.classificacao_tecnica} onChange={e=>setAnalysis(v=>({...v,classificacao_tecnica:e.target.value}))}><option value="">Por determinar</option>{['Patologia de construção civil','Defeito','Deficiência','Avaria de equipamento','Necessidade de manutenção','Outra ocorrência'].map(x=><option key={x}>{x}</option>)}</select><label style={label}>Conclusão da triagem</label><textarea rows="3" style={field} value={analysis.conclusao_triagem} onChange={e=>setAnalysis(v=>({...v,conclusao_triagem:e.target.value}))} placeholder="Conclusão preliminar, necessidade de visita ou informação adicional…"/><label style={label}>Observações técnicas internas</label><textarea rows="3" style={field} value={analysis.observacoes_tecnicas} onChange={e=>setAnalysis(v=>({...v,observacoes_tecnicas:e.target.value}))}/><button className="primary" type="submit" disabled={saving}><Save size={16}/> {saving?'A guardar…':'Guardar triagem'}</button></form>
  </>}
  {open&&<div role="presentation" onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:2200,background:'rgba(10,28,44,.58)',display:'grid',placeItems:'center',padding:18}}><form onSubmit={create} onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:580,maxHeight:'92vh',overflowY:'auto',background:'#fff',borderRadius:18,padding:22,boxSizing:'border-box'}}><h2 style={{color:'#173b59'}}>Comunicar um problema</h2><p className="muted">Não precisa de conhecimentos técnicos. Descreva simplesmente o que observou.</p><label style={label}>Empreendimento *</label><select required style={field} value={form.empreendimento_id} onChange={e=>setForm(v=>({...v,empreendimento_id:e.target.value,ativo_id:'',componente_id:''}))}><option value="">Selecionar empreendimento</option>{enterprises.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select><label style={label}>Ativo (se souber)</label><select style={field} value={form.ativo_id} onChange={e=>setForm(v=>({...v,ativo_id:e.target.value,componente_id:''}))}><option value="">Não sei / não se aplica</option>{assets.filter(a=>a.empreendimento_id===form.empreendimento_id).map(a=><option key={a.id} value={a.id}>{a.codigo} · {a.nome}</option>)}</select><label style={label}>Componente (opcional)</label><select style={field} value={form.componente_id} onChange={e=>setForm(v=>({...v,componente_id:e.target.value}))}><option value="">Não sei identificar</option>{components.filter(c=>c.empreendimento_id===form.empreendimento_id&&(!form.ativo_id||c.ativo_id===form.ativo_id)).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nome}</option>)}</select><label style={label}>O que observou? *</label><select style={field} value={form.categoria_comunicada} onChange={e=>setForm(v=>({...v,categoria_comunicada:e.target.value}))}>{categories.map(x=><option key={x}>{x}</option>)}</select><textarea required rows="4" style={field} value={form.descricao_observada} onChange={e=>setForm(v=>({...v,descricao_observada:e.target.value}))} placeholder="Descreva o que aconteceu e onde…"/><label style={label}>Localização (ex.: quarto 12, garagem, fachada norte)</label><input style={field} value={form.localizacao_texto} onChange={e=>setForm(v=>({...v,localizacao_texto:e.target.value}))}/><label style={label}>Considera que é urgente?</label><select style={field} value={form.urgencia_comunicada} onChange={e=>setForm(v=>({...v,urgencia_comunicada:e.target.value}))}><option value="nao_sei">Não sei avaliar</option><option value="normal">Não é urgente</option><option value="urgente">Sim, é urgente</option></select><label style={label}>Nome (opcional)</label><input style={field} value={form.reportado_nome} onChange={e=>setForm(v=>({...v,reportado_nome:e.target.value}))}/><label style={label}>Contacto (opcional)</label><input style={field} value={form.reportado_contacto} onChange={e=>setForm(v=>({...v,reportado_contacto:e.target.value}))}/><div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:14}}><button type="button" className="secondary" onClick={()=>setOpen(false)}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?'A enviar…':'Registar ocorrência'}</button></div></form></div>}
 </section>;
}
