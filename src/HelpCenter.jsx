import React,{useEffect,useMemo,useState} from 'react';
import {BookOpen,Search,ChevronDown,Headset,Plus,RefreshCw,Send,LifeBuoy,FileText,ShieldCheck,Clock3,AlertCircle} from 'lucide-react';
import {supabase} from './lib/supabase.js';

const topics=[
 {category:'Primeiros passos',icon:'01',items:[
  ['Como iniciar sessão?','Introduza o endereço de e-mail e a palavra-passe atribuídos. Se não conseguir entrar, utilize a recuperação de palavra-passe ou abra um pedido de apoio.'],
  ['Como funciona a organização dos dados?','O Empreendimento é o elemento agregador. Os ativos, componentes, inspeções, patologias e trabalhos devem ficar associados ao respetivo empreendimento.'],
  ['Os dados ficam guardados no telemóvel?','A versão de demonstração pode guardar alguns registos localmente. A utilização partilhada exige ligação ao Supabase e permissões válidas. Confirme sempre o indicador de ligação.']
 ]},
 {category:'Empreendimentos e inventário',icon:'02',items:[
  ['Como criar um empreendimento?','Abra Empreendimentos, escolha Novo empreendimento e preencha o nome, localização e tipo. Guarde e confirme que aparece na lista.'],
  ['Como registar um ativo?','Abra Ativos / Inventário e escolha Novo Ativo. Associe o ativo ao empreendimento correto e preencha a identificação e localização.'],
  ['Qual é a relação entre ativo e componente?','O ativo representa o elemento principal inventariado. Os componentes e subcomponentes detalham os elementos que serão observados nas inspeções.']
 ]},
 {category:'Inspeções e patologias',icon:'03',items:[
  ['Que tipos de inspeção existem?','A plataforma contempla inspeções de rotina, principais e especiais. O tipo e o âmbito devem corresponder ao objetivo técnico da inspeção.'],
  ['Como registar uma patologia?','Registe a localização e o componente afetado, descreva a anomalia, identifique a causa e consequência quando conhecidas e classifique a gravidade.'],
  ['O que significa EC?','EC é a classe de estado de conservação. A classificação deve seguir os critérios técnicos definidos para o ativo e respetivos componentes.']
 ]},
 {category:'Trabalhos e planeamento',icon:'04',items:[
  ['Como transformar uma patologia em trabalho?','A patologia identificada deve originar uma proposta de intervenção, com descrição, unidade, quantidade, estimativa de custo e prioridade, quando aplicável.'],
  ['Como acompanhar intervenções?','Utilize o planeamento e os estados dos trabalhos para acompanhar responsáveis, prazos, execução e conclusão.']
 ]},
 {category:'Conta e segurança',icon:'05',items:[
  ['Quem pode consultar os dados?','O acesso depende do utilizador, da entidade a que pertence e do perfil atribuído. As políticas de segurança da base de dados limitam os registos visíveis.'],
  ['Como pedir ajuda?','Abra Ativus Help Desk, descreva o assunto e o problema, selecione a prioridade e acompanhe as respostas no mesmo pedido.']
 ]}
];

export function HelpCenter(){
 const [query,setQuery]=useState('');
 const [open,setOpen]=useState('Como funciona a organização dos dados?');
 const visible=useMemo(()=>topics.map(group=>({...group,items:group.items.filter(([q,a])=>(q+' '+a+' '+group.category).toLowerCase().includes(query.toLowerCase()))})).filter(g=>g.items.length),[query]);
 return <section className="content help-center">
  <div className="help-hero"><div className="help-hero-icon"><BookOpen size={28}/></div><div><span className="help-kicker">SEVEN M ATIVUS · APOIO AO UTILIZADOR</span><h2>Centro de Ajuda</h2><p>Encontre orientações práticas para utilizar a plataforma com confiança.</p></div></div>
  <div className="help-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar no manual e nas perguntas frequentes…"/></div>
  <div className="help-layout"><aside className="help-categories"><h3>Manual do utilizador</h3>{topics.map(t=><div key={t.category} className="help-category"><span>{t.icon}</span>{t.category}</div>)}</aside><div className="help-articles">{visible.map(group=><section className="help-group" key={group.category}><h3>{group.category}</h3>{group.items.map(([q,a])=><article className="help-article" key={q}><button onClick={()=>setOpen(open===q?'':q)} aria-expanded={open===q}><span>{q}</span><ChevronDown size={18}/></button>{open===q&&<p>{a}</p>}</article>)}</section>)}{!visible.length&&<div className="help-empty">Não encontrámos resultados. Experimente outras palavras.</div>}</div></div>
  <div className="help-bottom"><div><LifeBuoy size={21}/><div><strong>Precisa de assistência personalizada?</strong><span>Abra um pedido no Ativus Help Desk e acompanhe a resolução.</span></div></div><button className="primary" onClick={()=>window.dispatchEvent(new CustomEvent('ativus:navigate',{detail:'helpdesk'}))}>Abrir Help Desk <Headset size={16}/></button></div>
 </section>;
}

