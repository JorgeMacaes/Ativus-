import React,{useCallback,useEffect,useState} from 'react';
import {supabase} from './lib/supabase.js';
import {Upload,RefreshCw,FileText,Download,Trash2} from 'lucide-react';

const BUCKET='ativus-ai-documentos';
const empty={empreendimento_id:'',ativo_id:'',componente_id:'',inspecao_id:'',patologia_id:'',trabalho_id:'',nome:'',categoria:'projeto',descricao:''};
const categories=[['projeto','Projeto'],['desenho','Desenho / Peça desenhada'],['relatorio','Relatório'],['certificado','Certificado'],['manual','Manual técnico'],['fotografia','Fotografia'],['contrato','Contrato'],['outro','Outro']];
export default function TechnicalDocuments(){
 const [projects,setProjects]=useState([]),[assets,setAssets]=useState([]),[components,setComponents]=useState([]),[rows,setRows]=useState([]);
 const [form,setForm]=useState(empty),[file,setFile]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setError('Supabase não está configurado.');setLoading(false);return}
  setLoading(true);setError('');
  try{
   const {data:u,error:ue}=await supabase.auth.getUser();if(ue)throw ue;if(!u?.user)throw new Error('Inicia sessão para consultar a documentação.');
   const {data:m,error:me}=await supabase.from('membros_entidade').select('entidade_id').eq('utilizador_id',u.user.id).eq('ativo',true);if(me)throw me;
   const ids=[...new Set((m||[]).map(x=>x.entidade_id))];if(!ids.length)throw new Error('Não existem entidades associadas à conta.');
   const {data:p,error:pe}=await supabase.from('empreendimentos').select('id,nome,entidade_id').in('entidade_id',ids).eq('ativo',true).order('nome');if(pe)throw pe;
   setProjects(p||[]);
   const {data:d,error:de}=await supabase.from('documentos_tecnicos').select('id,empreendimento_id,ativo_id,componente_id,inspecao_id,patologia_id,trabalho_id,nome,categoria,descricao,caminho_storage,mime_type,tamanho_bytes,estado,criado_em').order('criado_em',{ascending:false}).limit(500);if(de)throw de;
   setRows(d||[]);
  }catch(e){setError(e.message||'Não foi possível carregar a documentação.')}finally{setLoading(false)}
 },[]);
 useEffect(()=>{load()},[load]);
 const loadInventory=async id=>{
  setForm(v=>({...v,empreendimento_id:id,ativo_id:'',componente_id:''}));
  if(!id){setAssets([]);setComponents([]);return}
  const [a,c]=await Promise.all([supabase.from('ativos').select('id,codigo,nome').eq('empreendimento_id',id).order('nome'),supabase.from('componentes').select('id,codigo,nome,ativo_id').eq('empreendimento_id',id).order('nome')]);
  if(a.error||c.error){setError(a.error?.message||c.error?.message);return}
  setAssets(a.data||[]);setComponents(c.data||[]);
 };
 const upload=async e=>{
  e.preventDefault();if(!file||!form.empreendimento_id||!form.nome.trim())return;
  setSaving(true);setError('');setMessage('');
  let path='';
  try{
   const {data:u,error:ue}=await supabase.auth.getUser();if(ue)throw ue;
   const safe=file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-140);
   path=form.empreendimento_id+'/'+Date.now()+'_'+safe;
   const {error:se}=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});if(se)throw se;
   const payload={...form,nome:form.nome.trim(),descricao:form.descricao.trim()||null,ativo_id:form.ativo_id||null,componente_id:form.componente_id||null,inspecao_id:form.inspecao_id||null,patologia_id:form.patologia_id||null,trabalho_id:form.trabalho_id||null,caminho_storage:path,mime_type:file.type||null,tamanho_bytes:file.size,carregado_por:u?.user?.id||null};
   const {error:ie}=await supabase.from('documentos_tecnicos').insert(payload);if(ie){await supabase.storage.from(BUCKET).remove([path]);throw ie}
   setFile(null);setForm({...empty,empreendimento_id:form.empreendimento_id});setMessage('Documento arquivado e associado ao empreendimento.');await load();
  }catch(e){setError(e.message||'Falha ao arquivar o documento.')}finally{setSaving(false)}
 };
 const openFile=async row=>{
  const {data,error:e}=await supabase.storage.from(BUCKET).createSignedUrl(row.caminho_storage,300);
  if(e){setError(e.message);return}if(data?.signedUrl)window.open(data.signedUrl,'_blank','noopener,noreferrer');
 };
 const remove=async row=>{
  if(!window.confirm('Eliminar este registo documental e o respetivo ficheiro?'))return;
  setError('');
  const {error:de}=await supabase.from('documentos_tecnicos').delete().eq('id',row.id);if(de){setError(de.message);return}
  const {error:se}=await supabase.storage.from(BUCKET).remove([row.caminho_storage]);if(se)setMessage('Registo eliminado; o ficheiro ficou por remover: '+se.message);else setMessage('Documento eliminado.');
  await load();
 };
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar documentação…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">Arquivo técnico central</h2><p className="muted">Documentos privados associados a empreendimentos, ativos, componentes, inspeções, patologias e trabalhos.</p></div><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button></div>
  {error&&<div className="panel" role="alert" style={{padding:13,marginBottom:12,color:'#9b2525'}}>{error}</div>}
  {message&&<div className="panel" role="status" style={{padding:13,marginBottom:12,color:'#176344'}}>{message}</div>}
  <form className="panel" onSubmit={upload} style={{padding:18,marginBottom:18}}>
   <h3><Upload size={17}/> Arquivar novo documento</h3>
   <div className="grid2">
    <label>Empreendimento *<select required value={form.empreendimento_id} onChange={e=>loadInventory(e.target.value)}><option value="">Selecionar</option>{projects.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
    <label>Categoria<select value={form.categoria} onChange={e=>setForm(v=>({...v,categoria:e.target.value}))}>{categories.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    <label>Ativo (opcional)<select value={form.ativo_id} onChange={e=>setForm(v=>({...v,ativo_id:e.target.value,componente_id:''}))}><option value="">Não associado</option>{assets.map(a=><option key={a.id} value={a.id}>{a.codigo} · {a.nome}</option>)}</select></label>
    <label>Componente (opcional)<select value={form.componente_id} onChange={e=>setForm(v=>({...v,componente_id:e.target.value}))}><option value="">Não associado</option>{components.filter(c=>!form.ativo_id||c.ativo_id===form.ativo_id).map(c=><option key={c.id} value={c.id}>{c.codigo} · {c.nome}</option>)}</select></label>
    <label>Designação do documento *<input required maxLength={200} value={form.nome} onChange={e=>setForm(v=>({...v,nome:e.target.value}))} placeholder="Ex.: Projeto de estruturas"/></label>
    <label>Ficheiro *<input required type="file" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
   </div>
   <label style={{display:'block',marginTop:12}}>Descrição / observações<textarea rows="2" value={form.descricao} onChange={e=>setForm(v=>({...v,descricao:e.target.value}))}/></label>
   <button className="primary" type="submit" disabled={saving||!file||!form.empreendimento_id}>{saving?'A arquivar…':'Arquivar documento'}</button>
  </form>
  <div className="panel table"><div className="thead"><span>Documento</span><span>Empreendimento</span><span>Categoria</span><span>Data</span><span>Ações</span></div>
   {rows.length?rows.map(r=><div className="trow" key={r.id}><div><strong>{r.nome}</strong><small>{r.mime_type||'Ficheiro'} · {r.tamanho_bytes?Math.round(r.tamanho_bytes/1024)+' KB':''}</small></div><span>{projects.find(p=>p.id===r.empreendimento_id)?.nome||'—'}</span><span>{categories.find(x=>x[0]===r.categoria)?.[1]||r.categoria}</span><span>{new Date(r.criado_em).toLocaleDateString('pt-PT')}</span><span style={{display:'flex',gap:6}}><button type="button" className="secondary" onClick={()=>openFile(r)} title="Abrir"><Download size={15}/></button><button type="button" className="secondary" onClick={()=>remove(r)} title="Eliminar"><Trash2 size={15}/></button></span></div>):<p className="empty">Ainda não existem documentos arquivados neste registo.</p>}
  </div>
 </section>
}
