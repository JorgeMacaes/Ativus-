import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Brain,Upload,RefreshCw,FileText,FolderOpen,AlertTriangle,CheckCircle2,Clock3,HardDrive} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const BUCKET='ativus-ai-documentos';
const MAX_BYTES=250*1024*1024;
const ACCEPT='.pdf,.dwg,.dxf,.dwt,.dwf,.dwfx,.step,.stp,.iges,.igs,.ifc,.rvt,.rfa,.pln,.obj,.stl,.ply,.glb,.gltf,.fbx,.e57,.las,.laz,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.tif,.tiff,.webp';
const TYPES={
 pdf:'Documento PDF',dwg:'CAD 2D/3D',dxf:'CAD 2D/3D',dwt:'Modelo CAD',dwf:'Autodesk DWF',dwfx:'Autodesk DWFx',
 step:'Modelo 3D STEP',stp:'Modelo 3D STEP',iges:'Modelo 3D IGES',igs:'Modelo 3D IGES',ifc:'BIM IFC',
 rvt:'Autodesk Revit',rfa:'Família Revit',pln:'Archicad',obj:'Modelo 3D OBJ',stl:'Modelo 3D STL',
 ply:'Modelo 3D PLY',glb:'Modelo 3D GLB',gltf:'Modelo 3D glTF',fbx:'Modelo 3D FBX',
 e57:'Nuvem de pontos E57',las:'Nuvem de pontos LAS',laz:'Nuvem de pontos LAZ',
 doc:'Documento Word',docx:'Documento Word',xls:'Folha de cálculo Excel',xlsx:'Folha de cálculo Excel',
 csv:'Dados CSV',txt:'Texto',jpg:'Imagem',jpeg:'Imagem',png:'Imagem',tif:'Imagem TIFF',tiff:'Imagem TIFF',webp:'Imagem'
};
const safeName=name=>name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-150);
const formatSize=n=>n<1024*1024?(n/1024).toFixed(0)+' KB':(n/1024/1024).toFixed(1)+' MB';
export default function AtivusAI(){
 const [projects,setProjects]=useState([]),[selected,setSelected]=useState('');
 const [surveys,setSurveys]=useState([]),[documents,setDocuments]=useState([]),[proposals,setProposals]=useState([]),[analyzing,setAnalyzing]=useState('');
 const [title,setTitle]=useState('Novo levantamento técnico'),[description,setDescription]=useState('');
 const [files,setFiles]=useState([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[message,setMessage]=useState('');
 const [parentChoices,setParentChoices]=useState({}),[publishing,setPublishing]=useState('');
 const inputRef=useRef(null);
 const load=useCallback(async()=>{
  if(!supabase){setError('A ligação ao Supabase não está configurada.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();
   if(userError)throw userError;
   if(!userData?.user)throw new Error('Inicia sessão para utilizar o Ativus AI.');
   const {data:members,error:memberError}=await supabase.from('membros_entidade').select('entidade_id').eq('utilizador_id',userData.user.id).eq('ativo',true);
   if(memberError)throw memberError;
   const entityIds=[...new Set((members||[]).map(x=>x.entidade_id))];
   if(!entityIds.length)throw new Error('A conta não tem entidades ativas associadas.');
   const {data:entities,error:entityError}=await supabase.from('entidades').select('id').eq('ativa',true).in('id',entityIds);
   if(entityError)throw entityError;
   const ids=(entities||[]).map(x=>x.id);
   if(!ids.length)throw new Error('Não existem entidades disponíveis para esta conta.');
   const {data:rows,error:projectError}=await supabase.from('empreendimentos').select('id,nome,codigo,entidade_id').eq('ativo',true).in('entidade_id',ids).order('nome');
   if(projectError)throw projectError;
   setProjects(rows||[]);
   setSelected(current=>current&&rows?.some(x=>x.id===current)?current:(rows?.[0]?.id||''));
  }catch(e){setError(e?.message||'Não foi possível carregar os empreendimentos.');}
  finally{setLoading(false);}
 },[]);
 const loadSurveyData=useCallback(async()=>{
  if(!selected)return;
  const {data:surveyRows,error:surveyError}=await supabase.from('ai_levantamentos').select('id,titulo,descricao,estado,criado_em').eq('empreendimento_id',selected).order('criado_em',{ascending:false});
  if(surveyError){setError(surveyError.message);return;}
  setSurveys(surveyRows||[]);
  const ids=(surveyRows||[]).map(x=>x.id);
  if(!ids.length){setDocuments([]);setProposals([]);return;}
  const {data:docRows,error:docError}=await supabase.from('ai_documentos').select('id,levantamento_id,nome_ficheiro,mime_type,tamanho_bytes,estado,criado_em,caminho_storage').in('levantamento_id',ids).order('criado_em',{ascending:false});
  if(docError){setError(docError.message);return;}
  setDocuments(docRows||[]);
  const {data:proposalRows,error:proposalError}=await supabase.from('ai_elementos_propostos').select('id,levantamento_id,tipo_elemento,dados_propostos,localizacao_proposta,confianca,estado_revisao,evidencia,registo_oficial_id,proposta_pai_id').in('levantamento_id',ids).order('criado_em',{ascending:false});
  if(proposalError){setError(proposalError.message);return;}
  setProposals(proposalRows||[]);
 },[selected]);
 useEffect(()=>{load();},[load]);
 useEffect(()=>{loadSurveyData();},[loadSurveyData]);
 const selectedProject=useMemo(()=>projects.find(p=>p.id===selected),[projects,selected]);
 const chooseFiles=e=>{
  const chosen=Array.from(e.target.files||[]);
  const accepted=chosen.filter(f=>{
   const ext=f.name.split('.').pop().toLowerCase();
   if(!TYPES[ext]){setError('Formato não incluído na lista: '+f.name);return false;}
   if(f.size>MAX_BYTES){setError('O ficheiro excede o limite de 250 MB: '+f.name);return false;}
   return true;
  });
  setFiles(old=>[...old,...accepted.filter(f=>!old.some(x=>x.name===f.name&&x.size===f.size))]);
  e.target.value='';
 };
 const reviewProposal=async(id,status)=>{\n  setError('');setMessage('');\n  try{const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!userData?.user)throw new Error('Sessão expirada.');const {error}=await supabase.from('ai_elementos_propostos').update({estado_revisao:status,revisto_por:userData.user.id,revisto_em:new Date().toISOString()}).eq('id',id).eq('estado_revisao','por_rever');if(error)throw error;setMessage(status==='aceite'?'Proposta aceite para integração no inventário.':'Proposta rejeitada.');await loadSurveyData();}catch(e){setError(e?.message||'Não foi possível atualizar a proposta.');}\n };\n const publishProposal=async(p)=>{\n  setPublishing(p.id);setError('');setMessage('');\n  try{const parentId=parentChoices[p.id]||p.proposta_pai_id||null;const {data,error}=await supabase.rpc('ai_publicar_elemento_proposto',{p_proposta_id:p.id,p_proposta_pai_id:parentId});if(error)throw error;setMessage('Elemento publicado no inventário oficial.');await loadSurveyData();}\n  catch(e){setError(e?.message||'Não foi possível publicar o elemento.');}\n  finally{setPublishing('');}\n };\n const analyzeSurvey=async(id)=>{
  setAnalyzing(id);setError('');setMessage('A IA está a ler os documentos e a preparar propostas de inventário…');
  try{const {data,error}=await supabase.functions.invoke('ativus-ai-inventory-analyzer',{body:{levantamento_id:id}});if(error)throw error;if(!data?.ok)throw new Error(data?.error||'A análise não foi concluída.');setMessage('Análise concluída: '+data.propostas+' proposta(s) de inventário. Revê os elementos antes de os validar.');await loadSurveyData();}
  catch(e){setError(e?.message||'Não foi possível analisar os documentos.');setMessage('');}
  finally{setAnalyzing('');}
 };
 const createSurveyAndUpload=async()=>{
  if(!selected) return setError('Seleciona primeiro um empreendimento.');
  if(!files.length)return setError('Seleciona pelo menos um ficheiro.');
  setSaving(true);setError('');setMessage('');
  let surveyId=null;
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser();
   if(userError)throw userError;
   const {data:survey,error:surveyError}=await supabase.from('ai_levantamentos').insert({
    empreendimento_id:selected,titulo:title.trim()||'Levantamento técnico',descricao:description.trim()||null,estado:'rascunho',criado_por:userData.user.id
   }).select('id').single();
   if(surveyError)throw surveyError;
   surveyId=survey.id;
   for(const file of files){
    const ext=file.name.split('.').pop().toLowerCase();
    const path=selected+'/'+surveyId+'/'+crypto.randomUUID()+'/'+safeName(file.name);
    const contentType=file.type||'application/octet-stream';
    const {data:uploaded,error:uploadError}=await supabase.storage.from(BUCKET).upload(path,file,{contentType,upsert:false});
    if(uploadError)throw new Error('Falha no envio de '+file.name+': '+uploadError.message);
    const {error:metadataError}=await supabase.from('ai_documentos').insert({
     levantamento_id:surveyId,nome_ficheiro:file.name,caminho_storage:uploaded.path,mime_type:contentType,
     tamanho_bytes:file.size,estado:'carregado',carregado_por:userData.user.id,
     metadados:{extensao:ext,categoria:TYPES[ext],origem:'interface_ativus_ai'}
    });
    if(metadataError)throw new Error('O ficheiro '+file.name+' foi enviado, mas não foi possível registar os seus dados: '+metadataError.message);
   }
   setMessage(files.length+' ficheiro(s) guardado(s) no levantamento. Ainda não foram analisados por IA.');
   setFiles([]);setTitle('Novo levantamento técnico');setDescription('');
   await loadSurveyData();
  }catch(e){
   setError(e?.message||'Não foi possível concluir o carregamento.');
   if(surveyId)await supabase.from('ai_levantamentos').update({estado:'erro'}).eq('id',surveyId);
   await loadSurveyData();
  }finally{setSaving(false);}
 };
 if(loading)return <section className="content"><div className="panel" style={{padding:24}}>A carregar Ativus AI…</div></section>;
 return <section className="content">
  <div className="toolbar"><div><h2 className="sectiontitle">Ativus AI — Inventário Inteligente</h2><p className="muted">Reúne plantas, desenhos CAD, modelos BIM, ficheiros 3D, fotografias e documentação técnica por empreendimento.</p></div><button className="secondary" onClick={()=>{load();loadSurveyData();}}><RefreshCw size={16}/> Atualizar</button></div>
  {error&&<div className="panel" role="alert" style={{padding:14,marginBottom:14,borderLeft:'4px solid #b42318',color:'#8f1d1d'}}><AlertTriangle size={17}/> {error}</div>}
  {message&&<div className="panel" role="status" style={{padding:14,marginBottom:14,color:'#176344'}}><CheckCircle2 size={17}/> {message}</div>}
  {!projects.length?<div className="panel" style={{padding:20}}>Não existem empreendimentos disponíveis para esta conta. Cria ou associa primeiro um empreendimento.</div>:<>
   <div className="panel" style={{padding:18,marginBottom:16}}>
    <label style={{display:'block',fontWeight:700,marginBottom:7}}>Empreendimento</label>
    <select value={selected} onChange={e=>setSelected(e.target.value)} style={{width:'100%',maxWidth:650,padding:12,border:'1px solid #cad8e5',borderRadius:9,background:'#fff'}}>
     {projects.map(p=><option key={p.id} value={p.id}>{p.nome} · {p.codigo}</option>)}
    </select>
   </div>
   <div className="panel" style={{padding:20,marginBottom:16}}>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}><Brain size={22}/><h3 style={{margin:0}}>Novo levantamento documental</h3></div>
    <p className="muted">Seleciona ficheiros para os associar a {selectedProject?.nome||'este empreendimento'}. O original é guardado em armazenamento privado.</p>
    <label style={{display:'block',fontWeight:700,marginTop:14}}>Título do levantamento</label>
    <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={180} style={{width:'100%',maxWidth:650,boxSizing:'border-box',padding:11,border:'1px solid #cad8e5',borderRadius:8,marginTop:6}}/>
    <label style={{display:'block',fontWeight:700,marginTop:14}}>Descrição (opcional)</label>
    <textarea rows={2} value={description} onChange={e=>setDescription(e.target.value)} style={{width:'100%',maxWidth:650,boxSizing:'border-box',padding:11,border:'1px solid #cad8e5',borderRadius:8,marginTop:6}}/>
    <input ref={inputRef} type="file" multiple accept={ACCEPT} onChange={chooseFiles} style={{display:'none'}}/>
    <div onClick={()=>inputRef.current?.click()} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inputRef.current?.click();}}} role="button" tabIndex={0} style={{marginTop:16,padding:24,border:'2px dashed #9db2c4',borderRadius:12,textAlign:'center',cursor:'pointer',background:'#f7fafc'}}>
     <Upload size={28}/><p style={{fontWeight:700,margin:'8px 0 4px'}}>Selecionar ficheiros técnicos</p><p className="muted" style={{margin:0}}>PDF · DWG · DXF · DWF · DWFx · IFC · RVT · STEP · IGES · OBJ · STL · E57 · LAS · DOCX · XLSX · imagens</p>
     <small className="muted">Até 250 MB por ficheiro. Para ficheiros grandes, o envio pode demorar.</small>
    </div>
    {!!files.length&&<div style={{marginTop:14}}><strong>{files.length} ficheiro(s) selecionado(s)</strong>{files.map((f,i)=>{const ext=f.name.split('.').pop().toLowerCase();return <div key={f.name+i} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'9px 0',borderBottom:'1px solid #edf1f5'}}><span><FileText size={15}/> {f.name}<small className="muted" style={{display:'block'}}>{TYPES[ext]} · {formatSize(f.size)}</small></span><button type="button" className="secondary" onClick={()=>setFiles(v=>v.filter((_,n)=>n!==i))}>Remover</button></div>})}</div>}
    <div style={{display:'flex',justifyContent:'flex-end',marginTop:18}}><button className="primary" disabled={saving||!files.length} onClick={createSurveyAndUpload}>{saving?'A carregar ficheiros…':'Guardar levantamento e ficheiros'}</button></div>
   </div>
   <div className="panel" style={{padding:20}}>
    <div style={{display:'flex',alignItems:'center',gap:10}}><FolderOpen size={20}/><h3 style={{margin:0}}>Levantamentos e documentos</h3></div>
    {!surveys.length?<p className="empty">Ainda não existem levantamentos documentais neste empreendimento.</p>:surveys.map(s=><div key={s.id} style={{padding:'14px 0',borderBottom:'1px solid #edf1f5'}}>
     <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><strong>{s.titulo}</strong><small className="muted" style={{display:'block'}}>{new Date(s.criado_em).toLocaleString('pt-PT')} · {s.estado}</small></div><span className="muted"><Clock3 size={14}/> {documents.filter(d=>d.levantamento_id===s.id).length} documento(s)</span><button className="primary" disabled={!!analyzing||!documents.some(d=>d.levantamento_id===s.id)} onClick={()=>analyzeSurvey(s.id)}>{analyzing===s.id?'A analisar…':'Analisar com IA'}</button></div>
     {proposals.filter(p=>p.levantamento_id===s.id).length>0&&<div style={{marginTop:12,padding:12,background:'#f4f8fb',borderRadius:8}}><strong>Propostas de inventário para validação ({proposals.filter(p=>p.levantamento_id===s.id).length})</strong>{proposals.filter(p=>p.levantamento_id===s.id).map(p=><div key={p.id} style={{padding:'8px 0',borderBottom:'1px solid #dce6ee'}}><strong>{p.dados_propostos?.nome||p.tipo_elemento}</strong><small className="muted" style={{display:'block'}}>{p.tipo_elemento} · {p.localizacao_proposta||'Localização não identificada'} · confiança {Math.round((p.confianca||0)*100)}% · {p.estado_revisao}</small>{p.dados_propostos?.descricao&&<small>{p.dados_propostos.descricao}</small>}{(p.dados_propostos?.material||p.dados_propostos?.fabricante||p.dados_propostos?.modelo||p.dados_propostos?.piso_nivel||p.dados_propostos?.zona)&&<small className="muted" style={{display:'block',marginTop:4}}> {[p.dados_propostos.material&&'Material: '+p.dados_propostos.material,p.dados_propostos.fabricante&&'Fabricante: '+p.dados_propostos.fabricante,p.dados_propostos.modelo&&'Modelo: '+p.dados_propostos.modelo,p.dados_propostos.piso_nivel&&'Piso: '+p.dados_propostos.piso_nivel,p.dados_propostos.zona&&'Zona: '+p.dados_propostos.zona].filter(Boolean).join(' · ')}</small>}{p.dados_propostos?.dimensoes&&Object.keys(p.dados_propostos.dimensoes).length>0&&<small className="muted" style={{display:'block'}}>Dimensões: {JSON.stringify(p.dados_propostos.dimensoes)}</small>}{p.dados_propostos?.caracteristicas&&Object.keys(p.dados_propostos.caracteristicas).length>0&&<small className="muted" style={{display:'block'}}>Características: {JSON.stringify(p.dados_propostos.caracteristicas)}</small>}{p.evidencia?.referencia&&<small className="muted" style={{display:'block'}}>Evidência: {typeof p.evidencia.referencia==='string'?p.evidencia.referencia:JSON.stringify(p.evidencia.referencia)}</small>}{p.estado_revisao==='por_rever'&&<div style={{display:'flex',gap:8,marginTop:7}}><button className="primary" onClick={()=>reviewProposal(p.id,'aceite')}>Aceitar</button><button className="secondary" onClick={()=>reviewProposal(p.id,'rejeitado')}>Rejeitar</button></div>}{['aceite','editado'].includes(p.estado_revisao)&&<div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:8}}>{!['ativo','equipamento'].includes(p.tipo_elemento)&&!p.proposta_pai_id&&<select value={parentChoices[p.id]||''} onChange={e=>setParentChoices(v=>({...v,[p.id]:e.target.value}))} style={{padding:8,border:'1px solid #cad8e5',borderRadius:7}}><option value="">Selecionar elemento pai publicado</option>{proposals.filter(x=>x.id!==p.id&&['ativo','equipamento','componente','subcomponente'].includes(x.tipo_elemento)&&x.registo_oficial_id&&x.estado_revisao==='criado').map(x=><option key={x.id} value={x.id}>{x.dados_propostos?.nome||x.tipo_elemento}</option>)}</select>}<button className="primary" disabled={publishing===p.id||(!['ativo','equipamento'].includes(p.tipo_elemento)&&!(parentChoices[p.id]||p.proposta_pai_id))} onClick={()=>publishProposal(p)}>{publishing===p.id?'A publicar…':'Publicar no inventário'}</button></div>}{p.estado_revisao==='criado'&&<small style={{display:'block',color:'#176344',marginTop:6}}>Publicado no inventário oficial · {p.registo_oficial_id}</small>}</div>)}</div>}{documents.filter(d=>d.levantamento_id===s.id).map(d=><div key={d.id} style={{display:'flex',justifyContent:'space-between',gap:10,padding:'8px 0 0 12px',fontSize:13}}><span><FileText size={14}/> {d.nome_ficheiro}</span><span className="muted">{formatSize(d.tamanho_bytes)} · {d.estado}</span></div>)}
    </div>)}
   </div>
  </>}
  <p className="muted" style={{marginTop:14}}><HardDrive size={14}/> Os ficheiros ficam privados e associados ao empreendimento. A análise automática já está disponível para PDF e imagens. Os restantes formatos são guardados e aguardam os respetivos módulos de conversão e interpretação CAD/BIM.</p>
 </section>;
}
