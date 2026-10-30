import React,{useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Building2,ClipboardCheck,AlertTriangle,CalendarDays,Plus,Search,Settings,FileText,Activity,ChevronRight,Menu,X,LayoutDashboard,Boxes,Link2,Brain,ShieldCheck} from 'lucide-react';
import './styles.css';
import { backendConfigured, supabase } from './lib/supabase.js';

const seedProjects=[
 {id:'EMP-0001',name:'Edifício Rua Central',location:'Porto',type:'Edifício multifamiliar',status:'Em curso',description:'Empreendimento de demonstração'}
];
const seedAssets=[
 {id:'ATV-0001',name:'Edifício Rua Central',type:'Edifício multifamiliar',location:'Porto',status:'Ativo',ec:2,maintenance:'Bom',components:12,pathologies:4},
 {id:'ATV-0002',name:'Edifício Avenida da República',type:'Edifício multifamiliar',location:'Vila Nova de Gaia',status:'Ativo',ec:1,maintenance:'Razoável',components:8,pathologies:2}
];
const seedInspections=[
 {id:'INS-0001',asset:'ATV-0001',type:'Principal',date:'2026-10-02',inspector:'Jorge Maçães',ec:2,maintenance:'Bom',pathologies:3},
 {id:'INS-0002',asset:'ATV-0001',type:'Rotina',date:'2026-09-15',inspector:'Jorge Maçães',ec:null,maintenance:'Bom',pathologies:1}
];
const seedPathologies=[
 {id:'PAT-0001',asset:'ATV-0001',subcomponent:'Fachada Norte',material:'Betão',type:'Fissuração',characteristic:'Diagonal',cause:'Movimentos diferenciais',effect:'Entrada de água',work:'Selagem de fissuras',unit:'m',status:'Identificada',ec:3},
 {id:'PAT-0002',asset:'ATV-0001',subcomponent:'Fachada Norte',material:'Betão armado',type:'Corrosão',characteristic:'Armaduras expostas',cause:'Carbonatação',effect:'Deterioração das armaduras',work:'Reparação de betão em profundidade',unit:'m²',status:'Em análise',ec:4}
];
const seedMaterials=['Betão','Betão armado','Aço','Alumínio','Madeira','Cerâmica'];
const seedRelations=[
 {id:'REL-001',pathology:'Fissuração',characteristic:'Diagonal',material:'Betão',cause:'Movimentos diferenciais',effect:'Entrada de água',work:'Selagem de fissuras',unit:'m',confidence:'Confirmada'},
 {id:'REL-002',pathology:'Corrosão',characteristic:'Armaduras expostas',material:'Betão armado',cause:'Carbonatação',effect:'Deterioração das armaduras',work:'Reparação de betão em profundidade',unit:'m²',confidence:'Confirmada'}
];
function load(k,s){try{return JSON.parse(localStorage.getItem(k))||s}catch{return s}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v));return v}

