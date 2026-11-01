import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {Building2,Plus,RefreshCw,Search,ArrowLeft,Brain,AlertTriangle} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const TYPES=['Edifício multifamiliar','Edifício unifamiliar','Edifício de serviços / escritórios','Edifício comercial','Instalação industrial','Infraestrutura rodoviária','Ponte / viaduto','Infraestrutura ferroviária','Infraestrutura hidráulica','Equipamento público','Equipamento técnico','Outro'];

export default function AtivusInventory({onOpenAI=()=>{}}){
 const [entities,setEntities]=useState([]),[projects,setProjects]=useState([]),[assets,setAssets]=useState([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [query,setQuery]=useState(''),[formOpen,setFormOpen]=useState(false),[selected,setSelected]=useState(null),[components,setComponents]=useState([]);
 const [form,setForm]=useState({entidade_id:'',empreendimento_id:'',nome:'',tipo:TYPES[0],morada:'',localizacao_detalhada:''});
 const load=useCallback(async()=>{
  if(!supabase){setError('A ligação ao Supabase não está configurada.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();
   if(userError)throw userError;
   if(!userData?.user)throw new Error('Inicia sessão para consultar o inventário.');
   const {data:members,error:memberError}=await supabase.from('membros_entidade').select('entidade_id').eq('utilizador_id',userData.user.id).eq('ativo',true);
   if(memberError)throw memberError;
   const ids=[...new Set((members||[]).map(x=>x.entidade_id))];
   if(!ids.length)throw new Error('A tua conta não está associada a nenhuma entidade gestora ativa.');
   const [er,pr,ar]=await Promise.all([
    supabase.from('entidades').select('id,nome').eq('ativa',true).in('id',ids).order('nome'),
    supabase.from('empreendimentos').select('id,entidade_id,nome,codigo').eq('ativo',true).in('entidade_id',ids).order('nome'),
    supabase.from('ativos').select('id,entidade_id,empreendimento_id,codigo,nome,tipo,morada,estado,classe_ec,atributos,criado_em').in('entidade_id',ids).order('nome')
   ]);
   if(er.error)throw er.error;if(pr.error)throw pr.error;if(ar.error)throw ar.error;
   setEntities(er.data||[]);setProjects(pr.data||[]);setAssets(ar.data||[]);
  }catch(e){setError(e?.message||'Não foi possível carregar o inventário.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{load();},[load]);
 const visible=useMemo(()=>assets.filter(a=>([a.codigo,a.nome,a.tipo,a.morada,a.atributos?.localizacao_detalhada].filter(Boolean).join(' ')).toLowerCase().includes(query.toLowerCase())),[assets,query]);
 const entityName=id=>entities.find(x=>x.id===id)?.nome||'Entidade';
 const projectName=id=>projects.find(x=>x.id===id)?.nome||'Sem empreendimento';
 const openAsset=async asset=>{
  setSelected(asset);setComponents([]);setError('');
  const {data,error:e}=await supabase.from('componentes').select('id,codigo,nome,tipo,ativo_id,componente_pai_id').eq('ativo_id',asset.id).order('nome');
  if(e){setError('Ativo aberto, mas não foi possível carregar os componentes: '+e.message);return;}
  setComponents(data||[]);
 };
 const submit=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{
   if(!form.entidade_id)throw new Error('A Entidade Gestora é obrigatória.');
   const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;
   if(!userData?.user)throw new Error('A sessão expirou. Inicia sessão novamente.');
   const project=form.empreendimento_id?projects.find(p=>p.id===form.empreendimento_id):null;
   if(project&&project.entidade_id!==form.entidade_id)throw new Error('O empreendimento selecionado não pertence à entidade gestora escolhida.');
   const codigo='ATV-'+Date.now().toString().slice(-9);
   const payload={entidade_id:form.entidade_id,empreendimento_id:form.empreendimento_id||null,codigo,nome:form.nome.trim(),tipo:form.tipo,morada:form.morada.trim()||null,estado:'ativo',criado_por:userData.user.id,atributos:{localizacao_detalhada:form.localizacao_detalhada.trim()||null}};
   const {data,error:insertError}=await supabase.from('ativos').insert(payload).select('id,entidade_id,empreendimento_id,codigo,nome,tipo,morada,estado,classe_ec,atributos,criado_em').single();
   if(insertError)throw insertError;
   setAssets(v=>[data,...v]);setForm({entidade_id:form.entidade_id,empreendimento_id:'',nome:'',tipo:TYPES[0],morada:'',localizacao_detalhada:''});setFormOpen(false);setMessage('Ativo criado e guardado no inventário partilhado.');
  }catch(e){setError(e?.message||'Não foi possível criar o ativo.');}
  finally{setSaving(false);}
 };
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar inventário partilhado…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">{selected?'Ficha do ativo':'Ativos / Inventário'}</h2><p className="muted">Cada ativo pertence a uma Entidade Gestora. O Empreendimento é um agrupamento opcional.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{selected?<button className="secondary" onClick={()=>setSelected(null)}><ArrowLeft size={16}/> Voltar ao inventário</button>:<><button className="secondary" onClick={onOpenAI}><Brain size={16}/> Inventário Inteligente</button><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button><button className="primary" onClick={()=>setFormOpen(true)} disabled={!entities.length}><Plus size={17}/> Novo Ativo</button></>}</div></div>
  {error&&<div className="panel" role="alert" style={{padding:14,marginBottom:14,color:'#8f1d1d',borderLeft:'4px solid #b42318'}}><AlertTriangle size={17}/> {error}</div>}
  {message&&<div className="panel" role="status" style={{padding:14,marginBottom:14,color:'#176344'}}>{message}</div>}
  {selected?<><div className="panel" style={{padding:20,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}><div><small className="muted">Código</small><p><strong>{selected.codigo}</strong></p></div><div><small className="muted">Nome</small><p><strong>{selected.nome}</strong></p></div><div><small className="muted">Entidade Gestora</small><p><strong>{entityName(selected.entidade_id)}</strong></p></div><div><small className="muted">Empreendimento (opcional)</small><p><strong>{projectName(selected.empreendimento_id)}</strong></p></div><div><small className="muted">Tipo</small><p><strong>{selected.tipo}</strong></p></div><div><small className="muted">Localização</small><p><strong>{selected.morada||'Não indicada'}</strong></p></div><div><small className="muted">Estado de conservação</small><p><strong>{selected.classe_ec===null?'Por avaliar':'EC '+selected.classe_ec}</strong></p></div></div><div className="panel" style={{padding:20,marginTop:16}}><h3>Componentes e subcomponentes</h3>{components.length?components.map(c=><div className="listrow" key={c.id}><div><strong>{c.nome}</strong><span>{c.codigo} · {c.tipo==='subcomponente'?'Subcomponente':'Componente'}</span></div></div>):<p className="empty">Ainda não existem componentes associados a este ativo.</p>}</div></>:<>
   <div className="search" style={{marginBottom:14}}><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar ativo, localização ou código…"/></div>
   <div className="panel table"><div className="thead"><span>Código / Ativo</span><span>Entidade Gestora</span><span>Empreendimento</span><span>Localização</span><span>EC</span></div>{visible.length?visible.map(a=><button className="trow" key={a.id} onClick={()=>openAsset(a)} style={{gridTemplateColumns:'1.5fr 1fr 1fr 1fr .5fr',width:'100%',textAlign:'left'}}><div><strong>{a.nome}</strong><small>{a.codigo} · {a.tipo}</small></div><span>{entityName(a.entidade_id)}</span><span>{projectName(a.empreendimento_id)}</span><span>{a.morada||'—'}</span><span>{a.classe_ec===null?'—':'EC '+a.classe_ec}</span></button>):<p className="empty">{assets.length?'Não foram encontrados ativos com estes critérios.':'Ainda não existem ativos. Cria o primeiro registo no botão «Novo Ativo».'}</p>}</div>
  </>}
  {formOpen&&<div role="presentation" onClick={()=>!saving&&setFormOpen(false)} style={{position:'fixed',inset:0,zIndex:2200,background:'rgba(10,28,44,.58)',display:'grid',placeItems:'center',padding:18}}><form onSubmit={submit} onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:18,padding:22,boxSizing:'border-box'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><span className="eyebrow">ATIVUS · INVENTÁRIO</span><h2 style={{margin:'8px 0',color:'#173b59'}}>Novo Ativo</h2><p className="muted">A Entidade Gestora é obrigatória. O Empreendimento é opcional.</p></div><button type="button" className="secondary" onClick={()=>setFormOpen(false)}>Cancelar</button></div>
   <label style={{display:'block',marginTop:14,fontWeight:700}}>Entidade Gestora *</label><select required value={form.entidade_id} onChange={e=>setForm(v=>({...v,entidade_id:e.target.value,empreendimento_id:''}))} style={{width:'100%',padding:12,marginTop:6,border:'1px solid #cad8e5',borderRadius:9,background:'#fff'}}><option value="">Selecionar entidade</option>{entities.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select>
   <label style={{display:'block',marginTop:14,fontWeight:700}}>Empreendimento (opcional)</label><select value={form.empreendimento_id} onChange={e=>setForm(v=>({...v,empreendimento_id:e.target.value}))} style={{width:'100%',padding:12,marginTop:6,border:'1px solid #cad8e5',borderRadius:9,background:'#fff'}}><option value="">Sem empreendimento associado</option>{projects.filter(p=>p.entidade_id===form.entidade_id).map(x=><option key={x.id} value={x.id}>{x.nome} · {x.codigo}</option>)}</select>
   <label style={{display:'block',marginTop:14,fontWeight:700}}>Nome do ativo *</label><input required maxLength={180} value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Edifício, ponte, equipamento…" style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9}}/>
   <label style={{display:'block',marginTop:14,fontWeight:700}}>Tipo de ativo *</label><select required value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))} style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9,background:'#fff'}}>{TYPES.map(x=><option key={x}>{x}</option>)}</select>
   <label style={{display:'block',marginTop:14,fontWeight:700}}>Morada / Localização</label><input value={form.morada} onChange={e=>setForm(v=>({...v,morada:e.target.value}))} placeholder="Morada ou localidade" style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9}}/>
   <label style={{display:'block',marginTop:14,fontWeight:700}}>Localização detalhada</label><textarea rows={2} value={form.localizacao_detalhada} onChange={e=>setForm(v=>({...v,localizacao_detalhada:e.target.value}))} placeholder="Edifício, piso, zona, referência interna…" style={{width:'100%',padding:12,marginTop:6,boxSizing:'border-box',border:'1px solid #cad8e5',borderRadius:9}}/>
   <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}><button type="button" className="secondary" onClick={()=>setFormOpen(false)}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?'A guardar…':'Guardar Ativo'}</button></div>
  </form></div>}
 </section>;
}
