import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ProcessingMark} from './ProcessingMark.jsx';
import {Building2,ClipboardCheck,AlertTriangle,ShieldCheck,ChevronRight,RefreshCw,Activity} from 'lucide-react';
import {supabase} from './lib/supabase.js';

export default function AtivusDashboard({onAssets=()=>{}}){
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[assets,setAssets]=useState([]),[inspections,setInspections]=useState([]),[pathologies,setPathologies]=useState([]);
 const load=useCallback(async()=>{
  if(!supabase){setError('A ligação ao Supabase não está configurada.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!userData?.user)throw new Error('Inicia sessão para consultar o Dashboard.');
   const {data:members,error:memberError}=await supabase.from('membros_entidade').select('entidade_id').eq('utilizador_id',userData.user.id).eq('ativo',true);if(memberError)throw memberError;
   const ids=[...new Set((members||[]).map(x=>x.entidade_id))];
   if(!ids.length){setAssets([]);setInspections([]);setPathologies([]);return;}
   const [a,i,p]=await Promise.all([
    supabase.from('ativos').select('id,codigo,nome,tipo,localizacao,classe_estado_conservacao,estado').in('entidade_id',ids).order('criado_em',{ascending:false}),
    supabase.from('inspecoes').select('id,codigo,tipo,data_inspecao,inspetor_nome,estado,ativo_id').in('entidade_id',ids).order('data_inspecao',{ascending:false}),
    supabase.from('patologias').select('id,codigo,tipo,gravidade,estado,ativo_id').in('entidade_id',ids)
   ]);
   if(a.error)throw a.error;if(i.error)throw i.error;if(p.error)throw p.error;
   setAssets(a.data||[]);setInspections(i.data||[]);setPathologies(p.data||[]);
  }catch(e){setError(e?.message||'Não foi possível carregar os indicadores do Dashboard.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{load();},[load]);
 const ecCounts=useMemo(()=>[0,1,2,3,4,5].map(ec=>({ec,value:assets.filter(a=>a.classe_estado_conservacao!==null&&a.classe_estado_conservacao!==undefined&&Number(a.classe_estado_conservacao)===ec).length})),[assets]);
 const severity=useMemo(()=>[{label:'Crítica · EC5',value:pathologies.filter(p=>Number(p.gravidade)===5).length,cls:'sevcritical'},{label:'Alta · EC4',value:pathologies.filter(p=>Number(p.gravidade)===4).length,cls:'sevhigh'},{label:'Moderada · EC3',value:pathologies.filter(p=>Number(p.gravidade)===3).length,cls:'sevmedium'},{label:'Baixa · EC0–2',value:pathologies.filter(p=>p.gravidade!==null&&p.gravidade!==undefined&&Number(p.gravidade)<=2).length,cls:'sevlow'}],[pathologies]);
 const open=pathologies.filter(p=>!['encerrada','verificada'].includes(p.estado)).length;
 const recent=inspections.slice(0,4),maxEC=Math.max(1,...ecCounts.map(x=>x.value)),maxSeverity=Math.max(1,...severity.map(x=>x.value));
 const assetName=id=>assets.find(a=>a.id===id)?.nome||'Ativo sem identificação';
 if(loading)return <section className="content"><div className="panel"><ProcessingMark message="A carregar indicadores do Dashboard…"/></div></section>;
 return <section className="content">
  <div className="hero"><div><span className="pill">Dashboard · dados partilhados</span><h2>Visão global dos ativos</h2><p>Indicadores atualizados a partir do inventário, inspeções e patologias da Entidade Gestora.</p></div></div>
  {error&&<div className="panel" role="alert" style={{padding:14,marginTop:14,color:'#8f1d1d'}}>{error}</div>}
  <div className="stats"><Stat icon={Building2} label="Ativos registados" value={assets.length}/><Stat icon={ClipboardCheck} label="Inspeções registadas" value={inspections.length}/><Stat icon={AlertTriangle} label="Patologias por tratar" value={open}/><Stat icon={ShieldCheck} label="Ativos em EC5" value={assets.filter(a=>Number(a.classe_estado_conservacao)===5).length}/></div>
  <div className="dashgrid">
   <div className="panel chartpanel"><div className="panelhead"><div><h3>Estado de conservação dos ativos</h3><span>Distribuição por classe EC</span></div><span className="charttag">Inventário</span></div>
    <div className="ecbars">{ecCounts.map(item=><div className="ecbar" key={item.ec}><div className="ecbartrack"><div className={'ecbarfill ecfill'+item.ec} style={{height:(item.value/maxEC*100)+'%'}}/><span>{item.value}</span></div><small>EC {item.ec}</small></div>)}</div>
    <div className="chartnote">Total analisado: <b>{ecCounts.reduce((n,x)=>n+x.value,0)}</b> ativos com classificação registada.</div>
   </div>
   <div className="panel chartpanel"><div className="panelhead"><div><h3>Patologias por gravidade</h3><span>Classificação atual dos registos</span></div><span className="charttag">Patologias</span></div>
    <div className="severitybars">{severity.map(item=><div key={item.label}><div className="severitylabel"><span>{item.label}</span><b>{item.value}</b></div><div className="severitytrack"><div className={'severityfill '+item.cls} style={{width:(item.value/maxSeverity*100)+'%'}}/></div></div>)}</div>
    <div className="chartnote">Patologias registadas: <b>{pathologies.length}</b>.</div>
   </div>
   <div className="panel chartpanel"><div className="panelhead"><div><h3>Atividade de inspeção</h3><span>Registos mais recentes</span></div></div>
    {recent.length?recent.map(i=><div className="inspectionrow" key={i.id}><div className="datebox">{String(i.data_inspecao).slice(8,10)}<small>{String(i.data_inspecao).slice(5,7)}</small></div><div><strong>{i.tipo} · {i.codigo}</strong><span>{assetName(i.ativo_id)} · {i.inspetor_nome||'Inspetor não indicado'}</span></div><span className="badge">{i.estado}</span></div>):<p className="empty">Ainda não existem inspeções registadas.</p>}
   </div>
   <div className="panel chartpanel"><div className="panelhead"><div><h3>Ativos recentes</h3><span>Resumo do inventário</span></div><button className="textbtn" onClick={onAssets}>Ver inventário <ChevronRight size={15}/></button></div>
    {assets.slice(0,4).map(a=><button className="assetrow" key={a.id} onClick={onAssets}><div className="assetavatar"><Building2 size={19}/></div><div><strong>{a.nome}</strong><span>{a.codigo} · {a.localizacao||a.tipo}</span></div><span className="ec">EC {a.classe_estado_conservacao??'—'}</span><ChevronRight size={17}/></button>)}
    {!assets.length&&<p className="empty">Ainda não existem ativos no inventário.</p>}
   </div>
  </div>
  <div className="dashfoot"><Activity size={17}/><span><b>Proteção de dados:</b> A ATIVUS, com tecnologia Seven M, assegura que a informação é disponibilizada apenas a utilizadores autorizados, de acordo com as permissões da respetiva Entidade Gestora.</span><button className="textbtn" onClick={load}><RefreshCw size={15}/> Atualizar</button></div>
 </section>;
}
function Stat({icon:Icon,label,value}){return <div className="stat"><div className="staticon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong></div></div>}