export function HelpDesk(){
 const [tickets,setTickets]=useState([]),[entities,setEntities]=useState([]),[isAdmin,setIsAdmin]=useState(false);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [form,setForm]=useState({entidade_id:'',assunto:'',categoria:'utilizacao',prioridade:'normal',descricao:''});
 const load=async()=>{
  if(!supabase){setError('A ligação ao serviço de dados não está configurada.');setLoading(false);return}
  setLoading(true);setError('');
  try{
   const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('Inicie sessão para consultar o Help Desk.');
   const [members,admin]=await Promise.all([
    supabase.from('membros_entidade').select('entidade_id,entidades(id,nome)').eq('utilizador_id',user.id).eq('ativo',true),
    supabase.from('administradores_plataforma').select('utilizador_id').eq('utilizador_id',user.id).maybeSingle()
   ]);
   if(members.error)throw members.error;if(admin.error)throw admin.error;
   const list=(members.data||[]).map(x=>x.entidades).filter(Boolean);setEntities(list);setIsAdmin(!!admin.data);
   if(list.length)setForm(v=>({...v,entidade_id:v.entidade_id||list[0].id}));
   const result=await supabase.from('ativus_tickets').select('id,entidade_id,assunto,categoria,prioridade,estado,criado_em,entidades(nome)').order('criado_em',{ascending:false}).limit(100);
   if(result.error)throw result.error;setTickets(result.data||[]);
  }catch(e){setError(e.message||'Não foi possível carregar os pedidos.')}
  finally{setLoading(false)}
 };
 useEffect(()=>{load()},[]);
 const submit=async e=>{
  e.preventDefault();setSaving(true);setError('');setMessage('');
  try{
   const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('A sessão expirou. Inicie sessão novamente.');
   const {data,error:insertError}=await supabase.from('ativus_tickets').insert({...form,criado_por:user.id}).select('id').single();
   if(insertError)throw insertError;
   setForm(v=>({...v,assunto:'',descricao:'',prioridade:'normal'}));setMessage('Pedido registado com sucesso. Referência: '+data.id.slice(0,8).toUpperCase());await load();
  }catch(e){setError(e.message||'Não foi possível registar o pedido.')}
  finally{setSaving(false)}
 };
 const statusLabel={novo:'Novo',em_analise:'Em análise',atribuido:'Atribuído',aguarda_utilizador:'A aguardar utilizador',resolvido:'Resolvido',encerrado:'Encerrado'};
 return <section className="content helpdesk">
  <div className="helpdesk-heading"><div><span className="help-kicker">SEVEN M ATIVUS · ASSISTÊNCIA</span><h2>Ativus Help Desk</h2><p>Pedidos de assistência técnica e funcional, com acompanhamento centralizado.</p></div><button className="secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button></div>
  <div className="helpdesk-grid"><form className="panel ticket-form" onSubmit={submit}><div className="panelhead"><div><h3><Plus size={17}/> Novo pedido de assistência</h3><span>Descreva a dificuldade para a equipa Seven M.</span></div><span className="charttag">Novo pedido</span></div>
   {entities.length>1&&<label>Entidade<select required value={form.entidade_id} onChange={e=>setForm({...form,entidade_id:e.target.value})}>{entities.map(x=><option value={x.id} key={x.id}>{x.nome}</option>)}</select></label>}
   {!entities.length&&!isAdmin&&<div className="help-alert"><AlertCircle size={18}/> A sua conta ainda não está associada a uma entidade. Solicite ao administrador a atribuição de acesso.</div>}
   <label>Assunto<input required minLength={5} maxLength={180} value={form.assunto} onChange={e=>setForm({...form,assunto:e.target.value})} placeholder="Ex.: Não consigo concluir uma inspeção"/></label>
   <div className="ticket-fields"><label>Categoria<select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}><option value="utilizacao">Dúvida de utilização</option><option value="erro_tecnico">Erro técnico</option><option value="acesso">Acesso e permissões</option><option value="dados">Dados e registos</option><option value="sugestao">Sugestão de melhoria</option><option value="outro">Outro</option></select></label><label>Prioridade<select value={form.prioridade} onChange={e=>setForm({...form,prioridade:e.target.value})}><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label></div>
   <label>Descrição<textarea required minLength={10} maxLength={10000} rows={5} value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} placeholder="Indique os passos realizados, o resultado esperado e o que aconteceu."/></label>
   <button className="primary" type="submit" disabled={saving||(!entities.length&&!isAdmin)}><Send size={16}/>{saving?'A enviar…':'Enviar pedido'}</button>
   {message&&<p className="ticket-success">{message}</p>}{error&&<p className="ticket-error">{error}</p>}
  </form><div className="panel ticket-list"><div className="panelhead"><div><h3><Headset size={17}/> Pedidos registados</h3><span>{isAdmin?'Fila de suporte Seven M':'Histórico da sua entidade'}</span></div><span className="charttag">{tickets.length} pedidos</span></div>
   {loading?<p className="empty">A carregar pedidos…</p>:tickets.length?tickets.map(t=><div className="ticket-row" key={t.id}><div className="ticket-row-top"><strong>{t.assunto}</strong><span className={'ticket-status status-'+t.estado}>{statusLabel[t.estado]||t.estado}</span></div><p>{t.entidades?.nome||'Entidade'} · {new Date(t.criado_em).toLocaleDateString('pt-PT')}</p><small>{t.categoria.replaceAll('_',' ')} · Prioridade {t.prioridade}</small></div>):<p className="empty">Ainda não existem pedidos de assistência.</p>}
  </div></div>
  <p className="helpdesk-note"><ShieldCheck size={16}/> Os pedidos são isolados por entidade. A equipa interna de suporte, com perfil de administração da plataforma, poderá consultar e gerir os pedidos.</p>
 </section>;
}
