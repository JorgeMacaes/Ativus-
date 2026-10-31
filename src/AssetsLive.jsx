import React,{useCallback,useEffect,useState} from 'react';
import {Plus,RefreshCw,Search,AlertTriangle,ArrowLeft} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const TYPES=['Edifício','Ponte','Estrada','Infraestrutura','Equipamento','Instalação técnica','Outro'];
const EMPTY={nome:'',tipo:'Edifício',localizacao:'',descricao:'',fabricante:'',modelo:''};

export default function AssetsLive(){
 const [entities,setEntities]=useState([]),[rows,setRows]=useState([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[message,setMessage]=useState('');
 const [formOpen,setFormOpen]=useState(false),[form,setForm]=useState(EMPTY);
 const [selected,setSelected]=useState(null),[query,setQuery]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setError('A ligação à base de dados não está configurada.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();
   if(userError)throw userError;
   if(!userData?.user)throw new Error('Inicia sessão para consultar os ativos.');
   const {data:members,error:memberError}=await supabase.from('membros_entidade').select('entidade_id').eq('utilizador_id',userData.user.id).eq('ativo',true);
   if(memberError)throw memberError;
   const ids=[...new Set((members||[]).map(x=>x.entidade_id))];
   if(!ids.length)throw new Error('A conta não tem uma entidade gestora ativa associada.');
   const [entityResult,assetResult]=await Promise.all([
    supabase.from('entidades').select('id,nome').eq('ativa',true).in('id',ids).order('nome'),
    supabase.from('ativos').select('id,entidade_id,empreendimento_id,codigo,nome,tipo,descricao,localizacao,estado,estado_manutencao,classe_estado_conservacao,fabricante,modelo,criado_em').order('nome')
   ]);
   if(entityResult.error)throw entityResult.error;
   if(assetResult.error)throw assetResult.error;
   setEntities(entityResult.data||[]);setRows(assetResult.data||[]);
  }catch(e){setError(e?.message||'Não foi possível carregar os ativos.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{load();},[load]);
 const create=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();
   if(userError)throw userError;
   if(!userData?.user)throw new Error('A sessão expirou. Inicia sessão novamente.');
   if(!entities.length)throw new Error('Não existe uma entidade gestora disponível.');
   const entityId=entities.length===1?entities[0].id:form.entidade_id;
   if(!entityId)throw new Error('Seleciona a entidade gestora do ativo.');
   const codigo='ATV-'+Date.now().toString().slice(-9);
   const payload={entidade_id:entityId,empreendimento_id:null,codigo,nome:form.nome.trim(),tipo:form.tipo,localizacao:form.localizacao.trim()||null,descricao:form.descricao.trim()||null,fabricante:form.fabricante.trim()||null,modelo:form.modelo.trim()||null,criado_por:userData.user.id};
   const {data,error:insertError}=await supabase.from('ativos').insert(payload).select('id,entidade_id,empreendimento_id,codigo,nome,tipo,descricao,localizacao,estado,estado_manutencao,classe_estado_conservacao,fabricante,modelo,criado_em').single();
   if(insertError)throw insertError;
   setRows(v=>[...v,data].sort((a,b)=>a.nome.localeCompare(b.nome)));
   setForm(EMPTY);setFormOpen(false);setMessage('Ativo criado e associado diretamente à entidade gestora.');
  }catch(e){setError(e?.message||'Não foi possível criar o ativo.');}
  finally{setSaving(false);}
 };
 const visible=rows.filter(a=>(a.nome+' '+a.codigo+' '+(a.localizacao||'')+' '+a.tipo).toLocaleLowerCase('pt-PT').includes(query.toLocaleLowerCase('pt-PT')));
 const entityName=id=>entities.find(x=>x.id===id)?.nome||'Entidade gestora';
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar ativos da base de dados…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">{selected?selected.nome:'Ativos / Inventário'}</h2><p className="muted">Cada ativo pertence diretamente à sua entidade gestora. O agrupamento por empreendimento é opcional.</p></div>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{selected?<button className="secondary" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> Voltar</button>:<><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button><button className="primary" onClick={()=>{setForm({...EMPTY,entidade_id:entities.length===1?entities[0].id:''});setFormOpen(true);}}><Plus size={17}/> Novo ativo</button></>}</div>
  </div>
  {error&&<div className="panel" role="alert" style={{padding:14,marginBottom:14,color:'#8f1d1d'}}><AlertTriangle size={17}/> {error}</div>}
  {message&&<div className="panel" role="status" style={{padding:14,marginBottom:14,color:'#176344'}}>{message}</div>}
  {selected?<div className="panel" style={{padding:20,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}>
   <div><small className="muted">Código</small><p><strong>{selected.codigo}</strong></p></div><div><small className="muted">Entidade gestora</small><p><strong>{entityName(selected.entidade_id)}</strong></p></div><div><small className="muted">Tipo</small><p><strong>{selected.tipo}</strong></p></div><div><small className="muted">Localização</small><p><strong>{selected.localizacao||'Não indicada'}</strong></p></div><div><small className="muted">Estado</small><p><strong>{selected.estado||'Ativo'}</strong></p></div><div><small className="muted">Manutenção</small><p><strong>{selected.estado_manutencao||'Por avaliar'}</strong></p></div><div><small className="muted">Fabricante / Modelo</small><p><strong>{[selected.fabricante,selected.modelo].filter(Boolean).join(' · ')||'Não indicado'}</strong></p></div><div style={{gridColumn:'1/-1'}}><small className="muted">Descrição</small><p>{selected.descricao||'Sem descrição registada.'}</p></div><div style={{gridColumn:'1/-1'}}><small className="muted">Agrupamento</small><p>{selected.empreendimento_id?'Associado a empreendimento':'Ativo autónomo, sem empreendimento'}</p></div>
  </div>:<><div className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar ativo, local ou código…"/></div><span className="muted">{visible.length} ativo(s)</span></div><div className="panel table"><div className="thead"><span>Ativo / Código</span><span>Entidade gestora</span><span>Localização</span><span>Tipo</span><span></span></div>{visible.length?visible.map(a=><div className="trow" key={a.id}><div><strong>{a.nome}</strong><small>{a.codigo}</small></div><span>{entityName(a.entidade_id)}</span><span>{a.localizacao||'—'}</span><span>{a.tipo}</span><span><button type="button" className="secondary" onClick={()=>setSelected(a)}>+ Info</button></span></div>):<p className="empty">{rows.length?'Não foram encontrados ativos para esta pesquisa.':'Ainda não existem ativos registados. Selecione «Novo ativo» para começar.'}</p>}</div></>}
  {formOpen&&<div role="presentation" onClick={()=>setFormOpen(false)} style={{position:'fixed',inset:0,zIndex:2300,background:'rgba(10,28,44,.58)',display:'grid',placeItems:'center',padding:18}}><form onSubmit={create} onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:18,padding:22,boxSizing:'border-box'}}>
   <span className="eyebrow">INVENTÁRIO</span><h2 style={{margin:'8px 0',color:'#173b59'}}>Registar novo ativo</h2><p className="muted">O ativo será associado diretamente à entidade gestora, sem exigir a criação de um empreendimento.</p>
   {entities.length>1&&<><label style={{display:'block',marginTop:14,fontWeight:700}}>Entidade gestora *</label><select required value={form.entidade_id||''} onChange={e=>setForm(v=>({...v,entidade_id:e.target.value}))} style={{width:'100%',padding:12,marginTop:6,border:'1px solid #cad8e5',borderRadius:9,background:'#fff'}}><option value="">Selecionar entidade</option>{entities.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></>}
   <label style={{display:'block',marginTop:14,fontWeight:700}}>Designação do ativo *</label><input required maxLength={180} value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Edifício sede, Ponte, Elevador…" style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9}}/>
   <label style={{display:'block',marginTop:14,fontWeight:700}}>Tipo de ativo *</label><select required value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))} style={{width:'100%',padding:12,marginTop:6,border:'1px solid #cad8e5',borderRadius:9,background:'#fff'}}>{TYPES.map(x=><option key={x}>{x}</option>)}</select>
   {['localizacao','fabricante','modelo'].map((k,i)=><div key={k}><label style={{display:'block',marginTop:14,fontWeight:700}}>{['Localização','Fabricante','Modelo'][i]}</label><input value={form[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))} style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9}}/></div>)}
   <label style={{display:'block',marginTop:14,fontWeight:700}}>Descrição</label><textarea rows={3} value={form.descricao} onChange={e=>setForm(v=>({...v,descricao:e.target.value}))} style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9}}/>
   <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}><button type="button" className="secondary" onClick={()=>setFormOpen(false)}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?'A guardar…':'Guardar ativo'}</button></div>
  </form></div>}
 </section>;
}
