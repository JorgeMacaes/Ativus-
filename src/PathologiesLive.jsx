import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {RefreshCw,Search,AlertTriangle,ClipboardList,ArrowLeft,Link2,Plus} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const severityLabel=v=>v===5?'Crítica':v===4?'Alta':v===3?'Moderada':v===2?'Baixa':v===1?'Reduzida':v===0?'Sem gravidade avaliada':'Por avaliar';
const statusLabel=v=>({identificada:'Identificada',em_analise:'Em análise',planeada:'Intervenção planeada',em_tratamento:'Em tratamento',resolvida:'Resolvida',encerrada:'Encerrada'}[v]||v||'—');
export default function PathologiesLive(){
 const [rows,setRows]=useState([]),[workOrders,setWorkOrders]=useState([]),[enterprises,setEnterprises]=useState([]),[assets,setAssets]=useState([]),[components,setComponents]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[filter,setFilter]=useState(''),[selected,setSelected]=useState(null),[creatingWork,setCreatingWork]=useState(false),[message,setMessage]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setError('A ligação ao Supabase não está configurada.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:u,error:ue}=await supabase.auth.getUser();if(ue)throw ue;if(!u?.user)throw new Error('Inicia sessão para consultar as patologias.');
   const {data:m,error:me}=await supabase.from('membros_entidade').select('entidade_id').eq('utilizador_id',u.user.id).eq('ativo',true);if(me)throw me;
   const ids=[...new Set((m||[]).map(x=>x.entidade_id))];if(!ids.length)throw new Error('A conta não tem entidades ativas associadas.');
   const [e,a,c,p]=await Promise.all([
    supabase.from('empreendimentos').select('id,nome,codigo,entidade_id').in('entidade_id',ids).order('nome'),
    supabase.from('ativos').select('id,empreendimento_id,codigo,nome').order('nome'),
    supabase.from('componentes').select('id,empreendimento_id,ativo_id,codigo,nome').order('nome'),
    supabase.from('patologias').select('*').order('identificada_em',{ascending:false})
   ]);
   if(e.error||a.error||c.error||p.error)throw e.error||a.error||c.error||p.error;
   const pathologyIds=(p.data||[]).map(x=>x.id);let linked=[];if(pathologyIds.length){const {data:w,error:we}=await supabase.from('trabalhos').select('id,codigo,descricao,estado,patologia_id').in('patologia_id',pathologyIds).order('criado_em',{ascending:false});if(we)throw we;linked=w||[];}
   setEnterprises(e.data||[]);setAssets(a.data||[]);setComponents(c.data||[]);setRows(p.data||[]);setWorkOrders(linked);
  }catch(err){setError(err?.message||'Não foi possível carregar as patologias.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{load()},[load]);
 const createCorrectiveWork=async()=>{
  if(!selected)return;
  setCreatingWork(true);setError('');setMessage('');
  try{
   const {data:u,error:ue}=await supabase.auth.getUser();if(ue)throw ue;if(!u?.user)throw new Error('Sessão expirada.');
   const priority=selected.gravidade>=5?'critica':selected.gravidade>=4?'alta':selected.gravidade>=3?'moderada':'baixa';
   const description=['Intervenção corretiva associada à patologia '+selected.codigo,selected.tipo,selected.caracterizacao,selected.causa?'Causa: '+selected.causa:null,selected.consequencia?'Consequência: '+selected.consequencia:null].filter(Boolean).join(' — ');
   const code='OT-'+new Date().toISOString().replace(/[-:T.Z]/g,'').slice(0,14);
   const {data,error:e}=await supabase.from('trabalhos').insert({entidade_id:selected.entidade_id,empreendimento_id:selected.empreendimento_id||null,patologia_id:selected.id,ativo_id:selected.ativo_id||null,componente_id:selected.componente_id||null,codigo:code,descricao:description,tipo:'corretivo',prioridade:priority,estado:'por_planear',origem_planeamento:'patologia',criado_por:u.user.id}).select('id,codigo').single();
   if(e)throw e;
   setMessage('Ordem '+data.codigo+' criada e associada à patologia.');await load();
  }catch(e){setError(e.message||'Não foi possível criar a ordem de trabalho.');}
  finally{setCreatingWork(false);}
 };
 const enterpriseName=id=>enterprises.find(x=>x.id===id)?.nome||'Empreendimento';
 const assetName=id=>assets.find(x=>x.id===id)?.nome||'';
 const componentName=id=>components.find(x=>x.id===id)?.nome||'';
 const visible=useMemo(()=>rows.filter(p=>([p.codigo,p.tipo,p.caracterizacao,p.material,p.causa,p.consequencia,p.estado,enterpriseName(p.empreendimento_id),assetName(p.ativo_id),componentName(p.componente_id)].filter(Boolean).join(' ')).toLowerCase().includes(filter.toLowerCase())),[rows,filter,enterprises,assets,components]);
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar patologias…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">Patologias</h2><p className="muted">Registos técnicos validados, provenientes de inspeções ou ocorrências.</p></div><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button></div>
  {message&&<div className="panel" role="status" style={{padding:12,marginBottom:12,color:'#176344'}}>{message}</div>}
  {error&&<div className="panel" role="alert" style={{padding:14,marginBottom:14,color:'#8f1d1d',borderLeft:'4px solid #b42318'}}><AlertTriangle size={17}/> {error}</div>}
  <div className="search" style={{marginBottom:14}}><Search size={18}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Pesquisar código, patologia, material ou empreendimento…"/></div>
  {selected?<><button className="back" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> Voltar às patologias</button><div className="panel" style={{padding:20}}><span className="eyebrow">{selected.codigo}</span><h2 style={{margin:'8px 0'}}>{selected.tipo}</h2><p>{selected.caracterizacao||'Sem caracterização registada.'}</p><div className="grid2"><p><b>Entidade gestora:</b> {entities.find(x=>x.id===selected.entidade_id)?.nome||'—'}</p><p><b>Agrupamento:</b> {enterpriseName(selected.empreendimento_id)}</p><p><b>Ativo:</b> {assetName(selected.ativo_id)||'Não associado'}</p><p><b>Componente:</b> {componentName(selected.componente_id)||'Não associado'}</p><p><b>Material:</b> {selected.material||'Não indicado'}</p><p><b>Causa:</b> {selected.causa||'Por determinar'}</p><p><b>Efeito / consequência:</b> {selected.consequencia||'Por determinar'}</p><p><b>Gravidade:</b> {severityLabel(selected.gravidade)}</p><p><b>Prioridade:</b> {selected.prioridade||'Por definir'}</p><p><b>Estado:</b> {statusLabel(selected.estado)}</p><p><b>Data:</b> {selected.identificada_em?new Date(selected.identificada_em+'T00:00:00').toLocaleDateString('pt-PT'):'—'}</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}><button type="button" className="primary" disabled={creatingWork||['resolvida','encerrada'].includes(selected.estado)} onClick={createCorrectiveWork}><Plus size={15}/> {creatingWork?'A criar ordem…':'Criar ordem corretiva'}</button></div>{workOrders.filter(w=>w.patologia_id===selected.id).length>0&&<div className="panel" style={{padding:14,marginTop:12}}><strong>Ordens de trabalho associadas</strong>{workOrders.filter(w=>w.patologia_id===selected.id).map(w=><p key={w.id} style={{margin:'8px 0'}}><b>{w.codigo}</b> · {w.descricao} · {w.estado}</p>)}</div>}{selected.ocorrencia_id&&<div className="panel" style={{padding:14,marginTop:12}}><strong><Link2 size={16}/> Origem: ocorrência comunicada</strong><p className="muted">Esta patologia foi criada a partir de uma ocorrência. Referência: {selected.ocorrencia_id}</p></div>}<p className="muted">{selected.observacoes||'Sem observações adicionais.'}</p></div></>:<div className="panel table"><div className="thead"><span>Código / Patologia</span><span>Empreendimento</span><span>Localização</span><span>Gravidade</span><span>Estado</span><span>Origem</span></div>{visible.length?visible.map(p=><div className="trow" key={p.id} role="button" tabIndex={0} onClick={()=>setSelected(p)} onKeyDown={e=>{if(e.key==='Enter')setSelected(p)}} style={{cursor:'pointer'}}><div><strong>{p.codigo}</strong><small>{p.tipo}{p.caracterizacao?' · '+p.caracterizacao:''}</small></div><span>{enterpriseName(p.empreendimento_id)}</span><span>{assetName(p.ativo_id)||componentName(p.componente_id)||'—'}</span><span>{severityLabel(p.gravidade)}</span><span>{statusLabel(p.estado)}</span><span>{p.ocorrencia_id?'Ocorrência':p.inspecao_id?'Inspeção':'Técnica'}</span></div>):<p className="empty">{rows.length?'Não foram encontradas patologias com estes critérios.':'Ainda não existem patologias registadas na base de dados.'}</p>}</div>}
  <p className="muted"><ClipboardList size={14}/> {visible.length} registo(s) apresentado(s) · dados sincronizados com o Supabase.</p>
 </section>;
}