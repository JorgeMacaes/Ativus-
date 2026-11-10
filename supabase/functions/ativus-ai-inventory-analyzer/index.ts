import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
function norm(v:string){return (v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
function b64(bytes:Uint8Array){let s="";for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s);}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Método não permitido."},405);
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
 if(!token)return json({error:"Sessão não autenticada."},401);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),key=Deno.env.get("OPENAI_API_KEY");
 if(!url||!anon||!service||!key)return json({error:"Configuração de servidor incompleta."},500);
 const userDb=createClient(url,anon,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false}});
 const {data:{user},error:userErr}=await userDb.auth.getUser(token);
 if(userErr||!user)return json({error:"Sessão inválida."},401);
 const {levantamento_id,tarefa_id}=await req.json().catch(()=>({}));
 if(!levantamento_id)return json({error:"Indica o levantamento a analisar."},400);
 const {data:survey,error:surveyErr}=await userDb.from("ai_levantamentos").select("id,empreendimento_id,titulo,descricao").eq("id",levantamento_id).single();
 if(surveyErr||!survey)return json({error:"Não tens acesso a este levantamento."},403);
 const admin=createClient(url,service,{auth:{persistSession:false}});
 let requestedJob:any=null;
 if(tarefa_id){
  const {data:j,error:je}=await admin.from("ai_processamentos_documento").select("id,documento_id,estado,tentativas,max_tentativas").eq("id",tarefa_id).eq("levantamento_id",levantamento_id).maybeSingle();
  if(je||!j||j.estado!=="pendente")return json({error:"Tarefa pendente não encontrada ou indisponível."},404);
  if(j.tentativas>=j.max_tentativas)return json({error:"Limite de tentativas atingido."},409);
  requestedJob=j;
 }
 let docsQuery=userDb.from("ai_documentos").select("id,nome_ficheiro,caminho_storage,mime_type,tamanho_bytes").eq("levantamento_id",levantamento_id);
 if(requestedJob)docsQuery=docsQuery.eq("id",requestedJob.documento_id);
 const {data:docs,error:docsErr}=await docsQuery;
 if(docsErr)return json({error:docsErr.message},500);
 if(!docs?.length)return json({error:"Este levantamento ainda não tem documentos."},400);
 let total=0;const results:any[]=[];
 await admin.from("ai_levantamentos").update({estado:"em_analise"}).eq("id",levantamento_id);
 for(const doc of docs){
  let jobId:string|null=null;
  if(requestedJob){
   jobId=requestedJob.id;
   const {error:claimError}=await admin.from("ai_processamentos_documento").update({estado:"em_execucao",iniciado_em:new Date().toISOString(),concluido_em:null,erro:null,tentativas:requestedJob.tentativas+1,atualizado_em:new Date().toISOString()}).eq("id",jobId).eq("estado","pendente");
   if(claimError){results.push({documento:doc.nome_ficheiro,estado:"erro",mensagem:claimError.message});continue;}
  }else{
   const {data:job}=await admin.from("ai_processamentos_documento").insert({levantamento_id,documento_id:doc.id,tipo_tarefa:"extracao",estado:"em_execucao",iniciado_em:new Date().toISOString(),tentativas:1}).select("id").single();
   jobId=job?.id||null;
  }
  const mime=String(doc.mime_type||"").toLowerCase(),name=doc.nome_ficheiro.toLowerCase();
  const pdf=mime==="application/pdf"||name.endsWith(".pdf"),img=mime.startsWith("image/")||/\.(png|jpe?g|webp|tiff?)$/i.test(name);
  const ifc=name.endsWith(".ifc")||mime==="application/x-step"||mime==="application/ifc",dxf=name.endsWith(".dxf")||mime==="application/dxf";
  if(!pdf&&!img&&!ifc&&!dxf){await admin.from("ai_documentos").update({estado_extracao:"nao_suportado",erro_extracao:"Conversor específico ainda não integrado."}).eq("id",doc.id);if(jobId)await admin.from("ai_processamentos_documento").update({estado:"erro",erro:"Formato ainda não suportado.",concluido_em:new Date().toISOString()}).eq("id",jobId);results.push({documento:doc.nome_ficheiro,estado:"formato_pendente",mensagem:"Ficheiro guardado; conversão/análise deste formato ainda por implementar."});continue;}
  if((doc.tamanho_bytes||0)>20*1024*1024){await admin.from("ai_documentos").update({estado_extracao:"nao_suportado",erro_extracao:"Limite de análise automática: 20 MB."}).eq("id",doc.id);if(jobId)await admin.from("ai_processamentos_documento").update({estado:"erro",erro:"Limite de análise automática: 20 MB.",concluido_em:new Date().toISOString()}).eq("id",jobId);results.push({documento:doc.nome_ficheiro,estado:"limite",mensagem:"Limite de análise automática: 20 MB."});continue;}
  const {data:analysis,error:ae}=await admin.from("ai_analises").insert({levantamento_id,documento_id:doc.id,fornecedor:"OpenAI",modelo:"gpt-4.1",versao_prompt:"inventario-0.1",estado:"em_execucao",iniciada_em:new Date().toISOString()}).select("id").single();
  if(ae){results.push({documento:doc.nome_ficheiro,estado:"erro",mensagem:ae.message});continue;}
  try{
   await admin.from("ai_documentos").update({estado_extracao:"em_processamento",metodo_extracao:ifc?"ifc_native":dxf?"dxf_native":pdf?"openai_pdf":"openai_vision",formato_detectado:ifc?"ifc":dxf?"dxf":pdf?"pdf":"imagem",erro_extracao:null}).eq("id",doc.id);
   const {data:file,error:de}=await admin.storage.from("ativus-ai-documentos").download(doc.caminho_storage);
   if(de||!file)throw new Error(de?.message||"Não foi possível descarregar o ficheiro.");
   const data=b64(new Uint8Array(await file.arrayBuffer()));
   let parsed:any;let elements:any[];
   if(ifc){
    const source=new TextDecoder().decode(new Uint8Array(await file.arrayBuffer()));
    const records=new Map<number,{cls:string,args:string[]}>();
    const splitArgs=(raw:string)=>{const out:string[]=[];let cur="",quoted=false,depth=0;for(let i=0;i<raw.length;i++){const ch=raw[i];if(ch==="'"&&(i===0||raw[i-1]!=="\\") )quoted=!quoted;if(!quoted){if(ch==="(")depth++;if(ch===")")depth--;if(ch===","&&depth===0){out.push(cur.trim());cur="";continue;}}cur+=ch;}out.push(cur.trim());return out;};
    const entityStart=/#(\d+)\s*=\s*(IFC[A-Z0-9_]+)\s*\(/g;
    let match:RegExpExecArray|null;
    while((match=entityStart.exec(source))!==null){
     const id=Number(match[1]),cls=match[2],begin=entityStart.lastIndex;let depth=1,quoted=false,end=begin;
     for(;end<source.length;end++){const ch=source[end];if(ch==="'"&&(end===0||source[end-1]!=="\\") ){if(quoted&&source[end+1]==="'"){end++;continue;}quoted=!quoted;continue;}if(quoted)continue;if(ch==="(")depth++;else if(ch===")"){depth--;if(depth===0)break;}}
     if(depth!==0)continue;
     records.set(id,{cls,args:splitArgs(source.slice(begin,end))});
     entityStart.lastIndex=end+1;
    }
    const chosen=(cls:string)=>cls==="IFCBUILDING"||cls==="IFCSITE"||cls==="IFCBRIDGE"||cls==="IFCRAILWAY"||cls==="IFCROAD"||cls==="IFCMARINEFACILITY"||cls==="IFCDAM";
    const spaces=(cls:string)=>cls==="IFCBUILDINGSTOREY"||cls==="IFCSPACE"||cls==="IFCZONE";
    const physical=/^IFC(WALL|WALLSTANDARDCASE|SLAB|BEAM|COLUMN|DOOR|WINDOW|ROOF|STAIR|STAIRFLIGHT|RAMP|RAMPFLIGHT|RAILING|CURTAINWALL|FOOTING|PILE|MEMBER|PLATE|FURNISHINGELEMENT|DISTRIBUTIONELEMENT|FLOW[A-Z]+|CHIMNEY|COVERING|FURNITURE|TRANSPORTELEMENT)/;
    const objects=[...records.entries()].filter(([id,r])=>chosen(r.cls)||spaces(r.cls)||physical.test(r.cls)).slice(0,5000);
    const parentByChild=new Map<number,number>();
    for(const [id,r] of records){if(r.cls==="IFCRELAGGREGATES"&&r.args.length>5){const parent=Number((r.args[4].match(/#(\d+)/)||[])[1]);for(const m of r.args[5].matchAll(/#(\d+)/g))parentByChild.set(Number(m[1]),parent);}if(r.cls==="IFCRELCONTAINEDINSPATIALSTRUCTURE"&&r.args.length>5){const parent=Number((r.args[5].match(/#(\d+)/)||[])[1]);for(const m of r.args[4].matchAll(/#(\d+)/g))parentByChild.set(Number(m[1]),parent);}}
    const indexById=new Map(objects.map(([id],i)=>[id,i]));
    elements=objects.slice(0,80).map(([id,r],i)=>{const name=(r.args[2]||"").replace(/^'|'$/g,"").replace(/''/g,"'");const description=(r.args[3]||"").replace(/^'|'$/g,"");const parentId=parentByChild.get(id);return {tipo_elemento:chosen(r.cls)?"ativo":spaces(r.cls)?"espaco":"componente",nome:name&&name!=="$"?name:r.cls.replace(/^IFC/,"").replace(/([A-Z])/g," $1").trim(),codigo:r.args[0]?.replace(/^'|'$/g,"")||String(id),descricao:description&&description!=="$"?description:r.cls,localizacao:null,parent_index:indexById.has(parentId)&&indexById.get(parentId)<80?indexById.get(parentId):null,confianca:0.98,evidencia:{identificador_ifc:"#"+id,classe_ifc:r.cls,global_id:r.args[0]||null,excerto_textual:r.cls}};});
    parsed={resumo:"Extração nativa IFC: "+records.size+" entidades STEP identificadas; "+elements.length+" elementos de inventário extraídos. A geometria detalhada e os conjuntos de propriedades não são convertidos nesta versão.",elementos};
   }else if(dxf){
    const source=new TextDecoder().decode(new Uint8Array(await file.arrayBuffer()));
    const lines=source.split(/\r?\n/),pairs:{code:string,value:string}[]=[];
    for(let i=0;i+1<lines.length;i+=2)pairs.push({code:lines[i].trim(),value:lines[i+1].trim()});
    let inEntities=false,current:any=null;const entities:any[]=[];
    for(const pair of pairs){
     if(pair.code==="2"&&pair.value==="ENTITIES"){inEntities=true;continue;}
     if(inEntities&&pair.code==="0"&&pair.value==="ENDSEC"){if(current)entities.push(current);break;}
     if(!inEntities)continue;
     if(pair.code==="0"){if(current)entities.push(current);current={type:pair.value,values:{}};continue;}
     if(current){(current.values[pair.code]??=[]).push(pair.value);}
    }
    const layers=new Map<string,number>();const extracted:any[]=[];
    for(const entity of entities){
     const v=entity.values||{},layer=(v["8"]||["0"])[0],type=entity.type;
     layers.set(layer,(layers.get(layer)||0)+1);
     if(type==="INSERT"){
      const block=(v["2"]||[])[0];if(block&&block!=="*Model_Space"&&block!=="*Paper_Space")extracted.push({tipo_elemento:"componente",nome:block,codigo:"DXF-INS-"+extracted.length,categoria:layer,localizacao:[v["10"]?.[0]&&"X "+v["10"][0],v["20"]?.[0]&&"Y "+v["20"][0],v["30"]?.[0]&&"Z "+v["30"][0]].filter(Boolean).join(" · ")||null,descricao:"Bloco CAD inserido no desenho",confianca:0.9,evidencia:{tipo_entidade:"INSERT",camada:layer,bloco:block}});
     }else if(type==="TEXT"||type==="MTEXT"){
      const label=(v["1"]||[]).join(" ").replace(/\\P/g," ").replace(/[{}]/g,"").trim();
      if(label.length>=4&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(label)&&extracted.length<80)extracted.push({tipo_elemento:"espaco",nome:label.slice(0,250),categoria:layer,localizacao:[v["10"]?.[0]&&"X "+v["10"][0],v["20"]?.[0]&&"Y "+v["20"][0]].filter(Boolean).join(" · ")||null,descricao:"Texto ou identificação extraída do desenho CAD",confianca:0.75,evidencia:{tipo_entidade:type,camada:layer}});
     }
    }
    elements=extracted.slice(0,80);
    parsed={resumo:"Extração nativa DXF: "+entities.length+" entidades geométricas/textuais em "+layers.size+" camada(s). Foram identificados "+elements.length+" blocos e rótulos. A geometria não é convertida em medições certificadas.",elementos};
   }else{
    const prompt=`És especialista sénior em inventário técnico de edifícios e infraestruturas. Analisa o documento e propõe apenas elementos efetivamente visíveis ou documentados. Cria hierarquia ativo, componente e subcomponente. Identifica sistemas construtivos, equipamentos, materiais, características, dimensões e localização. Não inventes dados nem completes lacunas por suposição. Para cada elemento devolve tipo_elemento (ativo, componente, subcomponente, equipamento ou espaco), nome, codigo se visível, categoria, material, descricao, localizacao, piso_nivel, zona, eixo_ou_referencia, dimensoes como objeto com valores e unidades, caracteristicas como objeto, sistema_associado, fabricante, modelo, norma_referencia, parent_index (índice do elemento-pai na lista ou null), confianca entre 0 e 1 e evidencia como objeto com numero_pagina_ou_folha, identificador_desenho, zona_da_pagina, excerto_textual e descricao_visual. Distingue sempre dados explícitos de inferências; não atribuas valores não visíveis. Não cries patologias sem evidência explícita. Responde exclusivamente em JSON com campos resumo e elementos (lista). Máximo 80 elementos. Português europeu. Para cada elemento devolve também perguntas_para_utilizador: lista curta de perguntas específicas apenas para campos importantes que não sejam determináveis pelas fontes. Não perguntes por campos já documentados. Contexto e respostas fornecidos pelo utilizador (trata-os como informação declarada, não como observação visual): ${String(survey.descricao||'').slice(0,12000)}. Usa este contexto para completar os campos quando for relevante e identifica no resultado o que foi declarado pelo utilizador.`;
    const content:any[]=[{type:"input_text",text:prompt}];
    if(pdf)content.push({type:"input_file",filename:doc.nome_ficheiro,file_data:"data:application/pdf;base64,"+b64(new Uint8Array(await file.arrayBuffer()))});
    else content.push({type:"input_image",image_url:"data:"+mime+";base64,"+b64(new Uint8Array(await file.arrayBuffer())),detail:"high"});
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4.1",input:[{role:"user",content}],text:{format:{type:"json_object"}},temperature:0})});
    if(!response.ok)throw new Error("OpenAI HTTP "+response.status+": "+(await response.text()).slice(0,400));
    const payload=await response.json();const output=(payload.output||[]).flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==="output_text")?.text;
    if(!output)throw new Error("A IA não devolveu conteúdo estruturado.");
    parsed=JSON.parse(output);elements=Array.isArray(parsed.elementos)?parsed.elementos:[];
   }
   const fragments:any[]=[];
   if(parsed.resumo)fragments.push({levantamento_id,documento_id:doc.id,ordem:0,tipo_fragmento:"resumo",conteudo:String(parsed.resumo),referencia_origem:{documento:doc.nome_ficheiro}});
   elements.forEach((el:any,index:number)=>{const ev=el?.evidencia||{};const textParts=[el?.nome,el?.codigo,el?.categoria,el?.material,el?.descricao,el?.localizacao,el?.piso_nivel,el?.zona,el?.sistema_associado].filter(Boolean);if(textParts.length)fragments.push({levantamento_id,documento_id:doc.id,ordem:index+1,tipo_fragmento:"elemento_tecnico",conteudo:textParts.join(" | "),pagina:Number.isInteger(ev.numero_pagina_ou_folha)?ev.numero_pagina_ou_folha:null,referencia_origem:{documento:doc.nome_ficheiro,evidencia:ev},metadados:{tipo_elemento:el.tipo_elemento,codigo:el.codigo||null}});});
   if(fragments.length){const {error:fragmentError}=await admin.from("ai_fragmentos_documento").upsert(fragments,{onConflict:"documento_id,ordem"});if(fragmentError)throw new Error("Falha ao indexar conteúdo documental: "+fragmentError.message);}

   const indexed=elements.map((x:any,index:number)=>({...x,_source_index:index}));
   const rows=indexed.filter((x:any)=>x&&["ativo","componente","subcomponente","equipamento","espaco"].includes(x.tipo_elemento)&&x.nome).map((x:any)=>({levantamento_id,analise_id:analysis.id,documento_id:doc.id,tipo_elemento:x.tipo_elemento,dados_propostos:{nome:String(x.nome).slice(0,250),codigo:x.codigo||null,categoria:x.categoria||null,material:x.material||null,descricao:x.descricao||null,caracteristicas:x.caracteristicas||{},dimensoes:x.dimensoes||{},piso_nivel:x.piso_nivel||null,zona:x.zona||null,eixo_ou_referencia:x.eixo_ou_referencia||null,sistema_associado:x.sistema_associado||null,fabricante:x.fabricante||null,modelo:x.modelo||null,norma_referencia:x.norma_referencia||null,parent_index:Number.isInteger(x.parent_index)?x.parent_index:null,perguntas_para_utilizador:Array.isArray(x.perguntas_para_utilizador)?x.perguntas_para_utilizador.filter((q:any)=>typeof q==='string').slice(0,6):[],source_index:x._source_index},localizacao_proposta:x.localizacao||null,confianca:Math.max(0,Math.min(1,Number(x.confianca)||0)),estado_revisao:"por_rever",evidencia:{documento:doc.nome_ficheiro,referencia:x.evidencia||null,origem:"analise_ia"}}));
   if(rows.length){const inserted:any[]=[];for(const row of rows){const key=norm(row.tipo_elemento)+"|"+norm(row.dados_propostos.nome)+"|"+norm(row.localizacao_proposta||"");const {data:existing}=await admin.from("ai_elementos_propostos").select("id,dados_propostos,evidencia,confianca").eq("levantamento_id",levantamento_id).eq("chave_consolidacao",key).neq("estado_revisao","rejeitado").limit(1).maybeSingle();if(existing){const ev=Array.isArray(existing.evidencia?.fontes)?existing.evidencia.fontes:[existing.evidencia].filter(Boolean);const merged={...existing.dados_propostos,...Object.fromEntries(Object.entries(row.dados_propostos).filter(([k,v])=>v!==null&&v!==""&&v!==undefined))};const {data:updated,error:ue}=await admin.from("ai_elementos_propostos").update({dados_propostos:merged,evidencia:{...existing.evidencia,fontes:[...ev,{documento:doc.nome_ficheiro,referencia:row.evidencia.referencia}]},confianca:Math.max(Number(existing.confianca)||0,row.confianca||0)}).eq("id",existing.id).select("id,dados_propostos").single();if(ue)throw new Error("Falha ao consolidar evidência: "+ue.message);inserted.push(updated);}else{const {data:created,error:ie}=await admin.from("ai_elementos_propostos").insert({...row,chave_consolidacao:key}).select("id,dados_propostos").single();if(ie)throw new Error("Falha ao guardar proposta: "+ie.message);inserted.push(created);}}const bySource=new Map(inserted.map((r:any)=>[r.dados_propostos?.source_index,r.id]));for(const row of inserted){const parentId=bySource.get(row.dados_propostos?.parent_index);if(parentId&&parentId!==row.id)await admin.from("ai_elementos_propostos").update({proposta_pai_id:parentId}).eq("id",row.id);}}
   total+=rows.length;
   await admin.from("ai_analises").update({estado:"concluida",resultado:{resumo:parsed.resumo||"",elementos_identificados:elements.length,propostas_guardadas:rows.length},concluida_em:new Date().toISOString()}).eq("id",analysis.id);
   await admin.from("ai_documentos").update({estado:"processado",estado_extracao:"concluido",extraido_em:new Date().toISOString(),ultima_tentativa_extracao:new Date().toISOString(),numero_tentativas_extracao:1,versao_extrator:"inventario-0.1"}).eq("id",doc.id);if(jobId)await admin.from("ai_processamentos_documento").update({estado:"concluida",resultado:{propostas:rows.length},concluido_em:new Date().toISOString()}).eq("id",jobId);
   results.push({documento:doc.nome_ficheiro,estado:"concluida",propostas:rows.length,resumo:parsed.resumo||""});
  }catch(e){const msg=String(e);await admin.from("ai_analises").update({estado:"erro",erro:msg,concluida_em:new Date().toISOString()}).eq("id",analysis.id);await admin.from("ai_documentos").update({estado:"erro",estado_extracao:"erro",erro_extracao:msg,ultima_tentativa_extracao:new Date().toISOString(),numero_tentativas_extracao:1}).eq("id",doc.id);if(jobId)await admin.from("ai_processamentos_documento").update({estado:"erro",erro:msg,concluido_em:new Date().toISOString()}).eq("id",jobId);results.push({documento:doc.nome_ficheiro,estado:"erro",mensagem:msg});}
 }
 await admin.from("ai_levantamentos").update({estado:results.some(x=>x.estado==="concluida")?"em_revisao":"erro"}).eq("id",levantamento_id);
 return json({ok:true,levantamento_id,documentos_analisados:results.filter(x=>x.estado==="concluida").length,propostas:total,resultados:results});
});