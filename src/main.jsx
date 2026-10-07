import React,{useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Building2,ClipboardCheck,AlertTriangle,CalendarDays,Plus,Search,Settings,FileText,Activity,ChevronRight,Menu,X,LayoutDashboard} from 'lucide-react';
import './styles.css';

const seedAssets=[
 {id:'ATV-0001',name:'Edifício Rua Central',type:'Edifício multifamiliar',location:'Porto',status:'Ativo',ec:2,maintenance:'Bom',components:12,pathologies:4},
 {id:'ATV-0002',name:'Edifício Avenida da República',type:'Edifício multifamiliar',location:'Vila Nova de Gaia',status:'Ativo',ec:1,maintenance:'Razoável',components:8,pathologies:2}
];
const seedInspections=[
 {id:'INS-0001',asset:'ATV-0001',type:'Principal',date:'2026-10-02',inspector:'Jorge Maçães',ec:2,maintenance:'Bom',pathologies:3},
 {id:'INS-0002',asset:'ATV-0001',type:'Rotina',date:'2026-09-15',inspector:'Jorge Maçães',ec:null,maintenance:'Bom',pathologies:1}
];
function load(key,seed){try{return JSON.parse(localStorage.getItem(key))||seed}catch{return seed}}
function App(){
 const [assets,setAssets]=useState(()=>load('ativus_assets',seedAssets));
 const [inspections,setInspections]=useState(()=>load('ativus_inspections',seedInspections));
 const [view,setView]=useState('dashboard');
 const [selected,setSelected]=useState(null);
 const [menu,setMenu]=useState(false);
 const [query,setQuery]=useState('');
 const persist=(key,value)=>{localStorage.setItem(key,JSON.stringify(value));return value};
 const filtered=useMemo(()=>assets.filter(a=>(a.name+' '+a.location+' '+a.id).toLowerCase().includes(query.toLowerCase())),[assets,query]);
 const addAsset=()=>{const n=assets.length+1;const a={id:'ATV-'+String(n).padStart(4,'0'),name:'Novo Ativo '+n,type:'Edifício residencial',location:'Por definir',status:'Ativo',ec:0,maintenance:'Bom',components:0,pathologies:0};const next=[...assets,a];setAssets(persist('ativus_assets',next));setSelected(a.id);setView('asset');};
 const nav=[['dashboard','Dashboard',LayoutDashboard],['assets','Ativos / Inventário',Building2],['inspections','Inspeções',ClipboardCheck],['pathologies','Patologias',AlertTriangle],['agenda','Agenda',CalendarDays],['monitoring','Sistemas de Monitorização',Activity],['documents','Documentação',FileText],['settings','Parametrização',Settings]];
 const current=selected?assets.find(a=>a.id===selected):null;
 return <div className="app">
  <aside className={menu?'sidebar open':'sidebar'}>
   <div className="brand"><div className="brandmark">7M</div><div><strong>Seven M</strong><span>ATIVUS</span></div><button className="close" onClick={()=>setMenu(false)}><X size={20}/></button></div>
   <nav>{nav.map(([id,label,Icon])=><button className={view===id?'nav active':'nav'} key={id} onClick={()=>{setView(id);setMenu(false);if(id!=='asset')setSelected(null)}}><Icon size={19}/><span>{label}</span></button>)}</nav>
   <div className="sidefoot">MVP 0.1<br/><small>Gestão de ativos e inspeções</small></div>
  </aside>
  <main className="main">
   <header><button className="hamb" onClick={()=>setMenu(true)}><Menu/></button><div><div className="eyebrow">SEVEN M ATIVUS</div><h1>{view==='dashboard'?'Dashboard':view==='assets'?'Ativos / Inventário':view==='asset'?current?.name||'Ativo':nav.find(x=>x[0]===view)?.[1]||'Ativus'}</h1></div><div className="header-actions"><button className="iconbtn"><Search size={18}/></button><div className="user">JM</div></div></header>
   {view==='dashboard'&&<Dashboard assets={assets} inspections={inspections} onAssets={()=>setView('assets')} onNew={addAsset}/>}
   {view==='assets'&&<Assets assets={filtered} query={query} setQuery={setQuery} onNew={addAsset} onOpen={(id)=>{setSelected(id);setView('asset')}}/>}
   {view==='asset'&&current&&<AssetDetail asset={current} inspections={inspections} onBack={()=>setView('assets')} onNewInspection={()=>{const i={id:'INS-'+String(inspections.length+1).padStart(4,'0'),asset:current.id,type:'Rotina',date:new Date().toISOString().slice(0,10),inspector:'Utilizador atual',ec:null,maintenance:'Bom',pathologies:0};const next=[i,...inspections];setInspections(persist('ativus_inspections',next));}}/>}
   {view==='inspections'&&<Inspections inspections={inspections} assets={assets}/>}
   {view==='pathologies'&&<Placeholder title="Patologias" icon={AlertTriangle} text="Registo e acompanhamento de patologias, causas, efeitos, trabalhos e custos."/>}
   {view==='agenda'&&<Placeholder title="Agenda" icon={CalendarDays} text="Planeamento de inspeções, ações corretivas e prazos de resolução."/>}
   {view==='monitoring'&&<Placeholder title="Sistemas de Monitorização" icon={Activity} text="Instrumentação e aquisição de dados: deslocamentos, velocidade de corrosão e outros sensores."/>}
   {view==='documents'&&<Placeholder title="Documentação" icon={FileText} text="Documentos associados ao Ativo, componentes, inspeções e intervenções."/>}
   {view==='settings'&&<Placeholder title="Parametrização" icon={Settings} text="Entidades, Ativos, componentes, patologias, causas, efeitos, trabalhos, unidades, perfis e regras."/>}
  </main>
 </div>
}
function Dashboard({assets,inspections,onAssets,onNew}){const ec5=assets.filter(a=>a.ec===5).length;return <section className="content">
 <div className="hero"><div><span className="pill">MVP 0.1 • Operacional</span><h2>Visão geral dos teus ativos</h2><p>Inventário, inspeções e manutenção num único lugar.</p></div><button className="primary" onClick={onNew}><Plus size={18}/> Novo Ativo</button></div>
 <div className="stats"><Stat icon={Building2} label="Ativos" value={assets.length}/><Stat icon={ClipboardCheck} label="Inspeções" value={inspections.length}/><Stat icon={AlertTriangle} label="Patologias" value={assets.reduce((s,a)=>s+a.pathologies,0)}/><Stat icon={Activity} label="EC 5 / críticos" value={ec5}/></div>
 <div className="grid2"><div className="panel"><div className="panelhead"><div><h3>Ativos recentes</h3><span>Resumo do inventário</span></div><button className="textbtn" onClick={onAssets}>Ver todos <ChevronRight size={16}/></button></div>{assets.slice(0,4).map(a=><AssetRow key={a.id} a={a} onClick={onAssets}/>)}</div>
 <div className="panel"><div className="panelhead"><div><h3>Últimas inspeções</h3><span>Atividade recente</span></div></div>{inspections.slice(0,4).map(i=><div className="inspectionrow" key={i.id}><div className="datebox">{i.date.slice(8,10)}<small>{i.date.slice(5,7)}</small></div><div><strong>{i.type}</strong><span>{i.asset} · {i.inspector}</span></div><Badge value={i.maintenance}/></div>)}</div></div>
 </section>}