function App(){
 const [projects,setProjects]=useState(()=>load('ativus_projects',seedProjects));
 const [assets,setAssets]=useState(()=>load('ativus_assets',seedAssets));
 const [inspections,setInspections]=useState(()=>load('ativus_inspections',seedInspections));
 const [pathologies,setPathologies]=useState(()=>load('ativus_pathologies',seedPathologies));
 const [materials,setMaterials]=useState(()=>load('ativus_materials',seedMaterials));
 const [relations,setRelations]=useState(()=>load('ativus_relations',seedRelations));
 const [view,setView]=useState('dashboard'),[selected,setSelected]=useState(null),[selectedProject,setSelectedProject]=useState(null),[menu,setMenu]=useState(false),[query,setQuery]=useState('');
 const [paramTab,setParamTab]=useState('relations');
 const [projectFormOpen,setProjectFormOpen]=useState(false);
 const [projectForm,setProjectForm]=useState({name:'',location:'',type:'',description:''});
 const [projectError,setProjectError]=useState('');
 const filtered=useMemo(()=>assets.filter(a=>(a.name+' '+a.location+' '+a.id).toLowerCase().includes(query.toLowerCase())),[assets,query]);
 const current=selected?assets.find(a=>a.id===selected):null;
 const nav=[['dashboard','Dashboard',LayoutDashboard],['projects','Empreendimentos',Building2],['assets','Ativos / Inventário',Building2],['inspections','Inspeções',ClipboardCheck],['pathologies','Patologias',AlertTriangle],['agenda','Agenda',CalendarDays],['monitoring','Sistemas de Monitorização',Activity],['documents','Documentação',FileText],['settings','Parametrização',Settings]];
 const go=id=>{setView(id);setMenu(false);if(id!=='asset')setSelected(null);if(id!=='project')setSelectedProject(null)};
 const addAsset=()=>{const name=window.prompt('Nome do ativo:');if(!name||!name.trim())return;const n=Math.max(0,...assets.map(a=>Number(String(a.id).replace(/\\D/g,''))||0))+1,a={id:'ATV-'+String(n).padStart(4,'0'),name:name.trim(),type:'Edifício residencial',location:'Por definir',status:'Ativo',ec:0,maintenance:'Bom',components:0,pathologies:0};const next=[a,...assets];setAssets(save('ativus_assets',next));setSelected(a.id);setView('asset')};
 const addInspection=asset=>{const n=inspections.length+1,i={id:'INS-'+String(n).padStart(4,'0'),asset,type:'Rotina',date:new Date().toISOString().slice(0,10),inspector:'Utilizador atual',ec:null,maintenance:'Bom',pathologies:0};setInspections(save('ativus_inspections',[i,...inspections]))};
 const addPathology=()=>{const n=pathologies.length+1,p={id:'PAT-'+String(n).padStart(4,'0'),asset:current?.id||assets[0]?.id||'ATV-0001',subcomponent:'Novo subcomponente',material:materials[0]||'Betão',type:'Fissuração',characteristic:'Diagonal',cause:'',effect:'',work:'',unit:'m',status:'Identificada',ec:3};setPathologies(save('ativus_pathologies',[p,...pathologies]));setView('pathologies')};
 return <div className="app">
  <aside className={menu?'sidebar open':'sidebar'}><div className="brand"><div className="brandmark">7M</div><div><strong>Seven M</strong><span>ATIVUS</span></div><button className="close" onClick={()=>setMenu(false)}><X size={20}/></button></div>
   <nav>{nav.map(([id,label,Icon])=><button className={view===id?'nav active':'nav'} key={id} onClick={()=>go(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
   <div className="sidefoot">MVP 0.2<br/><small>Inventário · inspeção · patologias · parametrização</small></div>
  </aside>
  <main className="main"><header><button className="hamb" onClick={()=>setMenu(true)}><Menu/></button><div><div className="eyebrow">SEVEN M ATIVUS</div><h1>{view==='dashboard'?'Dashboard':view==='projects'?'Empreendimentos':view==='project'?selectedProject?.name||'Empreendimento':view==='assets'?'Ativos / Inventário':view==='asset'?current?.name||'Ativo':nav.find(x=>x[0]===view)?.[1]||'Ativus'}</h1></div><div className="header-actions"><div className={backendConfigured ? "sync backend-ready" : "sync"}>{backendConfigured ? "● Backend configurado" : "● Demonstração local"}</div><div className="user">JM</div></div></header>
   {view==='projects'&&<Projects projects={projects} onNew={()=>{setProjectForm({name:'',location:'',type:'',description:''});setProjectError('');setProjectFormOpen(true);}} onOpen={p=>{setSelectedProject(p);setView('project');}}/>}
   {view==='project'&&selectedProject&&<ProjectDetail project={selectedProject} assets={assets} onBack={()=>go('projects')}/ >}
   {projectFormOpen&&<div role="presentation" onClick={()=>setProjectFormOpen(false)} style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(10,28,44,.58)',display:'grid',placeItems:'center',padding:18}}>
    <form onSubmit={e=>{e.preventDefault();if(!projectForm.name.trim()||!projectForm.location.trim()||!projectForm.type){setProjectError('Preencha o nome, a localização e o tipo de empreendimento.');return;}const n=Math.max(0,...projects.map(p=>Number(String(p.id).replace(/\\D/g,''))||0))+1;const project={id:'EMP-'+String(n).padStart(4,'0'),name:projectForm.name.trim(),location:projectForm.location.trim(),type:projectForm.type,description:projectForm.description.trim(),status:'Em curso'};setProjects(save('ativus_projects',[project,...projects]));setProjectFormOpen(false);}} onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:18,padding:22,boxSizing:'border-box',boxShadow:'0 20px 60px rgba(0,0,0,.25)'}}>
     <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><span className="eyebrow">SEVEN M ATIVUS</span><h2 style={{margin:'8px 0 4px',color:'#173b59'}}>Novo empreendimento</h2><p className="muted" style={{marginTop:0}}>Introduza os dados do empreendimento.</p></div><button type="button" className="secondary" onClick={()=>setProjectFormOpen(false)} aria-label="Fechar"><X size={18}/></button></div>
     <label style={{display:'block',marginTop:16,fontWeight:700,color:'#23415b'}}>Nome do empreendimento *</label><input required value={projectForm.name} onChange={e=>setProjectForm({...projectForm,name:e.target.value})} placeholder="Ex.: Edifício Rua Central" style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:12,border:'1px solid #cad8e5',borderRadius:9,fontSize:16}}/>
     <label style={{display:'block',marginTop:14,fontWeight:700,color:'#23415b'}}>Localização *</label><input required value={projectForm.location} onChange={e=>setProjectForm({...projectForm,location:e.target.value})} placeholder="Localidade ou morada" style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:12,border:'1px solid #cad8e5',borderRadius:9,fontSize:16}}/>
     <label style={{display:'block',marginTop:14,fontWeight:700,color:'#23415b'}}>Tipo de empreendimento *</label><select required value={projectForm.type} onChange={e=>setProjectForm({...projectForm,type:e.target.value})} style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:12,border:'1px solid #cad8e5',borderRadius:9,fontSize:16,background:'#fff',color:'#23415b'}}><option value="">Selecione uma opção</option><option>Edifício multifamiliar</option><option>Edifício unifamiliar</option><option>Edifício de serviços / escritórios</option><option>Edifício comercial</option><option>Instalação industrial</option><option>Infraestrutura rodoviária</option><option>Ponte / viaduto</option><option>Infraestrutura ferroviária</option><option>Infraestrutura hidráulica</option><option>Equipamento público</option><option>Outro</option></select>
     <label style={{display:'block',marginTop:14,fontWeight:700,color:'#23415b'}}>Descrição</label><textarea value={projectForm.description} onChange={e=>setProjectForm({...projectForm,description:e.target.value})} rows={3} placeholder="Descrição ou observações (opcional)" style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:12,border:'1px solid #cad8e5',borderRadius:9,fontSize:16,resize:'vertical'}}/>
     {projectError&&<p role="alert" style={{color:'#b42318',fontSize:13}}>{projectError}</p>}
     <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}><button type="button" className="secondary" onClick={()=>setProjectFormOpen(false)}>Cancelar</button><button type="submit" className="primary">Guardar empreendimento</button></div>
     <p style={{fontSize:11,color:'#708396',marginTop:14}}>Os registos desta versão continuam guardados localmente neste navegador.</p>
    </form>
   </div>}
   {view==='dashboard'&&<Dashboard assets={assets} inspections={inspections} pathologies={pathologies} onAssets={()=>go('assets')} onNew={addAsset}/>}
   {view==='assets'&&<Assets assets={filtered} query={query} setQuery={setQuery} onNew={addAsset} onOpen={id=>{setSelected(id);setView('asset')}}/>}
   {view==='asset'&&current&&<AssetDetail asset={current} inspections={inspections} pathologies={pathologies} onBack={()=>go('assets')} onNewInspection={()=>addInspection(current.id)} onNewPathology={addPathology}/>}
   {view==='inspections'&&<Inspections inspections={inspections} assets={assets}/>}
   {view==='pathologies'&&<Pathologies pathologies={pathologies} assets={assets} onNew={addPathology}/>}
   {view==='agenda'&&<Agenda inspections={inspections} pathologies={pathologies}/>}
   {view==='monitoring'&&<Module icon={Activity} title="Sistemas de Monitorização" text="Instrumentação e aquisição de dados para deslocamentos, velocidade de corrosão e outros sensores."/>}
   {view==='documents'&&<Module icon={FileText} title="Documentação" text="Documentos associados a ativos, componentes, inspeções e intervenções."/>}
   {view==='settings'&&<Parametrization materials={materials} setMaterials={v=>setMaterials(save('ativus_materials',v))} relations={relations} tab={paramTab} setTab={setParamTab}/>}
  </main>
 </div>
}
function Projects({projects,onNew,onOpen}){return <section className="content"><div className="toolbar"><div><h2 className="sectiontitle">Empreendimentos</h2><p className="muted">Registo e organização dos empreendimentos geridos pela Seven M Ativus.</p></div><button className="primary" onClick={onNew}><Plus size={18}/> Novo empreendimento</button></div><div className="panel table"><div className="thead"><span>Código / Empreendimento</span><span>Localização</span><span>Tipo</span><span>Estado</span><span></span></div>{projects.length?projects.map(p=><div className="trow" key={p.id} role="button" tabIndex={0} onClick={()=>onOpen(p)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpen(p)}}} style={{cursor:'pointer'}}><div><strong>{p.name}</strong><small>{p.id}{p.description?' · '+p.description:''}</small></div><span>{p.location}</span><span>{p.type}</span><span className="green">● {p.status}</span><span><button type="button" className="secondary" onClick={e=>{e.stopPropagation();onOpen(p);}}>Ver detalhes <ChevronRight size={16}/></button></span></div>):<p className="empty">Ainda não existem empreendimentos. Selecione «Novo empreendimento» para criar o primeiro registo.</p>}</div><p className="muted">Nota: nesta versão, os registos são guardados neste navegador. A gravação partilhada na base de dados Supabase ainda precisa de ser integrada.</p></section>}
function ProjectDetail({project,assets,onBack}){const linked=assets.filter(a=>a.projectId===project.id);return <section className="content"><div className="toolbar"><div><span className="eyebrow">FICHA DO EMPREENDIMENTO</span><h2 className="sectiontitle">{project.name}</h2><p className="muted">{project.id}</p></div><button className="secondary" onClick={onBack}>Voltar à lista</button></div><div className="panel" style={{padding:20,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:18}}><div><small className="muted">Localização</small><p><strong>{project.location||'Não indicada'}</strong></p></div><div><small className="muted">Tipo de empreendimento</small><p><strong>{project.type||'Não definido'}</strong></p></div><div><small className="muted">Estado</small><p className="green"><strong>● {project.status||'Em curso'}</strong></p></div><div><small className="muted">Código</small><p><strong>{project.id}</strong></p></div><div style={{gridColumn:'1/-1'}}><small className="muted">Descrição</small><p>{project.description||'Sem descrição registada.'}</p></div></div><div className="panel" style={{padding:20,marginTop:16}}><h3>Ativos associados</h3>{linked.length?linked.map(a=><div key={a.id} className="trow"><strong>{a.name}</strong><span>{a.id}</span><span>{a.location}</span></div>):<p className="muted">Ainda não existem ativos associados a este empreendimento. Poderemos associá-los numa próxima etapa.</p>}</div><p className="muted">Os dados desta versão são guardados localmente neste navegador.</p></section>}
function Dashboard({assets,inspections,pathologies,onAssets,onNew}){
 const open=pathologies.filter(p=>!['Encerrada','Verificada'].includes(p.status)).length;
 const ecCounts=[0,1,2,3,4,5].map(ec=>({label:'EC '+ec,value:assets.filter(a=>Number(a.ec)===ec).length}));
 const severity=[{label:'Crítica · EC5',value:pathologies.filter(p=>Number(p.ec)===5).length},{label:'Alta · EC4',value:pathologies.filter(p=>Number(p.ec)===4).length},{label:'Moderada · EC3',value:pathologies.filter(p=>Number(p.ec)===3).length},{label:'Baixa · EC0–2',value:pathologies.filter(p=>Number(p.ec)<=2).length}];
 const maxSeverity=Math.max(1,...severity.map(x=>x.value));
 const maxEC=Math.max(1,...ecCounts.map(x=>x.value));
 const recent=inspections.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,4);
 return <section className="content">
  <div className="hero"><div><span className="pill">Protótipo · dados locais</span><h2>Visão global dos ativos</h2><p>Indicadores visuais para acompanhar inventário, inspeções e anomalias. Os dados atuais são demonstrativos e guardados neste navegador.</p></div><button className="primary" onClick={onNew}><Plus size={18}/> Novo Ativo</button></div>
  <div className="stats"><Stat icon={Building2} label="Ativos registados" value={assets.length}/><Stat icon={ClipboardCheck} label="Inspeções registadas" value={inspections.length}/><Stat icon={AlertTriangle} label="Patologias por tratar" value={open}/><Stat icon={ShieldCheck} label="Ativos em EC5" value={assets.filter(a=>Number(a.ec)===5).length}/></div>
  <div className="dashgrid">
   <div className="panel chartpanel"><div className="panelhead"><div><h3>Estado de conservação dos ativos</h3><span>Distribuição por classe EC</span></div><span className="charttag">Inventário</span></div>
    <div className="ecbars">{ecCounts.map(item=><div className="ecbar" key={item.label}><div className="ecbartrack"><div className={'ecbarfill ecfill'+item.label.slice(-1)} style={{height:(item.value/maxEC*100)+'%'}}/><span>{item.value}</span></div><small>{item.label}</small></div>)}</div>
    <div className="chartnote">Total analisado: <b>{assets.length}</b> ativos com classificação registada.</div>
   </div>
   <div className="panel chartpanel"><div className="panelhead"><div><h3>Patologias por gravidade</h3><span>Classificação atual dos registos</span></div><span className="charttag">Patologias</span></div>
    <div className="severitybars">{severity.map(item=><div className="severityrow" key={item.label}><div className="severitylabel"><span>{item.label}</span><b>{item.value}</b></div><div className="severitytrack"><div className={'severityfill '+(item.label.startsWith('Crítica')?'sevcritical':item.label.startsWith('Alta')?'sevhigh':item.label.startsWith('Moderada')?'sevmedium':'sevlow')} style={{width:(item.value/maxSeverity*100)+'%'}}/></div></div>)}</div>
    <div className="chartnote">Patologias registadas: <b>{pathologies.length}</b>. A classificação depende dos dados introduzidos.</div>
   </div>
   <div className="panel chartpanel"><div className="panelhead"><div><h3>Atividade de inspeção</h3><span>Registos mais recentes</span></div></div>
    {recent.length?recent.map(i=><div className="inspectionrow" key={i.id}><div className="datebox">{String(i.date).slice(8,10)}<small>{String(i.date).slice(5,7)}</small></div><div><strong>{i.type} · {i.id}</strong><span>{i.asset} · {i.inspector}</span></div><Badge value={i.maintenance}/></div>):<p className="empty">Ainda não existem inspeções.</p>}
   </div>
   <div className="panel chartpanel"><div className="panelhead"><div><h3>Ativos recentes</h3><span>Resumo do inventário</span></div><button className="textbtn" onClick={onAssets}>Ver inventário <ChevronRight size={15}/></button></div>
    {assets.slice(0,4).map(a=><AssetRow key={a.id} a={a} onClick={onAssets}/>)}
   </div>
  </div>
  <div className="dashfoot"><ShieldCheck size={17}/><span><b>Nota de fiabilidade:</b> os gráficos são calculados a partir dos registos disponíveis neste navegador. Não representam dados partilhados entre utilizadores nem substituem um backend central.</span></div>
 </section>
}
function Stat({icon:Icon,label,value}){return <div className="stat"><div className="staticon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong></div></div>}
function Assets({assets,query,setQuery,onNew,onOpen}){return <section className="content"><div className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar ativo, local ou código..."/></div><button className="primary" onClick={onNew}><Plus size={18}/> Novo Ativo</button></div><div className="table panel"><div className="thead"><span>Ativo</span><span>Localização</span><span>EC</span><span>Manutenção</span><span>Estado</span><span></span></div>{assets.map(a=><button className="trow" key={a.id} onClick={()=>onOpen(a.id)}><div><strong>{a.name}</strong><small>{a.id} · {a.type}</small></div><span>{a.location}</span><span><Ec value={a.ec}/></span><span><Badge value={a.maintenance}/></span><span className="green">● {a.status}</span><ChevronRight size={18}/></button>)}</div></section>}
function AssetDetail({asset,inspections,pathologies,onBack,onNewInspection,onNewPathology}){const list=inspections.filter(i=>i.asset===asset.id),pats=pathologies.filter(p=>p.asset===asset.id);return <section className="content"><button className="back" onClick={onBack}>← Voltar aos ativos</button><div className="assethead"><div><span className="pill">{asset.id}</span><h2>{asset.name}</h2><p>{asset.type} · {asset.location}</p></div><div className="actions"><button className="secondary" onClick={onNewPathology}><Plus size={16}/> Patologia</button><button className="primary" onClick={onNewInspection}><Plus size={18}/> Nova inspeção</button></div></div><div className="stats compact"><Stat icon={Boxes} label="Componentes" value={asset.components}/><Stat icon={AlertTriangle} label="Patologias" value={pats.length}/><Stat icon={ClipboardCheck} label="Inspeções" value={list.length}/><Stat icon={ShieldCheck} label="Estado de conservação" value={'EC '+asset.ec}/></div><div className="grid2"><div className="panel"><h3>Inventário</h3><div className="details"><p><b>Código:</b> {asset.id}</p><p><b>Tipo:</b> {asset.type}</p><p><b>Localização:</b> {asset.location}</p><p><b>Manutenção:</b> <Badge value={asset.maintenance}/></p><p><b>EC:</b> <Ec value={asset.ec}/></p></div></div><div className="panel"><h3>Patologias recentes</h3>{pats.length?pats.map(p=><div className="listrow" key={p.id}><div><strong>{p.type} · {p.characteristic}</strong><span>{p.material} · {p.location||p.subcomponent}</span></div><Ec value={p.ec}/></div>):<p className="empty">Ainda não existem patologias.</p>}</div></div></section>}
function Inspections({inspections,assets}){return <section className="content"><div className="panel table"><div className="thead"><span>Inspeção</span><span>Ativo</span><span>Data</span><span>Tipo</span><span>Manutenção</span><span>Patologias</span></div>{inspections.map(i=><div className="trow" key={i.id}><div><strong>{i.id}</strong><small>{i.inspector}</small></div><span>{assets.find(a=>a.id===i.asset)?.name||i.asset}</span><span>{i.date}</span><span>{i.type}</span><span><Badge value={i.maintenance}/></span><span>{i.pathologies}</span></div>)}</div></section>}
function Pathologies({pathologies,assets,onNew}){return <section className="content"><div className="toolbar"><div><h2 className="sectiontitle">Patologias</h2><p className="muted">Causa → Patologia → Efeito → Trabalho</p></div><button className="primary" onClick={onNew}><Plus size={18}/> Nova patologia</button></div><div className="cards">{pathologies.map(p=><div className="pathcard panel" key={p.id}><div className="pathhead"><div><span className="pill">{p.id}</span><h3>{p.type} <small>· {p.characteristic}</small></h3></div><Ec value={p.ec}/></div><div className="chain"><span>{p.material}</span><ChevronRight/><span>{p.cause||'Causa por determinar'}</span><ChevronRight/><span>{p.effect||'Efeito por determinar'}</span><ChevronRight/><span>{p.work||'Trabalho por determinar'}</span></div><div className="pathfoot"><span>{assets.find(a=>a.id===p.asset)?.name||p.asset} · {p.subcomponent}</span><Badge value={p.status}/></div></div>)}</div></section>}
function Agenda({inspections,pathologies}){return <section className="content"><div className="grid2"><div className="panel"><h3>Próximas inspeções</h3>{inspections.slice(0,8).map(i=><div className="listrow" key={i.id}><div><strong>{i.date} · {i.type}</strong><span>{i.asset} · {i.inspector}</span></div><ClipboardCheck size={18}/></div>)}</div><div className="panel"><h3>Prazos de intervenção</h3>{pathologies.filter(p=>p.ec>=4).map(p=><div className="listrow" key={p.id}><div><strong>{p.id} · {p.type}</strong><span>{p.ec===5?'Intervenção imediata':'Resolver até 1 ano'}</span></div><Ec value={p.ec}/></div>)}</div></div></section>}
function Parametrization({materials,setMaterials,relations,tab,setTab}){const tabs=[['relations','Relações técnicas',Link2],['materials','Materiais',Boxes],['rules','Regras / Comportamentos',Settings],['ai','IA / Aprendizagem',Brain]];const addMaterial=()=>{const n=prompt('Novo material');if(n&&n.trim()&&!materials.includes(n.trim()))setMaterials([...materials,n.trim()])};return <section className="content"><div className="paramnav">{tabs.map(([id,label,Icon])=><button className={tab===id?'paramactive':''} onClick={()=>setTab(id)} key={id}><Icon size={17}/>{label}</button>)}</div>{tab==='relations'&&<div className="panel"><div className="panelhead"><div><h3>Relações técnicas</h3><span>Material → Patologia → Causa → Efeito → Trabalho → Unidade</span></div><span className="pill">{relations.length} relações</span></div><div className="relationtable">{relations.map(r=><div className="relation" key={r.id}><b>{r.pathology}</b><span>{r.characteristic}</span><span>{r.material}</span><span>{r.cause}</span><span>{r.effect}</span><span>{r.work}</span><span>{r.unit}</span><Badge value={r.confidence}/></div>)}</div></div>}{tab==='materials'&&<div className="panel"><div className="panelhead"><div><h3>Materiais</h3><span>Usados no inventário dos subcomponentes e na compatibilidade de patologias.</span></div><button className="primary" onClick={addMaterial}><Plus size={17}/> Material</button></div><div className="chips">{materials.map(m=><span className="chip" key={m}>{m}</span>)}</div></div>}{tab==='rules'&&<div className="panel"><h3>Regras / Comportamentos</h3><div className="rule"><b>SE</b> patologia com <strong>EC 5</strong> <b>ENTÃO</b> intervenção imediata + alerta + restrição de acesso/sinalização.</div><div className="rule"><b>SE</b> componente <strong>EC 4</strong> <b>ENTÃO</b> prazo máximo configurado de 1 ano.</div><div className="rule"><b>EC componente</b> = maior EC dos subcomponentes; apresentar também mínimo, média e distribuição.</div></div>}{tab==='ai'&&<div className="panel ai"><Brain size={38}/><h3>IA baseada na parametrização e histórico</h3><p>As relações confirmadas pelo inspetor alimentam sugestões futuras. Cada sugestão deve apresentar confiança e permitir aceitar, editar ou rejeitar.</p><div className="airow"><span>Fissuração + diagonal + Betão</span><strong>→ Movimentos diferenciais</strong><em>92%</em></div><div className="airow"><span>Corrosão + Betão armado</span><strong>→ Carbonatação</strong><em>89%</em></div></div>}</section>}
function Module({icon:Icon,title,text}){return <section className="content"><div className="placeholder panel"><Icon size={40}/><h2>{title}</h2><p>{text}</p><span className="pill">Módulo base integrado</span></div></section>}
function AssetRow({a,onClick}){return <button className="assetrow" onClick={onClick}><div className="assetavatar"><Building2 size={19}/></div><div><strong>{a.name}</strong><span>{a.id} · {a.location}</span></div><Ec value={a.ec}/><ChevronRight size={17}/></button>}
function Ec({value}){return <span className={'ec ec'+value}>EC {value}</span>}
function Badge({value}){return <span className={'badge '+String(value).toLowerCase().replaceAll(' ','-')}>{value}</span>}
function AuthGate(){
 const [session,setSession]=useState(null);
 const [loading,setLoading]=useState(true);
 const [mode,setMode]=useState('login');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 React.useEffect(()=>{
   if(!supabase){setLoading(false);return}
   supabase.auth.getSession().then(({data,error})=>{if(error)setMessage(error.message);setSession(data?.session||null);setLoading(false)});
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>setSession(nextSession));
   return ()=>subscription.unsubscribe();
 },[]);
 const submit=async(e)=>{
   e.preventDefault();setMessage('');
   if(!supabase){setMessage('A ligação ao Supabase ainda não está configurada nesta publicação.');return}
   setBusy(true);
   try{
const result = mode === 'login'
  ? await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })
  : await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: 'https://jorgemacaes.github.io/Ativus/'
      }
    });
     if(result.error)throw result.error;
     if(mode==='signup'&&!result.data?.session)setMessage('Conta criada. Confirma o endereço de email através da mensagem enviada antes de iniciares sessão.');
     else setMessage('Autenticação concluída.');
   }catch(err){setMessage(err?.message||'Não foi possível concluir a autenticação.')}
   finally{setBusy(false)}
 };
 const signOut=async()=>{await supabase?.auth.signOut();setSession(null)};
 if(loading)return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f3f7fb',color:'#23415b'}}>A verificar sessão…</div>;
 if(session)return <><div style={{position:'fixed',zIndex:1000,top:12,right:16,display:'flex',gap:10,alignItems:'center',background:'#fff',border:'1px solid #dbe5ee',borderRadius:12,padding:'8px 12px',fontSize:12,color:'#23415b'}}><span>{session.user?.email}</span><button onClick={signOut} style={{border:0,borderRadius:8,padding:'7px 10px',background:'#eaf1f7',color:'#23415b'}}>Terminar sessão</button></div><App/></>;
 if(!backendConfigured)return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#f3f7fb',fontFamily:'Arial,sans-serif'}}><div style={{maxWidth:430,width:'100%',background:'#fff',border:'1px solid #dbe5ee',borderRadius:20,padding:28,boxSizing:'border-box'}}><div style={{color:'#2563a6',fontWeight:800,letterSpacing:2,fontSize:12}}>SEVEN M ATIVUS</div><h1 style={{color:'#173b59',fontSize:24}}>Acesso à plataforma</h1><p style={{color:'#52677a',lineHeight:1.5}}>A autenticação está preparada no código, mas falta configurar a ligação ao Supabase na publicação web. Não introduzas aqui a tua palavra-passe.</p><p style={{fontSize:12,color:'#52677a'}}>Estado: backend não configurado.</p></div></div>;
 return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'linear-gradient(135deg,#edf4fa,#f8fbfe)',fontFamily:'Arial,sans-serif',boxSizing:'border-box'}}><form onSubmit={submit} style={{maxWidth:420,width:'100%',background:'#fff',border:'1px solid #dbe5ee',borderRadius:20,padding:28,boxSizing:'border-box',boxShadow:'0 16px 45px rgba(25,65,95,.09)'}}><div style={{color:'#2563a6',fontWeight:800,letterSpacing:2,fontSize:12}}>SEVEN M ATIVUS</div><h1 style={{color:'#173b59',fontSize:25,marginBottom:8}}>{mode==='login'?'Iniciar sessão':'Criar conta'}</h1><p style={{color:'#52677a',lineHeight:1.5,fontSize:14}}>Acesso por email à plataforma de gestão de ativos.</p><label style={{display:'block',fontSize:13,fontWeight:700,color:'#23415b',marginTop:22}}>Email</label><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',boxSizing:'border-box',padding:12,border:'1px solid #cad8e5',borderRadius:9,marginTop:7,fontSize:16}}/><label style={{display:'block',fontSize:13,fontWeight:700,color:'#23415b',marginTop:16}}>Palavra-passe (mínimo 8 caracteres)</label><input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',boxSizing:'border-box',padding:12,border:'1px solid #cad8e5',borderRadius:9,marginTop:7,fontSize:16}}/><button disabled={busy} type="submit" style={{width:'100%',marginTop:22,padding:13,border:0,borderRadius:10,background:'#1d5f91',color:'#fff',fontWeight:700,fontSize:15,opacity:busy?.7:1}}>{busy?'A processar…':mode==='login'?'Entrar':'Criar conta'}</button><button type="button" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('')}} style={{width:'100%',marginTop:12,padding:10,border:'1px solid #dbe5ee',borderRadius:10,background:'#fff',color:'#1d5f91'}}>{mode==='login'?'Ainda não tens conta? Criar conta':'Já tens conta? Iniciar sessão'}</button>{message&&<p role="status" style={{marginTop:16,fontSize:13,lineHeight:1.5,color:'#23415b',overflowWrap:'anywhere'}}>{message}</p>}<p style={{marginTop:20,fontSize:11,color:'#708396',lineHeight:1.5}}>A criação de conta não atribui permissões de administrador. O acesso aos dados será controlado separadamente pelas políticas de segurança.</p></form></div>;
}
createRoot(document.getElementById('root')).render(<AuthGate/>);
