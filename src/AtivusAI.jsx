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
  const {data:docRows,error:docError}=await supabase.from('ai_documentos').select('id,levantamento_id,nome_ficheiro,mime_type,tamanho_bytes,estado,formato_familia,estado_extracao,metodo_extracao,formato_detectado,numero_versao,versao_atual,criado_em,caminho_storage').in('levantamento_id',ids).order('criado_em',{ascending:false});
  if(docError){setError(docError.message);return;}
  setDocuments(docRows||[]);
  const {data:proposalRows,error:proposalError}=await supabase.from('ai_elementos_propostos').select('id,levantamento_id,tipo_elemento,dados_propostos,localizacao_proposta,confianca,estado_revisao,evidencia,registo_oficial_id,proposta_pai_id,chave_consolidacao').in('levantamento_id',ids).order('criado_em',{ascending:false});
  if(proposalError){setError(proposalError.message);return;}
  setProposals(proposalRows||[]);
 },[selected]);
 useEffect(()=>{load();},[load]);
 useEffect(()=>{loadSurveyData();},[loadSurveyData]);
 const selectedProject=useMemo(()=>projects.find(p=>p.id===selected),[projects,selected]);
 const [workOrders,setWorkOrders]=useState([]),[maintenancePlans,setMaintenancePlans]=useState([]),[scheduledVisits,setScheduledVisits]=useState([]),[maintenanceKpis,setMaintenanceKpis]=useState([]),[maintenanceBudgets,setMaintenanceBudgets]=useState([]);
 const [operationalLoading,setOperationalLoading]=useState(false);
 const [newWork,setNewWork]=useState({codigo:'',descricao:'',tipo:'preventivo',prioridade:'moderada',prazo_previsto:'',custo_total_estimado:'',equipa_responsavel:''});
 const [newPlan,setNewPlan]=useState({codigo:'',nome:'',descricao:'',tipo:'preventiva',periodicidade_valor:6,periodicidade_unidade:'meses'});
 const [newRule,setNewRule]=useState({tipo_inspecao:'rotina',intervalo_dias:90,proxima_inspecao:'',observacoes:''});
 const [actionBusy,setActionBusy]=useState('');
 const [inventoryAssets,setInventoryAssets]=useState([]);
 const [inventoryComponents,setInventoryComponents]=useState([]);
 const [planElement,setPlanElement]=useState({plano_id:'',ativo_id:'',componente_id:'',instrucoes:''});
 const [ruleElement,setRuleElement]=useState({ativo_id:'',componente_id:''});
 const [teamMembers,setTeamMembers]=useState([]);
 const [selectedWorkId,setSelectedWorkId]=useState('');
 const [budgetDraft,setBudgetDraft]=useState({ano:new Date().getFullYear(),designacao:'Orçamento de manutenção',valor_aprovado:''});
 const [executionDraft,setExecutionDraft]=useState({descricao_trabalho:'',horas:'',custo_mao_obra:'',custo_materiais:'',custo_equipamentos:'',custo_outros:'',observacoes:''});
 const [resourceDraft,setResourceDraft]=useState({tipo:'material',designacao:'',unidade:'un',quantidade:1,custo_unitario:'',fornecedor:''});
 const [dependencyDraft,setDependencyDraft]=useState({trabalho_id:'',depende_de_trabalho_id:'',desfasamento_dias:0});
 const [appointmentDraft,setAppointmentDraft]=useState({plano_id:'',data_prevista:'',janela_inicio:'',janela_fim:'',observacoes:''});
 const [budgetDraftEdit,setBudgetDraftEdit]=useState({});

 const [selectedWorkId,setSelectedWorkId]=useState('');
 const [budgetDraft,setBudgetDraft]=useState({ano:new Date().getFullYear(),designacao:'Orçamento de manutenção',valor_aprovado:''});
 const [executionDraft,setExecutionDraft]=useState({descricao_trabalho:'',horas:'',custo_mao_obra:'',custo_materiais:'',custo_equipamentos:'',custo_outros:'',observacoes:''});
 const [resourceDraft,setResourceDraft]=useState({tipo:'material',designacao:'',unidade:'un',quantidade:1,custo_unitario:'',fornecedor:''});
 const [dependencyDraft,setDependencyDraft]=useState({trabalho_id:'',depende_de_trabalho_id:'',desfasamento_dias:0});



 const loadTeamMembers=useCallback(async()=>{
  if(!selected)return;
  const {data,error}=await supabase.rpc('ativus_membros_equipa_empreendimento',{p_empreendimento_id:selected});
  if(error)throw error;
  setTeamMembers(data||[]);
 },[selected]);
 useEffect(()=>{loadTeamMembers().catch(e=>setError(e.message||'Não foi possível carregar os membros da entidade.'));},[loadTeamMembers]);
 const loadInventoryChoices=useCallback(async()=>{
  if(!selected)return;
  const [a,c]=await Promise.all([
   supabase.from('ativos').select('id,codigo,nome,tipo').eq('empreendimento_id',selected).order('codigo').limit(500),
   supabase.from('componentes').select('id,codigo,nome,tipo,ativo_id,componente_pai_id').eq('empreendimento_id',selected).order('codigo').limit(1000)
  ]);
  if(a.error)throw a.error;if(c.error)throw c.error;
  setInventoryAssets(a.data||[]);setInventoryComponents(c.data||[]);
 },[selected]);
 useEffect(()=>{loadInventoryChoices().catch(e=>setError(e.message||'Não foi possível carregar o inventário.'));},[loadInventoryChoices]);
 const loadOperationalData=useCallback(async()=>{
  if(!selected)return;
  setOperationalLoading(true);
  try{
   const [w,p,a,k,b]=await Promise.all([
    supabase.from('trabalhos').select('id,codigo,descricao,tipo,prioridade,prazo_previsto,estado,custo_total_estimado,custo_real,percentagem_execucao,data_inicio_prevista,data_fim_prevista,responsavel_id,equipa_responsavel').eq('empreendimento_id',selected).order('prazo_previsto',{ascending:true}).limit(200),
    supabase.from('planos_manutencao').select('id,codigo,nome,tipo,periodicidade_valor,periodicidade_unidade,ativo').eq('empreendimento_id',selected).order('nome'),
    supabase.from('manutencao_agendamentos').select('id,plano_id,data_prevista,estado,responsavel_id,trabalho_id,observacoes').eq('empreendimento_id',selected).order('data_prevista').limit(100),
    supabase.from('indicadores_manutencao').select('id,periodo_inicio,periodo_fim,trabalhos_abertos,trabalhos_atrasados,trabalhos_concluidos,custo_estimado,custo_real,inspecoes_previstas,inspecoes_concluidas').eq('empreendimento_id',selected).order('calculado_em',{ascending:false}).limit(6),
    supabase.from('orcamentos_manutencao').select('id,ano,designacao,valor_aprovado,valor_comprometido,valor_realizado,moeda,estado').eq('empreendimento_id',selected).order('ano',{ascending:false}).limit(20)
   ]);
   if(w.error)throw w.error;if(p.error)throw p.error;if(a.error)throw a.error;if(k.error)throw k.error;if(b.error)throw b.error;
   setWorkOrders(w.data||[]);setMaintenancePlans(p.data||[]);setScheduledVisits(a.data||[]);setMaintenanceKpis(k.data||[]);setMaintenanceBudgets(b.data||[]);
  }catch(e){setError(e?.message||'Não foi possível carregar o painel de manutenção.');}
  finally{setOperationalLoading(false);}
 },[selected]);
 useEffect(()=>{loadOperationalData();},[loadOperationalData]);
 const workStateLabel=v=>({planeado:'Planeado',pendente:'Pendente',em_execucao:'Em execução',concluido:'Concluído',cancelado:'Cancelado',suspenso:'Suspenso'}[v]||v||'—');
 const euro=v=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(Number(v)||0);

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
 const reviewProposal=async(id,status)=>{
  setError('');setMessage('');
  try{const {data:userData,error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!userData?.user)throw new Error('Sessão expirada.');const {error}=await supabase.from('ai_elementos_propostos').update({estado_revisao:status,revisto_por:userData.user.id,revisto_em:new Date().toISOString()}).eq('id',id).eq('estado_revisao','por_rever');if(error)throw error;setMessage(status==='aceite'?'Proposta aceite para integração no inventário.':'Proposta rejeitada.');await loadSurveyData();}catch(e){setError(e?.message||'Não foi possível atualizar a proposta.');}
 };
 const publishProposal=async(p)=>{
  setPublishing(p.id);setError('');setMessage('');
  try{const parentId=parentChoices[p.id]||p.proposta_pai_id||null;const {data,error}=await supabase.rpc('ai_publicar_elemento_proposto',{p_proposta_id:p.id,p_proposta_pai_id:parentId});if(error)throw error;setMessage('Elemento publicado no inventário oficial.');await loadSurveyData();}
  catch(e){setError(e?.message||'Não foi possível publicar o elemento.');}
  finally{setPublishing('');}
 };
 const analyzeSurvey=async(id)=>{
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
     tamanho_bytes:file.size,estado:'carregado',formato_familia:TYPES[ext],formato_detectado:ext,estado_extracao:(ext==='pdf'||['jpg','jpeg','png','tif','tiff','webp'].includes(ext))?'pendente':'nao_suportado',metodo_extracao:(ext==='pdf'||['jpg','jpeg','png','tif','tiff','webp'].includes(ext))?'openai_vision':null,carregado_por:userData.user.id,
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
     {proposals.filter(p=>p.levantamento_id===s.id).length>0&&<div style={{marginTop:12,padding:12,background:'#f4f8fb',borderRadius:8}}><strong>Propostas de inventário para validação ({proposals.filter(p=>p.levantamento_id===s.id).length})</strong>{proposals.filter(p=>p.levantamento_id===s.id).map(p=><div key={p.id} style={{padding:'8px 0',borderBottom:'1px solid #dce6ee'}}><strong>{p.dados_propostos?.nome||p.tipo_elemento}</strong><small className="muted" style={{display:'block'}}>{p.tipo_elemento} · {p.localizacao_proposta||'Localização não identificada'} · confiança {Math.round((p.confianca||0)*100)}% · {p.estado_revisao}</small>{p.dados_propostos?.descricao&&<small>{p.dados_propostos.descricao}</small>}{(p.dados_propostos?.material||p.dados_propostos?.fabricante||p.dados_propostos?.modelo||p.dados_propostos?.piso_nivel||p.dados_propostos?.zona)&&<small className="muted" style={{display:'block',marginTop:4}}> {[p.dados_propostos.material&&'Material: '+p.dados_propostos.material,p.dados_propostos.fabricante&&'Fabricante: '+p.dados_propostos.fabricante,p.dados_propostos.modelo&&'Modelo: '+p.dados_propostos.modelo,p.dados_propostos.piso_nivel&&'Piso: '+p.dados_propostos.piso_nivel,p.dados_propostos.zona&&'Zona: '+p.dados_propostos.zona].filter(Boolean).join(' · ')}</small>}{p.dados_propostos?.dimensoes&&Object.keys(p.dados_propostos.dimensoes).length>0&&<small className="muted" style={{display:'block'}}>Dimensões: {JSON.stringify(p.dados_propostos.dimensoes)}</small>}{p.dados_propostos?.caracteristicas&&Object.keys(p.dados_propostos.caracteristicas).length>0&&<small className="muted" style={{display:'block'}}>Características: {JSON.stringify(p.dados_propostos.caracteristicas)}</small>}{(p.evidencia?.referencia||p.evidencia?.fontes?.length>0)&&<small className="muted" style={{display:'block'}}>Fontes documentais: {p.evidencia?.fontes?.length||1} · {p.evidencia?.fontes?.map(x=>x.documento).filter(Boolean).join(', ')||p.evidencia?.documento||'Referência disponível'}</small>}{p.proposta_pai_id&&<small className="muted" style={{display:'block'}}>Elemento pai identificado automaticamente</small>}{p.estado_revisao==='por_rever'&&<div style={{display:'flex',gap:8,marginTop:7}}><button className="primary" onClick={()=>reviewProposal(p.id,'aceite')}>Aceitar</button><button className="secondary" onClick={()=>reviewProposal(p.id,'rejeitado')}>Rejeitar</button></div>}{['aceite','editado'].includes(p.estado_revisao)&&<div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:8}}>{!['ativo','equipamento'].includes(p.tipo_elemento)&&!p.proposta_pai_id&&<select value={parentChoices[p.id]||''} onChange={e=>setParentChoices(v=>({...v,[p.id]:e.target.value}))} style={{padding:8,border:'1px solid #cad8e5',borderRadius:7}}><option value="">Selecionar elemento pai publicado</option>{proposals.filter(x=>x.id!==p.id&&['ativo','equipamento','componente','subcomponente'].includes(x.tipo_elemento)&&x.registo_oficial_id&&x.estado_revisao==='criado').map(x=><option key={x.id} value={x.id}>{x.dados_propostos?.nome||x.tipo_elemento}</option>)}</select>}<button className="primary" disabled={publishing===p.id||(!['ativo','equipamento'].includes(p.tipo_elemento)&&!(parentChoices[p.id]||p.proposta_pai_id))} onClick={()=>publishProposal(p)}>{publishing===p.id?'A publicar…':'Publicar no inventário'}</button></div>}{p.estado_revisao==='criado'&&<small style={{display:'block',color:'#176344',marginTop:6}}>Publicado no inventário oficial · {p.registo_oficial_id}</small>}</div>)}</div>}{documents.filter(d=>d.levantamento_id===s.id).map(d=><div key={d.id} style={{display:'flex',justifyContent:'space-between',gap:10,padding:'8px 0 0 12px',fontSize:13}}><span><FileText size={14}/> {d.nome_ficheiro}</span><span className="muted">{formatSize(d.tamanho_bytes)} · {d.estado}{d.formato_familia?` · ${d.formato_familia}`:""}{d.estado_extracao?` · Extração: ${d.estado_extracao}`:""}{d.numero_versao?` · v${d.numero_versao}${d.versao_atual?" (atual)":""}`:""}</span></div>)}
    </div>)}
   </div>
  </>}

  <section className="panel" style={{padding:20,marginTop:18}}>
   <div className="toolbar"><div><h3 style={{margin:0}}>Manutenção e Planeamento Operacional</h3><p className="muted">Ordens de trabalho, calendário preventivo, equipas, orçamento e indicadores.</p></div><button className="secondary" onClick={loadOperationalData} disabled={operationalLoading}>{operationalLoading?'A atualizar…':'Atualizar painel'}</button></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:10,margin:'16px 0'}}>
    <div className="panel" style={{padding:12}}><small className="muted">Trabalhos em aberto</small><h2 style={{margin:'5px 0'}}>{workOrders.filter(x=>!['concluido','cancelado'].includes(x.estado)).length}</h2></div>
    <div className="panel" style={{padding:12}}><small className="muted">Atrasados</small><h2 style={{margin:'5px 0'}}>{workOrders.filter(x=>!['concluido','cancelado'].includes(x.estado)&&x.prazo_previsto&&x.prazo_previsto<new Date().toISOString().slice(0,10)).length}</h2></div>
    <div className="panel" style={{padding:12}}><small className="muted">Planos ativos</small><h2 style={{margin:'5px 0'}}>{maintenancePlans.filter(x=>x.ativo).length}</h2></div>
    <div className="panel" style={{padding:12}}><small className="muted">Próximos agendamentos</small><h2 style={{margin:'5px 0'}}>{scheduledVisits.filter(x=>x.data_prevista>=new Date().toISOString().slice(0,10)&&!['concluido','cancelado'].includes(x.estado)).length}</h2></div>
   </div>

   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14,margin:'16px 0'}}>
    <div style={{padding:14,border:'1px solid #dce6ee',borderRadius:10}}>
     <h4 style={{marginTop:0}}>Criar ordem de trabalho</h4>
     <input placeholder="Código" value={newWork.codigo} onChange={e=>setNewWork(v=>({...v,codigo:e.target.value}))} style={{width:'100%',padding:9,marginBottom:7,boxSizing:'border-box'}}/>
     <textarea placeholder="Descrição do trabalho" value={newWork.descricao} onChange={e=>setNewWork(v=>({...v,descricao:e.target.value}))} rows={2} style={{width:'100%',padding:9,marginBottom:7,boxSizing:'border-box'}}/>
     <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      <select value={newWork.tipo} onChange={e=>setNewWork(v=>({...v,tipo:e.target.value}))}><option value="preventivo">Preventivo</option><option value="corretivo">Corretivo</option><option value="condicionado">Condicionado</option><option value="urgente">Urgente</option></select>
      <select value={newWork.prioridade} onChange={e=>setNewWork(v=>({...v,prioridade:e.target.value}))}><option value="baixa">Baixa</option><option value="moderada">Moderada</option><option value="alta">Alta</option><option value="critica">Crítica</option></select>
     </div>
     <label style={{display:'block',marginTop:8}}>Prazo previsto</label><input type="date" value={newWork.prazo_previsto} onChange={e=>setNewWork(v=>({...v,prazo_previsto:e.target.value}))}/>
     <label style={{display:'block',marginTop:8}}>Custo estimado (€)</label><input type="number" min="0" step="0.01" value={newWork.custo_total_estimado} onChange={e=>setNewWork(v=>({...v,custo_total_estimado:e.target.value}))}/>
     <input placeholder="Equipa responsável" value={newWork.equipa_responsavel} onChange={e=>setNewWork(v=>({...v,equipa_responsavel:e.target.value}))} style={{width:'100%',padding:9,margin:'8px 0',boxSizing:'border-box'}}/><select value={newWork.responsavel_id||''} onChange={e=>setNewWork(v=>({...v,responsavel_id:e.target.value}))} style={{width:'100%',padding:8,marginBottom:8}}><option value="">Sem responsável atribuído</option>{teamMembers.map(m=><option key={m.utilizador_id} value={m.utilizador_id}>{m.utilizador_id.slice(0,8)} — {m.perfil}</option>)}</select>
     <button className="primary" disabled={!!actionBusy} onClick={async()=>{setActionBusy('work');setError('');try{if(!newWork.codigo.trim()||!newWork.descricao.trim())throw new Error('Indica o código e a descrição.');const {data:user}=await supabase.auth.getUser();const cost=newWork.custo_total_estimado===''?null:Number(newWork.custo_total_estimado);const {error}=await supabase.from('trabalhos').insert({empreendimento_id:selected,codigo:newWork.codigo.trim(),descricao:newWork.descricao.trim(),tipo:newWork.tipo,prioridade:newWork.prioridade,estado:'por_planear',prazo_previsto:newWork.prazo_previsto||null,custo_total_estimado:cost,origem_planeamento:'manual',equipa_responsavel:newWork.equipa_responsavel||null,responsavel_id:newWork.responsavel_id||null,criado_por:user?.user?.id});if(error)throw error;setNewWork({codigo:'',descricao:'',tipo:'preventivo',prioridade:'moderada',prazo_previsto:'',custo_total_estimado:'',equipa_responsavel:'',responsavel_id:''});setMessage('Ordem de trabalho criada.');await loadOperationalData();}catch(e){setError(e.message||'Não foi possível criar a ordem.');}finally{setActionBusy('');}}}>{actionBusy==='work'?'A guardar…':'Criar ordem'}</button>
    </div>
    <div style={{padding:14,border:'1px solid #dce6ee',borderRadius:10}}>
     <h4 style={{marginTop:0}}>Criar plano de manutenção</h4>
     <input placeholder="Código do plano" value={newPlan.codigo} onChange={e=>setNewPlan(v=>({...v,codigo:e.target.value}))} style={{width:'100%',padding:9,marginBottom:7,boxSizing:'border-box'}}/>
     <input placeholder="Nome do plano" value={newPlan.nome} onChange={e=>setNewPlan(v=>({...v,nome:e.target.value}))} style={{width:'100%',padding:9,marginBottom:7,boxSizing:'border-box'}}/>
     <textarea placeholder="Descrição (opcional)" value={newPlan.descricao} onChange={e=>setNewPlan(v=>({...v,descricao:e.target.value}))} rows={2} style={{width:'100%',padding:9,marginBottom:7,boxSizing:'border-box'}}/>
     <select value={newPlan.tipo} onChange={e=>setNewPlan(v=>({...v,tipo:e.target.value}))}><option value="preventiva">Preventiva</option><option value="condicionada">Condicionada</option><option value="corretiva_programada">Corretiva programada</option></select>
     <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}><input type="number" min="1" value={newPlan.periodicidade_valor} onChange={e=>setNewPlan(v=>({...v,periodicidade_valor:e.target.value}))} style={{width:75}}/><select value={newPlan.periodicidade_unidade} onChange={e=>setNewPlan(v=>({...v,periodicidade_unidade:e.target.value}))}><option value="dias">Dias</option><option value="semanas">Semanas</option><option value="meses">Meses</option><option value="anos">Anos</option></select></div>
     <button className="primary" style={{marginTop:10}} disabled={!!actionBusy} onClick={async()=>{setActionBusy('plan');setError('');try{if(!newPlan.codigo.trim()||!newPlan.nome.trim())throw new Error('Indica o código e o nome do plano.');const {data:user}=await supabase.auth.getUser();const {error}=await supabase.from('planos_manutencao').insert({...newPlan,empreendimento_id:selected,periodicidade_valor:Number(newPlan.periodicidade_valor),criado_por:user?.user?.id});if(error)throw error;setNewPlan({codigo:'',nome:'',descricao:'',tipo:'preventiva',periodicidade_valor:6,periodicidade_unidade:'meses'});setMessage('Plano de manutenção criado.');await loadOperationalData();}catch(e){setError(e.message||'Não foi possível criar o plano.');}finally{setActionBusy('');}}}>{actionBusy==='plan'?'A guardar…':'Criar plano'}</button>
    </div>
    <div style={{padding:14,border:'1px solid #dce6ee',borderRadius:10}}>
     <h4 style={{marginTop:0}}>Criar regra de inspeção periódica</h4>
     <select value={newRule.tipo_inspecao} onChange={e=>setNewRule(v=>({...v,tipo_inspecao:e.target.value}))}><option value="rotina">Rotina</option><option value="principal">Principal</option><option value="especial">Especial</option></select>
     <label style={{display:'block',marginTop:8}}>Intervalo (dias)</label><input type="number" min="1" value={newRule.intervalo_dias} onChange={e=>setNewRule(v=>({...v,intervalo_dias:e.target.value}))}/>
     <label style={{display:'block',marginTop:8}}>Próxima inspeção</label><input type="date" value={newRule.proxima_inspecao} onChange={e=>setNewRule(v=>({...v,proxima_inspecao:e.target.value}))}/>
     <textarea placeholder="Observações" rows={2} value={newRule.observacoes} onChange={e=>setNewRule(v=>({...v,observacoes:e.target.value}))} style={{width:'100%',padding:9,margin:'8px 0',boxSizing:'border-box'}}/>
     <button className="primary" disabled={!!actionBusy} onClick={async()=>{setActionBusy('rule');setError('');try{if(!newRule.proxima_inspecao)throw new Error('Indica a data da próxima inspeção.');const {data:user}=await supabase.auth.getUser();const {error}=await supabase.from('regras_inspecao_periodica').insert({empreendimento_id:selected,tipo_inspecao:newRule.tipo_inspecao,intervalo_dias:Number(newRule.intervalo_dias),proxima_inspecao:newRule.proxima_inspecao,observacoes:newRule.observacoes||null,criado_por:user?.user?.id});if(error)throw error;setNewRule({tipo_inspecao:'rotina',intervalo_dias:90,proxima_inspecao:'',observacoes:''});setMessage('Regra de inspeção criada.');}catch(e){setError(e.message||'Não foi possível criar a regra.');}finally{setActionBusy('');}}}>{actionBusy==='rule'?'A guardar…':'Criar regra'}</button>
    </div>
   </div>

    <div style={{padding:14,border:'1px solid #dce6ee',borderRadius:10,margin:'12px 0'}}>
     <h4 style={{marginTop:0}}>Associar ativos e componentes a um plano</h4>
     <select value={planElement.plano_id} onChange={e=>setPlanElement(v=>({...v,plano_id:e.target.value}))}><option value="">Selecionar plano de manutenção</option>{maintenancePlans.map(p=><option key={p.id} value={p.id}>{p.codigo} — {p.nome}</option>)}</select>
     <select value={planElement.ativo_id} onChange={e=>setPlanElement(v=>({...v,ativo_id:e.target.value,componente_id:''}))} style={{marginLeft:8}}><option value="">Ativo (opcional)</option>{inventoryAssets.map(a=><option key={a.id} value={a.id}>{a.codigo} — {a.nome}</option>)}</select>
     <select value={planElement.componente_id} onChange={e=>setPlanElement(v=>({...v,componente_id:e.target.value,ativo_id:''}))} style={{marginLeft:8}}><option value="">Componente (opcional)</option>{inventoryComponents.map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}</select>
     <input placeholder="Instruções de manutenção" value={planElement.instrucoes} onChange={e=>setPlanElement(v=>({...v,instrucoes:e.target.value}))} style={{display:'block',width:'100%',padding:9,margin:'8px 0',boxSizing:'border-box'}}/>
     <button className="secondary" disabled={!!actionBusy} onClick={async()=>{setActionBusy('linkplan');try{if(!planElement.plano_id||(!planElement.ativo_id&&!planElement.componente_id))throw new Error('Seleciona um plano e um ativo ou componente.');const {error}=await supabase.from('plano_manutencao_elementos').insert({plano_id:planElement.plano_id,ativo_id:planElement.ativo_id||null,componente_id:planElement.componente_id||null,instrucoes:planElement.instrucoes||null});if(error)throw error;setPlanElement({plano_id:planElement.plano_id,ativo_id:'',componente_id:'',instrucoes:''});setMessage('Elemento associado ao plano de manutenção.');}catch(e){setError(e.message||'Não foi possível associar o elemento.');}finally{setActionBusy('');}}}>Associar ao plano</button>
    </div>
    <div style={{padding:14,border:'1px solid #dce6ee',borderRadius:10,margin:'12px 0'}}>
     <h4 style={{marginTop:0}}>Aplicar regra de inspeção a um elemento</h4>
     <select value={ruleElement.ativo_id} onChange={e=>setRuleElement(v=>({...v,ativo_id:e.target.value,componente_id:''}))}><option value="">Ativo (opcional)</option>{inventoryAssets.map(a=><option key={a.id} value={a.id}>{a.codigo} — {a.nome}</option>)}</select>
     <select value={ruleElement.componente_id} onChange={e=>setRuleElement(v=>({...v,componente_id:e.target.value,ativo_id:''}))} style={{marginLeft:8}}><option value="">Componente (opcional)</option>{inventoryComponents.map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}</select>
     <button className="secondary" disabled={!!actionBusy} style={{marginLeft:8}} onClick={async()=>{setActionBusy('rulelink');try{if(!ruleElement.ativo_id&&!ruleElement.componente_id)throw new Error('Seleciona um ativo ou componente para a regra.');const {data:user}=await supabase.auth.getUser();const {error}=await supabase.from('regras_inspecao_periodica').insert({empreendimento_id:selected,ativo_id:ruleElement.ativo_id||null,componente_id:ruleElement.componente_id||null,tipo_inspecao:newRule.tipo_inspecao,intervalo_dias:Number(newRule.intervalo_dias),proxima_inspecao:newRule.proxima_inspecao||new Date().toISOString().slice(0,10),observacoes:newRule.observacoes||null,criado_por:user?.user?.id});if(error)throw error;setMessage('Regra aplicada ao elemento selecionado.');}catch(e){setError(e.message||'Não foi possível aplicar a regra.');}finally{setActionBusy('');}}}>Aplicar regra ao elemento</button>
    </div>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'12px 0'}}>
    <button className="secondary" disabled={!!actionBusy} onClick={async()=>{setActionBusy('kpi');try{const start=new Date();start.setDate(1);const end=new Date(start.getFullYear(),start.getMonth()+1,0);const fmt=d=>d.toISOString().slice(0,10);const {error}=await supabase.rpc('ativus_calcular_indicadores',{p_empreendimento_id:selected,p_inicio:fmt(start),p_fim:fmt(end)});if(error)throw error;setMessage('Indicadores do mês calculados.');await loadOperationalData();}catch(e){setError(e.message||'Não foi possível calcular indicadores.');}finally{setActionBusy('');}}}>Calcular indicadores do mês</button>
    <button className="secondary" disabled={!!actionBusy||!maintenancePlans.some(p=>p.ativo)} onClick={async()=>{setActionBusy('schedule');try{const p=maintenancePlans.find(x=>x.ativo);const {error}=await supabase.rpc('ativus_gerar_proxima_manutencao',{p_plano_id:p.id});if(error)throw error;setMessage('Próxima manutenção agendada para o plano '+p.nome+'.');await loadOperationalData();}catch(e){setError(e.message||'Não foi possível gerar o agendamento.');}finally{setActionBusy('');}}}>Gerar próximo agendamento</button>
   </div>

   <div style={{border:'1px solid #dce6ee',borderRadius:10,padding:14,margin:'16px 0'}}>
    <h4>Orçamento anual de manutenção</h4>
    <input type="number" value={budgetDraft.ano} onChange={e=>setBudgetDraft(v=>({...v,ano:Number(e.target.value)}))}/>
    <input placeholder="Designação" value={budgetDraft.designacao} onChange={e=>setBudgetDraft(v=>({...v,designacao:e.target.value}))}/>
    <input type="number" min="0" step="0.01" placeholder="Valor aprovado (€)" value={budgetDraft.valor_aprovado} onChange={e=>setBudgetDraft(v=>({...v,valor_aprovado:e.target.value}))}/>
    <button className="primary" disabled={!!actionBusy} onClick={async()=>{setActionBusy('budget');try{if(!budgetDraft.designacao.trim()||budgetDraft.valor_aprovado==='')throw new Error('Preenche a designação e o valor.');const {data:user}=await supabase.auth.getUser();const {error}=await supabase.from('orcamentos_manutencao').insert({empreendimento_id:selected,ano:budgetDraft.ano,designacao:budgetDraft.designacao.trim(),valor_aprovado:Number(budgetDraft.valor_aprovado),criado_por:user?.user?.id});if(error)throw error;setMessage('Orçamento registado.');setBudgetDraft(v=>({...v,valor_aprovado:''}));await loadOperationalData();}catch(e){setError(e.message||'Falha ao guardar orçamento.');}finally{setActionBusy('');}}}>Guardar orçamento</button>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12,margin:'16px 0'}}>
    <div style={{border:'1px solid #dce6ee',borderRadius:10,padding:12}}>
     <h4>Registo de execução</h4><select value={selectedWorkId} onChange={e=>setSelectedWorkId(e.target.value)}><option value="">Selecionar ordem</option>{workOrders.map(w=><option key={w.id} value={w.id}>{w.codigo}</option>)}</select>
     <textarea rows={2} placeholder="Descrição da intervenção" value={executionDraft.descricao_trabalho} onChange={e=>setExecutionDraft(v=>({...v,descricao_trabalho:e.target.value}))}/>
     {['horas','custo_mao_obra','custo_materiais','custo_equipamentos','custo_outros'].map(k=><input key={k} type="number" min="0" step="0.01" placeholder={k.replaceAll('_',' ')} value={executionDraft[k]} onChange={e=>setExecutionDraft(v=>({...v,[k]:e.target.value}))} style={{width:115,margin:3}}/>)}
     <textarea rows={2} placeholder="Observações" value={executionDraft.observacoes} onChange={e=>setExecutionDraft(v=>({...v,observacoes:e.target.value}))}/>
     <button className="primary" disabled={!!actionBusy} onClick={async()=>{setActionBusy('execution');try{if(!selectedWorkId)throw new Error('Seleciona uma ordem.');const {data:user}=await supabase.auth.getUser();const n=k=>executionDraft[k]===''?null:Number(executionDraft[k]);const costs=['custo_mao_obra','custo_materiais','custo_equipamentos','custo_outros'].reduce((a,k)=>a+(n(k)||0),0);const {error}=await supabase.from('trabalho_execucoes').insert({trabalho_id:selectedWorkId,executante_id:user?.user?.id,descricao_trabalho:executionDraft.descricao_trabalho||null,horas:n('horas'),custo_mao_obra:n('custo_mao_obra'),custo_materiais:n('custo_materiais'),custo_equipamentos:n('custo_equipamentos'),custo_outros:n('custo_outros'),observacoes:executionDraft.observacoes||null,estado:'concluido',terminado_em:new Date().toISOString()});if(error)throw error;const {error:ue}=await supabase.from('trabalhos').update({custo_real:costs}).eq('id',selectedWorkId);if(ue)throw ue;setMessage('Execução e custos reais registados.');await loadOperationalData();}catch(e){setError(e.message||'Falha ao registar execução.');}finally{setActionBusy('');}}}>Guardar execução</button>
    </div>
    <div style={{border:'1px solid #dce6ee',borderRadius:10,padding:12}}>
     <h4>Recursos da ordem</h4><select value={selectedWorkId} onChange={e=>setSelectedWorkId(e.target.value)}><option value="">Selecionar ordem</option>{workOrders.map(w=><option key={w.id} value={w.id}>{w.codigo}</option>)}</select>
     <select value={resourceDraft.tipo} onChange={e=>setResourceDraft(v=>({...v,tipo:e.target.value}))}><option value="material">Material</option><option value="mao_obra">Mão de obra</option><option value="equipamento">Equipamento</option><option value="servico">Serviço</option></select>
     <input placeholder="Designação" value={resourceDraft.designacao} onChange={e=>setResourceDraft(v=>({...v,designacao:e.target.value}))}/>
     <input type="number" min="0" value={resourceDraft.quantidade} onChange={e=>setResourceDraft(v=>({...v,quantidade:e.target.value}))} placeholder="Quantidade"/>
     <input type="number" min="0" step="0.01" value={resourceDraft.custo_unitario} onChange={e=>setResourceDraft(v=>({...v,custo_unitario:e.target.value}))} placeholder="Custo unitário"/>
     <input placeholder="Fornecedor" value={resourceDraft.fornecedor} onChange={e=>setResourceDraft(v=>({...v,fornecedor:e.target.value}))}/>
     <button className="secondary" onClick={async()=>{try{if(!selectedWorkId||!resourceDraft.designacao.trim())throw new Error('Seleciona ordem e designação.');const q=Number(resourceDraft.quantidade)||1,u=resourceDraft.custo_unitario===''?null:Number(resourceDraft.custo_unitario);const {error}=await supabase.from('trabalho_recursos').insert({trabalho_id:selectedWorkId,tipo:resourceDraft.tipo,designacao:resourceDraft.designacao,unidade:resourceDraft.unidade,quantidade:q,custo_unitario:u,custo_total:u===null?null:q*u,fornecedor:resourceDraft.fornecedor||null});if(error)throw error;setMessage('Recurso associado.');}catch(e){setError(e.message||'Falha ao associar recurso.');}}}>Adicionar recurso</button>
    </div>
    <div style={{border:'1px solid #dce6ee',borderRadius:10,padding:12}}>
     <h4>Dependências entre ordens</h4><select value={dependencyDraft.trabalho_id} onChange={e=>setDependencyDraft(v=>({...v,trabalho_id:e.target.value}))}><option value="">Ordem dependente</option>{workOrders.map(w=><option key={w.id} value={w.id}>{w.codigo}</option>)}</select>
     <select value={dependencyDraft.depende_de_trabalho_id} onChange={e=>setDependencyDraft(v=>({...v,depende_de_trabalho_id:e.target.value}))}><option value="">Depende da ordem</option>{workOrders.filter(w=>w.id!==dependencyDraft.trabalho_id).map(w=><option key={w.id} value={w.id}>{w.codigo}</option>)}</select>
     <input type="number" value={dependencyDraft.desfasamento_dias} onChange={e=>setDependencyDraft(v=>({...v,desfasamento_dias:e.target.value}))} placeholder="Desfasamento em dias"/>
     <button className="secondary" onClick={async()=>{try{if(!dependencyDraft.trabalho_id||!dependencyDraft.depende_de_trabalho_id)throw new Error('Seleciona as duas ordens.');const {error}=await supabase.from('trabalhos_dependencias').insert({...dependencyDraft,desfasamento_dias:Number(dependencyDraft.desfasamento_dias)||0});if(error)throw error;setMessage('Dependência registada.');}catch(e){setError(e.message||'Falha ao registar dependência.');}}}>Guardar dependência</button>
    </div>
   </div>

   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:12,margin:'18px 0'}}>
    <div className="panel" style={{padding:12}}>
     <h4>Orçamento anual</h4><input type="number" value={budgetDraft.ano} onChange={e=>setBudgetDraft(v=>({...v,ano:Number(e.target.value)}))}/><input placeholder="Designação" value={budgetDraft.designacao} onChange={e=>setBudgetDraft(v=>({...v,designacao:e.target.value}))}/><input type="number" min="0" step="0.01" placeholder="Valor aprovado (€)" value={budgetDraft.valor_aprovado} onChange={e=>setBudgetDraft(v=>({...v,valor_aprovado:e.target.value}))}/>
     <button className="primary" onClick={async()=>{try{if(!budgetDraft.designacao.trim()||budgetDraft.valor_aprovado==='')throw new Error('Indica designação e valor.');const {data:user}=await supabase.auth.getUser();const {error}=await supabase.from('orcamentos_manutencao').insert({empreendimento_id:selected,ano:budgetDraft.ano,designacao:budgetDraft.designacao.trim(),valor_aprovado:Number(budgetDraft.valor_aprovado),criado_por:user?.user?.id});if(error)throw error;setMessage('Orçamento criado.');setBudgetDraft(v=>({...v,valor_aprovado:''}));await loadOperationalData();}catch(e){setError(e.message);}}}>Guardar orçamento</button>
    </div>
    <div className="panel" style={{padding:12}}>
     <h4>Registo de execução</h4><select value={selectedWorkId} onChange={e=>setSelectedWorkId(e.target.value)}><option value="">Selecionar ordem</option>{workOrders.map(w=><option key={w.id} value={w.id}>{w.codigo}</option>)}</select>
     <textarea rows={2} placeholder="Descrição da intervenção" value={executionDraft.descricao_trabalho} onChange={e=>setExecutionDraft(v=>({...v,descricao_trabalho:e.target.value}))}/>
     {['horas','custo_mao_obra','custo_materiais','custo_equipamentos','custo_outros'].map(k=><input key={k} type="number" min="0" step="0.01" placeholder={k.replaceAll('_',' ')} value={executionDraft[k]} onChange={e=>setExecutionDraft(v=>({...v,[k]:e.target.value}))} style={{width:115,margin:3}}/>)}
     <textarea rows={2} placeholder="Observações" value={executionDraft.observacoes} onChange={e=>setExecutionDraft(v=>({...v,observacoes:e.target.value}))}/>
     <button className="primary" onClick={async()=>{try{if(!selectedWorkId)throw new Error('Seleciona uma ordem.');const {data:user}=await supabase.auth.getUser();const n=k=>executionDraft[k]===''?null:Number(executionDraft[k]);const total=['custo_mao_obra','custo_materiais','custo_equipamentos','custo_outros'].reduce((a,k)=>a+(n(k)||0),0);const {error}=await supabase.from('trabalho_execucoes').insert({trabalho_id:selectedWorkId,executante_id:user?.user?.id,descricao_trabalho:executionDraft.descricao_trabalho||null,horas:n('horas'),custo_mao_obra:n('custo_mao_obra'),custo_materiais:n('custo_materiais'),custo_equipamentos:n('custo_equipamentos'),custo_outros:n('custo_outros'),observacoes:executionDraft.observacoes||null,estado:'concluido',terminado_em:new Date().toISOString()});if(error)throw error;const {error:ue}=await supabase.from('trabalhos').update({custo_real:total}).eq('id',selectedWorkId);if(ue)throw ue;setMessage('Execução registada com custos reais.');await loadOperationalData();}catch(e){setError(e.message||'Falha ao registar execução.');}}}>Guardar execução</button>
    </div>
    <div className="panel" style={{padding:12}}>
     <h4>Recursos e materiais</h4><select value={selectedWorkId} onChange={e=>setSelectedWorkId(e.target.value)}><option value="">Selecionar ordem</option>{workOrders.map(w=><option key={w.id} value={w.id}>{w.codigo}</option>)}</select>
     <select value={resourceDraft.tipo} onChange={e=>setResourceDraft(v=>({...v,tipo:e.target.value}))}><option value="material">Material</option><option value="mao_obra">Mão de obra</option><option value="equipamento">Equipamento</option><option value="servico">Serviço</option></select>
     <input placeholder="Designação" value={resourceDraft.designacao} onChange={e=>setResourceDraft(v=>({...v,designacao:e.target.value}))}/><input type="number" min="0" value={resourceDraft.quantidade} onChange={e=>setResourceDraft(v=>({...v,quantidade:e.target.value}))} placeholder="Quantidade"/><input type="number" min="0" step="0.01" value={resourceDraft.custo_unitario} onChange={e=>setResourceDraft(v=>({...v,custo_unitario:e.target.value}))} placeholder="Custo unitário"/><input placeholder="Fornecedor" value={resourceDraft.fornecedor} onChange={e=>setResourceDraft(v=>({...v,fornecedor:e.target.value}))}/>
     <button className="secondary" onClick={async()=>{try{if(!selectedWorkId||!resourceDraft.designacao.trim())throw new Error('Seleciona a ordem e indica o recurso.');const q=Number(resourceDraft.quantidade)||1,u=resourceDraft.custo_unitario===''?null:Number(resourceDraft.custo_unitario);const {error}=await supabase.from('trabalho_recursos').insert({trabalho_id:selectedWorkId,tipo:resourceDraft.tipo,designacao:resourceDraft.designacao.trim(),unidade:resourceDraft.unidade,quantidade:q,custo_unitario:u,custo_total:u===null?null:q*u,fornecedor:resourceDraft.fornecedor||null});if(error)throw error;setMessage('Recurso associado à ordem.');}catch(e){setError(e.message||'Falha ao associar recurso.');}}}>Adicionar recurso</button>
    </div>
    <div className="panel" style={{padding:12}}>
     <h4>Dependências entre ordens</h4><select value={dependencyDraft.trabalho_id} onChange={e=>setDependencyDraft(v=>({...v,trabalho_id:e.target.value}))}><option value="">Ordem dependente</option>{workOrders.map(w=><option key={w.id} value={w.id}>{w.codigo}</option>)}</select><select value={dependencyDraft.depende_de_trabalho_id} onChange={e=>setDependencyDraft(v=>({...v,depende_de_trabalho_id:e.target.value}))}><option value="">Depende da ordem</option>{workOrders.filter(w=>w.id!==dependencyDraft.trabalho_id).map(w=><option key={w.id} value={w.id}>{w.codigo}</option>)}</select><input type="number" value={dependencyDraft.desfasamento_dias} onChange={e=>setDependencyDraft(v=>({...v,desfasamento_dias:e.target.value}))} placeholder="Desfasamento em dias"/><button className="secondary" onClick={async()=>{try{if(!dependencyDraft.trabalho_id||!dependencyDraft.depende_de_trabalho_id)throw new Error('Seleciona as duas ordens.');const {error}=await supabase.from('trabalhos_dependencias').insert({...dependencyDraft,desfasamento_dias:Number(dependencyDraft.desfasamento_dias)||0});if(error)throw error;setMessage('Dependência registada.');}catch(e){setError(e.message||'Falha ao registar dependência.');}}}>Guardar dependência</button>
    </div>
    <div className="panel" style={{padding:12}}>
     <h4>Agendamento manual</h4><select value={appointmentDraft.plano_id} onChange={e=>setAppointmentDraft(v=>({...v,plano_id:e.target.value}))}><option value="">Plano de manutenção</option>{maintenancePlans.filter(p=>p.ativo).map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select><input type="date" value={appointmentDraft.data_prevista} onChange={e=>setAppointmentDraft(v=>({...v,data_prevista:e.target.value}))}/><input type="time" value={appointmentDraft.janela_inicio} onChange={e=>setAppointmentDraft(v=>({...v,janela_inicio:e.target.value}))}/><input type="time" value={appointmentDraft.janela_fim} onChange={e=>setAppointmentDraft(v=>({...v,janela_fim:e.target.value}))}/><textarea placeholder="Observações" value={appointmentDraft.observacoes} onChange={e=>setAppointmentDraft(v=>({...v,observacoes:e.target.value}))}/><button className="primary" onClick={async()=>{try{if(!appointmentDraft.plano_id||!appointmentDraft.data_prevista)throw new Error('Seleciona um plano e uma data.');const {error}=await supabase.from('manutencao_agendamentos').insert({empreendimento_id:selected,plano_id:appointmentDraft.plano_id,data_prevista:appointmentDraft.data_prevista,janela_inicio:appointmentDraft.janela_inicio||null,janela_fim:appointmentDraft.janela_fim||null,observacoes:appointmentDraft.observacoes||null});if(error)throw error;setMessage('Agendamento criado.');await loadOperationalData();}catch(e){setError(e.message||'Falha ao criar agendamento.');}}}>Criar agendamento</button>
    </div>
   </div>
   <h4>Ordens de trabalho</h4>
   {!workOrders.length?<p className="muted">Ainda não existem ordens de trabalho neste empreendimento.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['Código / descrição','Prioridade','Prazo','Responsável / equipa','Execução','Custo estimado','Estado'].map(x=><th key={x} style={{textAlign:'left',padding:8,borderBottom:'1px solid #dce6ee'}}>{x}</th>)}</tr></thead><tbody>{workOrders.map(w=><tr key={w.id}><td style={{padding:8,borderBottom:'1px solid #edf1f5'}}><strong>{w.codigo}</strong><small style={{display:'block'}}>{w.descricao}</small></td><td style={{padding:8}}>{w.prioridade||'—'}</td><td style={{padding:8,whiteSpace:'nowrap'}}>{w.prazo_previsto||'—'}</td><td style={{padding:8}}>{w.equipa_responsavel||w.responsavel_id||'Por atribuir'}</td><td style={{padding:8,minWidth:90}}>{Number(w.percentagem_execucao)||0}%<div style={{height:5,background:'#e7edf2',borderRadius:5}}><div style={{height:5,width:(Number(w.percentagem_execucao)||0)+'%',background:'#2474a6',borderRadius:5}}/></div></td><td style={{padding:8,whiteSpace:'nowrap'}}>{euro(w.custo_total_estimado)}</td><td style={{padding:8,minWidth:180}}><select value={w.estado} onChange={async e=>{const estado=e.target.value;const {error}=await supabase.from('trabalhos').update({estado,...(estado==='em_execucao'?{data_inicio_real:new Date().toISOString()}:{}),...(estado==='concluido'?{data_fim_real:new Date().toISOString(),percentagem_execucao:100}:{})}).eq('id',w.id);if(error)setError(error.message);else await loadOperationalData();}}><option value="por_planear">Por planear</option><option value="planeado">Planeado</option><option value="adjudicado">Adjudicado</option><option value="em_execucao">Em execução</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select><input aria-label="Equipa responsável" placeholder="Equipa" defaultValue={w.equipa_responsavel||''} onBlur={async e=>{const {error}=await supabase.from('trabalhos').update({equipa_responsavel:e.target.value||null}).eq('id',w.id);if(error)setError(error.message);else await loadOperationalData();}} style={{display:'block',width:130,marginTop:5}}/><button className="secondary" style={{marginTop:5}} onClick={async()=>{const value=window.prompt('Percentagem de execução (0 a 100)',String(w.percentagem_execucao||0));if(value===null)return;const n=Number(value);if(!Number.isFinite(n)||n<0||n>100){setError('A percentagem deve estar entre 0 e 100.');return;}const {error}=await supabase.rpc('ativus_atualizar_progresso_trabalho',{p_trabalho_id:w.id,p_percentagem:n});if(error)setError(error.message);else await loadOperationalData();}}>Atualizar progresso</button><button className="secondary" style={{marginTop:5}} onClick={()=>setSelectedWorkId(w.id)}>Selecionar para registo de execução</button></td></tr>)}</tbody></table></div>}
   <h4 style={{marginTop:20}}>Calendário de manutenção</h4>
   {!scheduledVisits.length?<p className="muted">Sem agendamentos registados.</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8}}>{scheduledVisits.map(a=><div key={a.id} style={{padding:10,border:'1px solid #e1e8ee',borderRadius:8}}><strong>{new Date(a.data_prevista+'T12:00:00').toLocaleDateString('pt-PT')}</strong><small style={{display:'block'}}>{maintenancePlans.find(p=>p.id===a.plano_id)?.nome||'Plano de manutenção'}</small><small className="muted">{workStateLabel(a.estado)}</small></div>)}</div>}
   <h4 style={{marginTop:20}}>Planos preventivos</h4>
   {!maintenancePlans.length?<p className="muted">Ainda não existem planos de manutenção.</p>:maintenancePlans.map(p=><div key={p.id} style={{padding:'8px 0',borderBottom:'1px solid #edf1f5'}}><strong>{p.codigo} · {p.nome}</strong><small className="muted" style={{display:'block'}}>{p.tipo} · periodicidade: {p.periodicidade_valor} {p.periodicidade_unidade} · {p.ativo?'Ativo':'Inativo'}</small></div>)}
   <h4 style={{marginTop:20}}>Orçamentos</h4>
   {!maintenanceBudgets.length?<p className="muted">Sem orçamento de manutenção registado.</p>:maintenanceBudgets.map(b=><div key={b.id} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'8px 0',borderBottom:'1px solid #edf1f5'}}><span><strong>{b.ano} · {b.designacao}</strong><small className="muted" style={{display:'block'}}>{b.estado}</small></span><span style={{textAlign:'right'}}>{euro(b.valor_realizado)} / {euro(b.valor_aprovado)}<small className="muted" style={{display:'block'}}>Realizado / aprovado</small></span></div>)}
   <h4 style={{marginTop:20}}>Indicadores calculados</h4>
   {!maintenanceKpis.length?<p className="muted">Ainda não existem períodos de indicadores calculados.</p>:maintenanceKpis.map(k=><div key={k.id} style={{padding:'8px 0',borderBottom:'1px solid #edf1f5'}}><strong>{new Date(k.periodo_inicio+'T12:00:00').toLocaleDateString('pt-PT')} – {new Date(k.periodo_fim+'T12:00:00').toLocaleDateString('pt-PT')}</strong><small className="muted" style={{display:'block'}}>{k.trabalhos_abertos} abertos · {k.trabalhos_atrasados} atrasados · {k.trabalhos_concluidos} concluídos · custo real {euro(k.custo_real)}</small></div>)}
  </section>
  <p className="muted" style={{marginTop:14}}><HardDrive size={14}/> Os ficheiros ficam privados e associados ao empreendimento. A análise automática já está disponível para PDF e imagens. Os restantes formatos são guardados e aguardam os respetivos módulos de conversão e interpretação CAD/BIM.</p>
 </section>;
}