function Stat({icon:Icon,label,value}){return <div className="stat"><div className="staticon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong></div></div>}
function Assets({assets,query,setQuery,onNew,onOpen}){return <section className="content"><div className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar ativos, local ou código..."/></div><button className="primary" onClick={onNew}><Plus size={18}/> Novo Ativo</button></div><div className="table panel"><div className="thead"><span>Ativo</span><span>Localização</span><span>EC</span><span>Manutenção</span><span>Estado</span><span></span></div>{assets.map(a=><button className="trow" key={a.id} onClick={()=>onOpen(a.id)}><div><strong>{a.name}</strong><small>{a.id} · {a.type}</small></div><span>{a.location}</span><span><Ec value={a.ec}/></span><span><Badge value={a.maintenance}/></span><span className="green">● {a.status}</span><ChevronRight size={18}/></button>)}</div></section>}
function AssetDetail({asset,inspections,onBack,onNewInspection}){const list=inspections.filter(i=>i.asset===asset.id);return <section className="content"><button className="back" onClick={onBack}>← Voltar aos ativos</button><div className="assethead"><div><span className="pill">{asset.id}</span><h2>{asset.name}</h2><p>{asset.type} · {asset.location}</p></div><button className="primary" onClick={onNewInspection}><Plus size={18}/> Nova inspeção</button></div><div className="stats compact"><Stat icon={Building2} label="Componentes" value={asset.components}/><Stat icon={AlertTriangle} label="Patologias" value={asset.pathologies}/><Stat icon={ClipboardCheck} label="Inspeções" value={list.length}/><Stat icon={Activity} label="Estado de conservação" value={'EC '+asset.ec}/></div><div className="grid2"><div className="panel"><h3>Resumo do inventário</h3><div className="details"><p><b>Código:</b> {asset.id}</p><p><b>Tipo:</b> {asset.type}</p><p><b>Localização:</b> {asset.location}</p><p><b>Manutenção:</b> <Badge value={asset.maintenance}/></p><p><b>Estado de conservação:</b> <Ec value={asset.ec}/></p></div></div><div className="panel"><h3>Inspeções</h3>{list.length?list.map(i=><div className="inspectionrow" key={i.id}><div className="datebox">{i.date.slice(8,10)}<small>{i.date.slice(5,7)}</small></div><div><strong>{i.type}</strong><span>{i.inspector}</span></div><Badge value={i.maintenance}/></div>):<p className="empty">Ainda não existem inspeções.</p>}</div></div></section>}
function Inspections({inspections,assets}){return <section className="content"><div className="panel table"><div className="thead"><span>Inspeção</span><span>Ativo</span><span>Data</span><span>Tipo</span><span>Manutenção</span><span>Patologias</span></div>{inspections.map(i=><div className="trow" key={i.id}><div><strong>{i.id}</strong><small>{i.inspector}</small></div><span>{assets.find(a=>a.id===i.asset)?.name||i.asset}</span><span>{i.date}</span><span>{i.type}</span><span><Badge value={i.maintenance}/></span><span>{i.pathologies}</span></div>)}</div></section>}
function AssetRow({a,onClick}){return <button className="assetrow" onClick={onClick}><div className="assetavatar"><Building2 size={19}/></div><div><strong>{a.name}</strong><span>{a.id} · {a.location}</span></div><Ec value={a.ec}/><ChevronRight size={17}/></button>}
function Ec({value}){return <span className={'ec ec'+value}>EC {value}</span>}
function Badge({value}){return <span className={'badge '+String(value).toLowerCase().replace(' ','-')}>{value}</span>}
function Placeholder({title,icon:Icon,text}){return <section className="content"><div className="placeholder panel"><Icon size={40}/><h2>{title}</h2><p>{text}</p><span className="pill">Módulo base — próxima fase</span></div></section>}
createRoot(document.getElementById('root')).render(<App/>);