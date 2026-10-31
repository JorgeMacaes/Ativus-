import React,{useState} from 'react';
import {AlertTriangle,CheckCircle2,Send} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const categories=['Humidade ou água','Fissura ou racha','Elemento partido ou danificado','Equipamento avariado','Ruído ou vibração','Mau cheiro','Eletricidade ou iluminação','Outro'];
const field={width:'100%',boxSizing:'border-box',padding:12,marginTop:6,border:'1px solid #cad8e5',borderRadius:9,fontSize:15,background:'#fff',color:'#23415b'};
export default function PublicOccurrence({token}){
 const [form,setForm]=useState({category:categories[0],description:'',location:'',urgency:'nao_sei',reporter_name:'',contact:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState(null);
 const submit=async e=>{
  e.preventDefault();setBusy(true);setError('');
  try{
   if(!supabase)throw new Error('Serviço temporariamente indisponível.');
   const {data,error:invokeError}=await supabase.functions.invoke('public-occurrence',{body:{token,category:form.category,description:form.description,location:form.location,urgency:form.urgency,reporter_name:form.reporter_name,contact:form.contact}});
   if(invokeError)throw invokeError;
   if(!data?.ok)throw new Error(data?.error||'Não foi possível registar a ocorrência.');
   setResult(data);
  }catch(e){setError(e?.message||'Não foi possível enviar a comunicação.');}
  finally{setBusy(false)}
 };
 return <main style={{minHeight:'100vh',background:'#f2f6fa',padding:'28px 16px',fontFamily:'Arial,sans-serif',boxSizing:'border-box'}}>
  <div style={{maxWidth:620,margin:'0 auto',background:'#fff',border:'1px solid #dce6ef',borderRadius:18,padding:24,boxSizing:'border-box',boxShadow:'0 12px 35px rgba(24,60,90,.08)'}}>
   <div style={{fontSize:12,fontWeight:800,letterSpacing:2,color:'#1c6598'}}>SEVEN M ATIVUS</div>
   <h1 style={{color:'#173b59',fontSize:25,margin:'12px 0 8px'}}>Comunicar uma ocorrência</h1>
   <p style={{color:'#52677a',lineHeight:1.5,marginTop:0}}>Descreva o que observou. Não precisa de conhecimentos técnicos nem de criar uma conta.</p>
   {result?<div style={{padding:18,borderRadius:12,background:'#edf8f2',color:'#176344',marginTop:20}}>
    <CheckCircle2 size={28}/><h2 style={{margin:'10px 0'}}>Comunicação recebida</h2>
    <p>Obrigado. A sua comunicação foi registada e será analisada pela equipa responsável.</p>
    <p style={{fontSize:18,fontWeight:800}}>N.º {result.code}</p>
    <p style={{fontSize:13}}>Empreendimento: {result.enterprise}</p>
   </div>:<form onSubmit={submit}>
    <label style={{display:'block',fontWeight:700,color:'#23415b',marginTop:18}}>Tipo de situação</label>
    <select style={field} value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))}>{categories.map(x=><option key={x}>{x}</option>)}</select>
    <label style={{display:'block',fontWeight:700,color:'#23415b',marginTop:16}}>O que aconteceu? *</label>
    <textarea required minLength={8} maxLength={4000} rows={5} style={field} value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))} placeholder="Descreva o que observou, onde e quando…"/>
    <label style={{display:'block',fontWeight:700,color:'#23415b',marginTop:16}}>Localização dentro do empreendimento</label>
    <input maxLength={300} style={field} value={form.location} onChange={e=>setForm(v=>({...v,location:e.target.value}))} placeholder="Ex.: entrada principal, garagem, piso 2…"/>
    <label style={{display:'block',fontWeight:700,color:'#23415b',marginTop:16}}>A situação parece urgente?</label>
    <select style={field} value={form.urgency} onChange={e=>setForm(v=>({...v,urgency:e.target.value}))}><option value="nao_sei">Não sei avaliar</option><option value="normal">Não é urgente</option><option value="urgente">Sim, é urgente</option></select>
    <div style={{borderTop:'1px solid #e3eaf0',marginTop:22,paddingTop:8}}>
     <p style={{fontSize:13,color:'#52677a'}}>Os dados de contacto são opcionais e servem apenas para pedir esclarecimentos sobre esta comunicação.</p>
     <label style={{display:'block',fontWeight:700,color:'#23415b',marginTop:12}}>Nome (opcional)</label>
     <input maxLength={120} style={field} value={form.reporter_name} onChange={e=>setForm(v=>({...v,reporter_name:e.target.value}))}/>
     <label style={{display:'block',fontWeight:700,color:'#23415b',marginTop:12}}>Telefone ou email (opcional)</label>
     <input maxLength={160} style={field} value={form.contact} onChange={e=>setForm(v=>({...v,contact:e.target.value}))}/>
    </div>
    {error&&<div role="alert" style={{marginTop:16,padding:12,borderRadius:9,background:'#fff1f0',color:'#9d2821',fontSize:13}}><AlertTriangle size={16}/> {error}</div>}
    <button type="submit" disabled={busy} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9,width:'100%',marginTop:22,padding:14,border:0,borderRadius:10,background:'#1d5f91',color:'#fff',fontSize:15,fontWeight:700,opacity:busy?.65:1}}><Send size={17}/>{busy?'A enviar…':'Enviar comunicação'}</button>
   </form>}
   <p style={{fontSize:11,color:'#8192a1',lineHeight:1.5,marginTop:22}}>Este formulário serve para comunicar ocorrências ao gestor do empreendimento. Em caso de perigo imediato para pessoas, contacte os serviços de emergência.</p>
  </div>
 </main>;
}