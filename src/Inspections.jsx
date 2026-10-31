import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {Plus,RefreshCw,ClipboardCheck,AlertTriangle,ChevronRight,ArrowLeft,Save} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const TYPES=[['rotina','Rotina'],['principal','Principal'],['especial','Especial']];
const MAINTENANCE=['Muito bom','Bom','Razoável','Mau','Muito mau','Não avaliado'];
const blankForm=()=>({empreendimento_id:'',tipo:'rotina',data_inspecao:new Date().toISOString().slice(0,10),inspetor_nome:'',objetivo:'',observacoes:''});

export default function Inspections(){
 const [enterprises,setEnterprises]=useState([]),[rows,setRows]=useState([]),[assets,setAssets]=useState([]),[components,setComponents]=useState([]),[records,setRecords]=useState([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [formOpen,setFormOpen]=useState(false),[form,setForm]=useState(blankForm),[selected,setSelected]=useState(null);
 const [detailForm,setDetailForm]=useState({ativo_id:'',componente_id:'',estado_manutencao:'',classe_estado_conservacao:'',observacoes:'',requer_atencao:false});
 const load=useCallback(async()=>{
  if(!supabase){setError('A ligação ao Supabase não está configurada.');setLoading(false);return}
  setLoading(true);setError('');
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!userData?.user)throw new Error('Inicia sessão para consultar as inspeções.');
   const {data:members,error:memberError}=await supabase.from('membros_entidade').select('entidade_id').eq('utilizador_id',userData.user.id).eq('ativo',true);if(memberError)throw memberError;
   const ids=[...new Set((members||[]).map(x=>x.entidade_id))];if(!ids.length)throw new Error('A conta não tem entidades ativas associadas.');
   const [eRes,iRes]=await Promise.all([
    supabase.from('empreendimentos').select('id,nome,codigo,entidade_id').eq('ativo',true).in('entidade_id',ids).order('nome'),
    supabase.from('inspecoes').select('id,empreendimento_id,codigo,tipo,data_inspecao,inspetor_nome,objetivo,observacoes,estado,criado_em').order('data_inspecao',{ascending:false})
   ]);
   if(eRes.error)throw eRes.error;if(iRes.error)throw iRes.error;
   setEnterprises(eRes.data||[]);setRows(iRes.data||[]);
  }catch(e){setError(e?.message||'Não foi possível carregar as inspeções.')}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{load()},[load]);
 const enterpriseName=id=>enterprises.find(x=>x.id===id)?.nome||'Empreendimento';
 const openNew=()=>{setForm({...blankForm(),empreendimento_id:enterprises.length===1?enterprises[0].id:''});setFormOpen(true);setError('');setMessage('')};
 const createInspection=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;
   const code='INS-'+Date.now().toString().slice(-8);
   const payload={empreendimento_id:form.empreendimento_id,codigo:code,tipo:form.tipo,data_inspecao:form.data_inspecao,inspetor_id:userData?.user?.id||null,inspetor_nome:form.inspetor_nome.trim()||userData?.user?.email||null,objetivo:form.objetivo.trim()||null,observacoes:form.observacoes.trim()||null,estado:'em_preparacao'};
   const {data,error:e2}=await supabase.from('inspecoes').insert(payload).select('id,empreendimento_id,codigo,tipo,data_inspecao,inspetor_nome,objetivo,observacoes,estado,criado_em').single();if(e2)throw e2;
   setRows(v=>[data,...v]);setFormOpen(false);setSelected(data);setAssets([]);setComponents([]);setRecords([]);
   const [aRes,cRes]=await Promise.all([
    supabase.from('ativos').select('id,codigo,nome,tipo,localizacao,empreendimento_id').eq('empreendimento_id',data.empreendimento_id).order('nome'),
    supabase.from('componentes').select('id,codigo,nome,tipo,ativo_id,componente_pai_id,localizacao,empreendimento_id').eq('empreendimento_id',data.empreendimento_id).order('nome')
   ]);
   if(aRes.error)throw aRes.error;if(cRes.error)throw cRes.error;setAssets(aRes.data||[]);setComponents(cRes.data||[]);
   setMessage('Inspeção criada. Podes agora registar os elementos observados.');
  }catch(e){setError(e?.message||'Não foi possível criar a inspeção.')}
  finally{setSaving(false)}
 };
 const openInspection=async row=>{
  setSelected(row);setError('');setMessage('');setAssets([]);setComponents([]);setRecords([]);
  const [aRes,cRes,rRes]=await Promise.all([
   supabase.from('ativos').select('id,codigo,nome,tipo,localizacao,empreendimento_id').eq('empreendimento_id',row.empreendimento_id).order('nome'),
   supabase.from('componentes').select('id,codigo,nome,tipo,ativo_id,componente_pai_id,localizacao,empreendimento_id').eq('empreendimento_id',row.empreendimento_id).order('nome'),
   supabase.from('inspecao_registos').select('id,inspecao_id,ativo_id,componente_id,estado_manutencao,classe_estado_conservacao,observacoes,requer_atencao,criado_em').eq('inspecao_id',row.id).order('criado_em')
  ]);
  if(aRes.error||cRes.error||rRes.error){setError(aRes.error?.message||cRes.error?.message||rRes.error?.message);return}
  setAssets(aRes.data||[]);setComponents(cRes.data||[]);setRecords(rRes.data||[]);
 };
 const saveRecord=async e=>{
  e.preventDefault();if(!selected)return;setSaving(true);setError('');setMessage('');
  try{
   if(!detailForm.ativo_id&&!detailForm.componente_id)throw new Error('Seleciona um ativo ou componente.');
   const payload={inspecao_id:selected.id,ativo_id:detailForm.ativo_id||null,componente_id:detailForm.componente_id||null,estado_manutencao:detailForm.estado_manutencao||null,classe_estado_conservacao:detailForm.classe_estado_conservacao===''?null:Number(detailForm.classe_estado_conservacao),observacoes:detailForm.observacoes.trim()||null,requer_atencao:detailForm.requer_atencao};
   const {data,error:e2}=await supabase.from('inspecao_registos').insert(payload).select('id,inspecao_id,ativo_id,componente_id,estado_manutencao,classe_estado_conservacao,observacoes,requer_atencao,criado_em').single();if(e2)throw e2;
   setRecords(v=>[...v,data]);setDetailForm({ativo_id:'',componente_id:'',estado_manutencao:'',classe_estado_conservacao:'',observacoes:'',requer_atencao:false});setMessage('Registo de inspeção guardado.');
  }catch(e){setError(e?.message||'Não foi possível guardar o registo.')}
  finally{setSaving(false)}
 };
 const complete=async()=>{
  if(!selected)return;setSaving(true);setError('');setMessage('');
  try{const {data,error:e2}=await supabase.from('inspecoes').update({estado:'concluida'}).eq('id',selected.id).select('id,empreendimento_id,codigo,tipo,data_inspecao,inspetor_nome,objetivo,observacoes,estado,criado_em').single();if(e2)throw e2;setSelected(data);setRows(v=>v.map(x=>x.id===data.id?data:x));setMessage('Inspeção marcada como concluída.')}
  catch(e){setError(e?.message||'Não foi possível concluir a inspeção.')}finally{setSaving(false)}
 };
 const itemName=id=>{const a=assets.find(x=>x.id===id);const c=components.find(x=>x.id===id);return a?(a.codigo+' · '+a.nome):c?(c.codigo+' · '+c.nome):'Elemento'};
 const ecValues=records.map(x=>x.classe_estado_conservacao).filter(x=>x!==null&&x!==undefined);
 const ecMax=ecValues.length?Math.max(...ecValues):null;
 const ecMean=ecValues.length?(ecValues.reduce((a,b)=>a+b,0)/ecValues.length).toFixed(1):'—';
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar inspeções do Supabase…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">{selected?'Ficha da inspeção':'Inspeções'}</h2><p className="muted">Inspeções de rotina, principais e especiais, associadas ao inventário do empreendimento.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{selected?<button className="secondary" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> Voltar à lista</button>:<><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button><button className="primary" onClick={openNew} disabled={!enterprises.length}><Plus size={17}/> Nova inspeção</button></>}</div></div>
  {error&&<div className="panel" role="alert" style={{padding:14,marginBottom:14,borderLeft:'4px solid #b42318',color:'#8f1d1d'}}><AlertTriangle size={17}/> {error}</div>}
  {message&&<div className="panel" role="status" style={{padding:14,marginBottom:14,color:'#176344'}}>{message}</div>}
  {!selected&&<div className="panel table"><div className="thead"><span>Código / Inspetor</span><span>Empreendimento</span><span>Data</span><span>Tipo</span><span>Estado</span><span></span></div>{rows.length?rows.map(r=><div className="trow" key={r.id} role="button" tabIndex={0} onClick={()=>openInspection(r)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openInspection(r)}}} style={{cursor:'pointer'}}><div><strong>{r.codigo}</strong><small>{r.inspetor_nome||'Inspetor não indicado'}</small></div><span>{enterpriseName(r.empreendimento_id)}</span><span>{r.data_inspecao}</span><span>{TYPES.find(x=>x[0]===r.tipo)?.[1]||r.tipo}</span><span>{r.estado==='concluida'?'Concluída':r.estado==='em_curso'?'Em curso':r.estado==='cancelada'?'Cancelada':'Em preparação'}</span><span><ChevronRight size={17}/></span></div>):<p className="empty">Ainda não existem inspeções registadas. Cria a primeira para começar.</p>}</div>}
  {selected&&<><div className="panel" style={{padding:20,marginBottom:16}}><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><span className="eyebrow">{selected.codigo}</span><h2 style={{margin:'8px 0',color:'#173b59'}}>{enterpriseName(selected.empreendimento_id)}</h2><p className="muted">{TYPES.find(x=>x[0]===selected.tipo)?.[1]} · {selected.data_inspecao} · {selected.inspetor_nome||'Inspetor não indicado'}</p><p>{selected.objetivo||'Sem objetivo indicado.'}</p></div><span className="pill">{selected.estado==='concluida'?'Concluída':selected.estado==='em_curso'?'Em curso':'Em preparação'}</span></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginTop:16}}><div className="stat"><span>Elementos registados</span><strong>{records.length}</strong></div><div className="stat"><span>EC máximo registado</span><strong>{ecMax===null?'—':'EC '+ecMax}</strong></div><div className="stat"><span>EC médio</span><strong>{ecMean}</strong></div><div className="stat"><span>Atenção requerida</span><strong>{records.filter(x=>x.requer_atencao).length}</strong></div></div></div>
   {selected.estado!=='concluida'&&<form className="panel" onSubmit={saveRecord} style={{padding:20,marginBottom:16}}><h3>Registar elemento inspecionado</h3><p className="muted">Podes registar o ativo completo ou um componente/subcomponente individual. O inventário pode ser preenchido progressivamente.</p><label style={label}>Ativo (opcional)</label><select style={field} value={detailForm.ativo_id} onChange={e=>setDetailForm(v=>({...v,ativo_id:e.target.value,componente_id:''}))}><option value="">Não selecionar ativo</option>{assets.map(a=><option key={a.id} value={a.id}>{a.codigo} · {a.nome}</option>)}</select><label style={label}>Componente / subcomponente (opcional)</label><select style={field} value={detailForm.componente_id} onChange={e=>setDetailForm(v=>({...v,componente_id:e.target.value}))}><option value="">Não selecionar componente</option>{components.map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nome} ({c.tipo})</option>)}</select><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}><div><label style={label}>Estado de manutenção</label><select style={field} value={detailForm.estado_manutencao} onChange={e=>setDetailForm(v=>({...v,estado_manutencao:e.target.value}))}><option value="">Não avaliado</option>{MAINTENANCE.map(x=><option key={x}>{x}</option>)}</select></div><div><label style={label}>Estado de conservação (EC)</label><select style={field} value={detailForm.classe_estado_conservacao} onChange={e=>setDetailForm(v=>({...v,classe_estado_conservacao:e.target.value}))}><option value="">Não avaliado</option>{[0,1,2,3,4,5].map(x=><option key={x} value={x}>EC {x}</option>)}</select></div></div><label style={label}>Observações</label><textarea rows="3" style={field} value={detailForm.observacoes} onChange={e=>setDetailForm(v=>({...v,observacoes:e.target.value}))} placeholder="Descreve o estado observado, localização ou recomendações…"/><label style={{...label,display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={detailForm.requer_atencao} onChange={e=>setDetailForm(v=>({...v,requer_atencao:e.target.checked}))}/> Requer atenção / acompanhamento</label><button className="primary" type="submit" disabled={saving}><Save size={16}/> {saving?'A guardar…':'Guardar registo'}</button></form>}
   <div className="panel table"><div className="panelhead"><div><h3>Elementos avaliados</h3><span>{records.length} registos associados a esta inspeção</span></div></div><div className="thead"><span>Elemento</span><span>Manutenção</span><span>EC</span><span>Atenção</span><span>Observações</span></div>{records.length?records.map(r=><div className="trow" key={r.id}><strong>{itemName(r.componente_id||r.ativo_id)}</strong><span>{r.estado_manutencao||'—'}</span><span>{r.classe_estado_conservacao===null?'—':'EC '+r.classe_estado_conservacao}</span><span>{r.requer_atencao?'Sim':'Não'}</span><span>{r.observacoes||'—'}</span></div>):<p className="empty">Ainda não foram avaliados elementos nesta inspeção.</p>}</div>
   {selected.estado!=='concluida'&&<div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}><button className="primary" disabled={saving||!records.length} onClick={complete}><ClipboardCheck size={16}/> Concluir inspeção</button></div>}
  </>}
  {formOpen&&<div role="presentation" onClick={()=>setFormOpen(false)} style={{position:'fixed',inset:0,zIndex:2200,background:'rgba(10,28,44,.58)',display:'grid',placeItems:'center',padding:18}}><form onSubmit={createInspection} onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:18,padding:22,boxSizing:'border-box'}}><h2 style={{color:'#173b59'}}>Nova inspeção</h2><label style={label}>Empreendimento *</label><select required style={field} value={form.empreendimento_id} onChange={e=>setForm(v=>({...v,empreendimento_id:e.target.value}))}><option value="">Selecionar empreendimento</option>{enterprises.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select><label style={label}>Tipo de inspeção *</label><select style={field} value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))}>{TYPES.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select><label style={label}>Data *</label><input required type="date" style={field} value={form.data_inspecao} onChange={e=>setForm(v=>({...v,data_inspecao:e.target.value}))}/><label style={label}>Inspetor</label><input style={field} value={form.inspetor_nome} onChange={e=>setForm(v=>({...v,inspetor_nome:e.target.value}))} placeholder="Nome do inspetor"/><label style={label}>Objetivo</label><textarea rows="2" style={field} value={form.objetivo} onChange={e=>setForm(v=>({...v,objetivo:e.target.value}))}/><label style={label}>Observações</label><textarea rows="2" style={field} value={form.observacoes} onChange={e=>setForm(v=>({...v,observacoes:e.target.value}))}/><div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}><button type="button" className="secondary" onClick={()=>setFormOpen(false)}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?'A criar…':'Criar inspeção'}</button></div></form></div>}
  {!enterprises.length&&!selected&&<div className="panel" style={{padding:18,marginTop:14}}>Não existem empreendimentos disponíveis para a tua conta. Confirma as permissões da entidade responsável.</div>}
 </section>;
}
const label={display:'block',fontWeight:700,color:'#23415b',marginTop:13,fontSize:13};
const field={width:'100%',boxSizing:'border-box',padding:11,marginTop:6,marginBottom:10,border:'1px solid #cad8e5',borderRadius:9,background:'#fff',color:'#23415b',fontSize:14};
