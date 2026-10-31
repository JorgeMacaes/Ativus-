import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {Plus,RefreshCw,ClipboardCheck,AlertTriangle,ChevronRight,ArrowLeft,Save,CheckCircle2} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const TYPES=[['rotina','Rotina'],['principal','Principal'],['especial','Especial']];
const MAINTENANCE=['Muito bom','Bom','Razoável','Mau','Muito mau'];
const blankForm=()=>({empreendimento_id:'',ativo_id:'',tipo:'rotina',data_inspecao:new Date().toISOString().slice(0,10),inspetor_nome:'',objetivo:'',observacoes:''});
const itemSelect='id,inspecao_id,ativo_id,componente_id,elemento_codigo,elemento_nome,elemento_tipo,componente_pai_id,estado_cobertura,justificacao,ordem';
const recordSelect='id,inspecao_id,inspecao_item_id,ativo_id,componente_id,estado_manutencao,classe_estado_conservacao,observacoes,requer_atencao,criado_em';

export default function Inspections(){
 const [enterprises,setEnterprises]=useState([]),[rows,setRows]=useState([]),[assets,setAssets]=useState([]),[components,setComponents]=useState([]),[coverage,setCoverage]=useState([]),[records,setRecords]=useState([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [formOpen,setFormOpen]=useState(false),[form,setForm]=useState(blankForm),[selected,setSelected]=useState(null),[activeItem,setActiveItem]=useState(null);
 const [detailForm,setDetailForm]=useState({estado_manutencao:'',classe_estado_conservacao:'',observacoes:'',requer_atencao:false});
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
   if(eRes.error)throw eRes.error;if(iRes.error)throw iRes.error;setEnterprises(eRes.data||[]);setRows(iRes.data||[]);
  }catch(e){setError(e?.message||'Não foi possível carregar as inspeções.')}finally{setLoading(false)}
 },[]);
 useEffect(()=>{load()},[load]);
 const enterpriseName=id=>enterprises.find(x=>x.id===id)?.nome||'Empreendimento';
 const selectedAsset=useMemo(()=>assets.find(a=>coverage.some(i=>i.ativo_id===a.id))||null,[assets,coverage]);
 const recordByItem=useMemo(()=>Object.fromEntries(records.filter(r=>r.inspecao_item_id).map(r=>[r.inspecao_item_id,r])),[records]);
 const counts=useMemo(()=>({total:coverage.length,done:coverage.filter(x=>x.estado_cobertura!=='pendente').length,pending:coverage.filter(x=>x.estado_cobertura==='pendente').length,exceptions:coverage.filter(x=>['inacessivel','nao_aplicavel'].includes(x.estado_cobertura)).length}),[coverage]);
 const ecValues=records.map(x=>x.classe_estado_conservacao).filter(x=>x!==null&&x!==undefined);
 const ecMax=ecValues.length?Math.max(...ecValues):null,ecMean=ecValues.length?(ecValues.reduce((a,b)=>a+b,0)/ecValues.length).toFixed(1):'—';
 const openNew=async()=>{setForm({...blankForm(),empreendimento_id:enterprises.length===1?enterprises[0].id:''});setAssets([]);setFormOpen(true);setError('');setMessage('')};
 const loadInventory=async enterpriseId=>{
  if(!enterpriseId){setAssets([]);return}
  const {data,error:e}=await supabase.from('ativos').select('id,codigo,nome,tipo,localizacao,empreendimento_id').eq('empreendimento_id',enterpriseId).order('nome');
  if(e)throw e;setAssets(data||[]);
 };
 const makeSnapshot=(asset,allComponents,inspectionId)=>{
  const belongs=new Set(),byId=new Map(allComponents.map(c=>[c.id,c]));
  allComponents.filter(c=>c.ativo_id===asset.id).forEach(c=>belongs.add(c.id));
  let changed=true;while(changed){changed=false;allComponents.forEach(c=>{if(c.componente_pai_id&&belongs.has(c.componente_pai_id)&&!belongs.has(c.id)){belongs.add(c.id);changed=true}})}
  const descendants=allComponents.filter(c=>belongs.has(c.id));
  const items=[{inspecao_id:inspectionId,ativo_id:asset.id,componente_id:null,elemento_codigo:asset.codigo||null,elemento_nome:asset.nome,elemento_tipo:'ativo',componente_pai_id:null,estado_cobertura:'pendente',ordem:0}];
  descendants.forEach((c,i)=>items.push({inspecao_id:inspectionId,ativo_id:null,componente_id:c.id,elemento_codigo:c.codigo||null,elemento_nome:c.nome,elemento_tipo:'componente',componente_pai_id:c.componente_pai_id||null,estado_cobertura:'pendente',ordem:i+1}));
  return items;
 };
 const createInspection=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{
   if(!form.ativo_id)throw new Error('Seleciona o ativo que será inspecionado.');
   const asset=assets.find(a=>a.id===form.ativo_id);if(!asset)throw new Error('O ativo selecionado já não está disponível no inventário.');
   const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;
   const {data:allComponents,error:cErr}=await supabase.from('componentes').select('id,codigo,nome,tipo,ativo_id,componente_pai_id,localizacao,empreendimento_id').eq('empreendimento_id',form.empreendimento_id).order('nome');if(cErr)throw cErr;
   const code='INS-'+Date.now().toString().slice(-8);
   const payload={empreendimento_id:form.empreendimento_id,codigo:code,tipo:form.tipo,data_inspecao:form.data_inspecao,inspetor_id:userData?.user?.id||null,inspetor_nome:form.inspetor_nome.trim()||userData?.user?.email||null,objetivo:form.objetivo.trim()||null,observacoes:form.observacoes.trim()||null,estado:'em_preparacao'};
   const {data:created,error:e2}=await supabase.from('inspecoes').insert(payload).select('id,empreendimento_id,codigo,tipo,data_inspecao,inspetor_nome,objetivo,observacoes,estado,criado_em').single();if(e2)throw e2;
   const snapshot=makeSnapshot(asset,allComponents||[],created.id);
   const {data:items,error:itemError}=await supabase.from('inspecao_itens').insert(snapshot).select(itemSelect);
   if(itemError){await supabase.from('inspecoes').delete().eq('id',created.id);throw itemError}
   setComponents(allComponents||[]);setCoverage(items||[]);setRecords([]);setSelected(created);setActiveItem(null);setFormOpen(false);setRows(v=>[created,...v]);setMessage('Inspeção criada com a cobertura do inventário: ativo, componentes e subcomponentes incluídos.');
  }catch(e){setError(e?.message||'Não foi possível criar a inspeção.')}finally{setSaving(false)}
 };
 const openInspection=async row=>{
  setSelected(row);setError('');setMessage('');setCoverage([]);setRecords([]);setActiveItem(null);
  const [iRes,rRes,cRes,aRes]=await Promise.all([
   supabase.from('inspecao_itens').select(itemSelect).eq('inspecao_id',row.id).order('ordem'),
   supabase.from('inspecao_registos').select(recordSelect).eq('inspecao_id',row.id).order('criado_em'),
   supabase.from('componentes').select('id,codigo,nome,tipo,ativo_id,componente_pai_id,localizacao,empreendimento_id').eq('empreendimento_id',row.empreendimento_id),
   supabase.from('ativos').select('id,codigo,nome,tipo,localizacao,empreendimento_id').eq('empreendimento_id',row.empreendimento_id)
  ]);
  if(iRes.error||rRes.error||cRes.error||aRes.error){setError(iRes.error?.message||rRes.error?.message||cRes.error?.message||aRes.error?.message);return}
  setCoverage(iRes.data||[]);setRecords(rRes.data||[]);setComponents(cRes.data||[]);setAssets(aRes.data||[]);
 };
 const chooseItem=item=>{
  setActiveItem(item);const r=recordByItem[item.id];
  setDetailForm({estado_manutencao:r?.estado_manutencao||'',classe_estado_conservacao:r?.classe_estado_conservacao??'',observacoes:r?.observacoes||'',requer_atencao:!!r?.requer_atencao});
 };
 const saveRecord=async e=>{
  e.preventDefault();if(!selected||!activeItem)return;setSaving(true);setError('');setMessage('');
  try{
   const payload={inspecao_id:selected.id,inspecao_item_id:activeItem.id,ativo_id:activeItem.ativo_id||null,componente_id:activeItem.componente_id||null,estado_manutencao:detailForm.estado_manutencao||null,classe_estado_conservacao:detailForm.classe_estado_conservacao===''?null:Number(detailForm.classe_estado_conservacao),observacoes:detailForm.observacoes.trim()||null,requer_atencao:detailForm.requer_atencao};
   const existing=recordByItem[activeItem.id];let saved;
   if(existing){const {data,error:e}=await supabase.from('inspecao_registos').update(payload).eq('id',existing.id).select(recordSelect).single();if(e)throw e;saved=data}
   else{const {data,error:e}=await supabase.from('inspecao_registos').insert(payload).select(recordSelect).single();if(e)throw e;saved=data}
   const {data:item,error:itemErr}=await supabase.from('inspecao_itens').update({estado_cobertura:'inspecionado',justificacao:null}).eq('id',activeItem.id).select(itemSelect).single();if(itemErr)throw itemErr;
   setRecords(v=>existing?v.map(x=>x.id===saved.id?saved:x):[...v,saved]);setCoverage(v=>v.map(x=>x.id===item.id?item:x));setActiveItem(null);setMessage('Avaliação guardada. O elemento ficou validado; não foi criada nenhuma patologia.');
  }catch(e){setError(e?.message||'Não foi possível guardar a avaliação.')}finally{setSaving(false)}
 };
 const markException=async(status)=>{
  if(!activeItem)return;const reason=window.prompt(status==='inacessivel'?'Indica por que motivo o elemento está inacessível:':'Justifica por que motivo o elemento não é aplicável:');if(!reason?.trim())return;
  setSaving(true);setError('');try{const {data,error:e}=await supabase.from('inspecao_itens').update({estado_cobertura:status,justificacao:reason.trim()}).eq('id',activeItem.id).select(itemSelect).single();if(e)throw e;setCoverage(v=>v.map(x=>x.id===data.id?data:x));setActiveItem(null);setMessage('Exceção registada com justificação.')}catch(e){setError(e?.message||'Não foi possível registar a exceção.')}finally{setSaving(false)}
 };
 const complete=async()=>{
  if(!selected)return;setSaving(true);setError('');setMessage('');
  try{const {data,error:e}=await supabase.from('inspecoes').update({estado:'concluida'}).eq('id',selected.id).select('id,empreendimento_id,codigo,tipo,data_inspecao,inspetor_nome,objetivo,observacoes,estado,criado_em').single();if(e)throw e;setSelected(data);setRows(v=>v.map(x=>x.id===data.id?data:x));setMessage('Inspeção concluída. Todos os elementos têm avaliação ou exceção justificada.')}
  catch(e){setError(e?.message||'Não foi possível concluir. Confirma se existem elementos pendentes.')}finally{setSaving(false)}
 };
 const itemName=item=>[item.elemento_codigo,item.elemento_nome].filter(Boolean).join(' · ');
 const statusLabel=s=>s==='inspecionado'?'Inspecionado':s==='inacessivel'?'Inacessível':s==='nao_aplicavel'?'Não aplicável':'Pendente';
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar inspeções do Supabase…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">{selected?'Ficha da inspeção':'Inspeções'}</h2><p className="muted">Cada inspeção cobre automaticamente o ativo e todos os componentes e subcomponentes do inventário.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{selected?<button className="secondary" onClick={()=>{setSelected(null);setActiveItem(null)}}><ArrowLeft size={16}/> Voltar à lista</button>:<><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button><button className="primary" onClick={openNew} disabled={!enterprises.length}><Plus size={17}/> Nova inspeção</button></>}</div></div>
  {error&&<div className="panel" role="alert" style={{padding:14,marginBottom:14,borderLeft:'4px solid #b42318',color:'#8f1d1d'}}><AlertTriangle size={17}/> {error}</div>}
  {message&&<div className="panel" role="status" style={{padding:14,marginBottom:14,color:'#176344'}}>{message}</div>}
  {!selected&&<div className="panel table"><div className="thead"><span>Código / Inspetor</span><span>Empreendimento</span><span>Data</span><span>Tipo</span><span>Estado</span><span></span></div>{rows.length?rows.map(r=><div className="trow" key={r.id} role="button" tabIndex={0} onClick={()=>openInspection(r)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openInspection(r)}}} style={{cursor:'pointer'}}><div><strong>{r.codigo}</strong><small>{r.inspetor_nome||'Inspetor não indicado'}</small></div><span>{enterpriseName(r.empreendimento_id)}</span><span>{r.data_inspecao}</span><span>{TYPES.find(x=>x[0]===r.tipo)?.[1]||r.tipo}</span><span>{r.estado==='concluida'?'Concluída':r.estado==='em_curso'?'Em curso':r.estado==='cancelada'?'Cancelada':'Em preparação'}</span><span><ChevronRight size={17}/></span></div>):<p className="empty">Ainda não existem inspeções registadas. Cria a primeira para começar.</p>}</div>}
  {selected&&<><div className="panel" style={{padding:20,marginBottom:16}}><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><span className="eyebrow">{selected.codigo}</span><h2 style={{margin:'8px 0',color:'#173b59'}}>{enterpriseName(selected.empreendimento_id)}</h2><p className="muted">{TYPES.find(x=>x[0]===selected.tipo)?.[1]} · {selected.data_inspecao} · {selected.inspetor_nome||'Inspetor não indicado'}</p><p>{selected.objetivo||'Sem objetivo indicado.'}</p></div><span className="pill">{selected.estado==='concluida'?'Concluída':selected.estado==='em_curso'?'Em curso':'Em preparação'}</span></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginTop:16}}><div className="stat"><span>Cobertura</span><strong>{counts.done}/{counts.total}</strong><small>{counts.total?Math.round(counts.done/counts.total*100):0}% concluída</small></div><div className="stat"><span>Por avaliar</span><strong>{counts.pending}</strong></div><div className="stat"><span>EC máximo registado</span><strong>{ecMax===null?'—':'EC '+ecMax}</strong></div><div className="stat"><span>EC médio</span><strong>{ecMean}</strong></div></div><div style={{height:8,background:'#e7edf2',borderRadius:10,overflow:'hidden',marginTop:14}}><div style={{height:'100%',width:(counts.total?counts.done/counts.total*100:0)+'%',background:'#23845d',transition:'width .2s'}}/></div></div>
   <div className="panel table" style={{marginBottom:16}}><div className="panelhead"><div><h3>Lista de cobertura da inspeção</h3><span>Todos os elementos do ativo selecionado, incluindo a hierarquia completa</span></div></div><div className="thead"><span>Elemento</span><span>Tipo</span><span>Estado da inspeção</span><span>Patologias</span><span></span></div>{coverage.length?coverage.map(item=>{const rec=recordByItem[item.id];const depth=item.elemento_tipo==='ativo'?0:(()=>{let d=1,p=item.componente_pai_id,guard=0;while(p&&guard++<20){const parent=coverage.find(x=>x.componente_id===p);if(!parent)break;d++;p=parent.componente_pai_id}return d})();return <div className="trow" key={item.id} style={{cursor:selected.estado!=='concluida'?'pointer':'default'}} onClick={()=>selected.estado!=='concluida'&&chooseItem(item)}><strong style={{paddingLeft:depth*14}}>{item.elemento_tipo==='ativo'?'▣ ':'↳ '}{itemName(item)}</strong><span>{item.elemento_tipo==='ativo'?'Ativo':depth>1?'Subcomponente':'Componente'}</span><span>{statusLabel(item.estado_cobertura)}{item.justificacao?<small>{item.justificacao}</small>:null}</span><span>{rec?'Avaliado — sem patologia registada':'—'}</span><span>{selected.estado!=='concluida'?<button type="button" className="secondary" onClick={e=>{e.stopPropagation();chooseItem(item)}}>{rec?'Editar':'Avaliar'}</button>:null}</span></div>}) : <p className="empty">Esta inspeção não tem cobertura criada. Não pode ser concluída; será necessário criar uma nova inspeção com inventário associado.</p>}</div>
   {activeItem&&selected.estado!=='concluida'&&<form className="panel" onSubmit={saveRecord} style={{padding:20,marginBottom:16}}><h3>Avaliar elemento</h3><p><strong>{itemName(activeItem)}</strong></p><p className="muted">Se não forem encontradas anomalias, basta guardar a avaliação. Não é necessário criar uma patologia.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}><div><label style={label}>Estado de manutenção</label><select style={field} value={detailForm.estado_manutencao} onChange={e=>setDetailForm(v=>({...v,estado_manutencao:e.target.value}))}><option value="">Não avaliado</option>{MAINTENANCE.map(x=><option key={x}>{x}</option>)}</select></div><div><label style={label}>Estado de conservação (EC)</label><select style={field} value={detailForm.classe_estado_conservacao} onChange={e=>setDetailForm(v=>({...v,classe_estado_conservacao:e.target.value}))}><option value="">Não avaliado</option>{[0,1,2,3,4,5].map(x=><option key={x} value={x}>EC {x}</option>)}</select></div></div><label style={label}>Observações</label><textarea rows="3" style={field} value={detailForm.observacoes} onChange={e=>setDetailForm(v=>({...v,observacoes:e.target.value}))} placeholder="Descreve o estado observado…"/><label style={{...label,display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={detailForm.requer_atencao} onChange={e=>setDetailForm(v=>({...v,requer_atencao:e.target.checked}))}/> Requer atenção / acompanhamento</label><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:16}}><button className="primary" type="submit" disabled={saving}><Save size={16}/> {saving?'A guardar…':'Guardar avaliação'}</button><button type="button" className="secondary" disabled={saving} onClick={()=>markException('inacessivel')}>Inacessível</button><button type="button" className="secondary" disabled={saving} onClick={()=>markException('nao_aplicavel')}>Não aplicável</button><button type="button" className="secondary" onClick={()=>setActiveItem(null)}>Cancelar</button></div></form>}
   {selected.estado!=='concluida'&&<div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}><button className="primary" disabled={saving||counts.pending>0||!counts.total} onClick={complete}><ClipboardCheck size={16}/> Concluir inspeção ({counts.done}/{counts.total})</button></div>}
  </>}
  {formOpen&&<div role="presentation" onClick={()=>setFormOpen(false)} style={{position:'fixed',inset:0,zIndex:2200,background:'rgba(10,28,44,.58)',display:'grid',placeItems:'center',padding:18}}><form onSubmit={createInspection} onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:18,padding:22,boxSizing:'border-box'}}><h2 style={{color:'#173b59'}}>Nova inspeção</h2><label style={label}>Empreendimento *</label><select required style={field} value={form.empreendimento_id} onChange={async e=>{const id=e.target.value;setForm(v=>({...v,empreendimento_id:id,ativo_id:''}));try{await loadInventory(id)}catch(err){setError(err?.message||'Erro ao carregar ativos')}}}><option value="">Selecionar empreendimento</option>{enterprises.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select><label style={label}>Ativo a inspecionar *</label><select required style={field} value={form.ativo_id} onChange={e=>setForm(v=>({...v,ativo_id:e.target.value}))}><option value="">Selecionar ativo do inventário</option>{assets.map(a=><option key={a.id} value={a.id}>{a.codigo} · {a.nome}</option>)}</select><label style={label}>Tipo de inspeção *</label><select style={field} value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))}>{TYPES.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select><label style={label}>Data *</label><input required type="date" style={field} value={form.data_inspecao} onChange={e=>setForm(v=>({...v,data_inspecao:e.target.value}))}/><label style={label}>Inspetor</label><input style={field} value={form.inspetor_nome} onChange={e=>setForm(v=>({...v,inspetor_nome:e.target.value}))} placeholder="Nome do inspetor"/><label style={label}>Objetivo</label><textarea rows="2" style={field} value={form.objetivo} onChange={e=>setForm(v=>({...v,objetivo:e.target.value}))}/><label style={label}>Observações</label><textarea rows="2" style={field} value={form.observacoes} onChange={e=>setForm(v=>({...v,observacoes:e.target.value}))}/><div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}><button type="button" className="secondary" onClick={()=>setFormOpen(false)}>Cancelar</button><button type="submit" className="primary" disabled={saving||!assets.length}>{saving?'A criar…':'Criar inspeção e carregar inventário'}</button></div></form></div>}
  {!enterprises.length&&!selected&&<div className="panel" style={{padding:18,marginTop:14}}>Não existem empreendimentos disponíveis para a tua conta. Confirma as permissões da entidade responsável.</div>}
 </section>;
}
const label={display:'block',fontWeight:700,color:'#23415b',marginTop:13,fontSize:13};
const field={width:'100%',boxSizing:'border-box',padding:11,marginTop:6,marginBottom:10,border:'1px solid #cad8e5',borderRadius:9,background:'#fff',color:'#23415b',fontSize:14};
