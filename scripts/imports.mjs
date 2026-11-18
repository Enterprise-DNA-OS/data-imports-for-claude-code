#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
import {page,table as htmlTable,writeOut} from './lib/render.mjs';

export const commands={
 projects:'List project owners, purpose and retention review dates',
 mappings:'List immutable mapping versions', batches:'List incoming batches',
 'batch-review':'Read one batch with its source rows, decisions and history',
 'exception-queue':'List validation failures by owner',
 'approval-queue':'List clean batches awaiting independent review',
 'handover-queue':'List approved batches awaiting local export',
 'retention-review':'List project retention reviews due',
 attention:'List overdue or stale batches', compliance:'Check recorded accuracy and retention controls',
 insights:'Answer ten cross-batch questions', 'weekly-review':'Combine attention, exceptions and approvals',
 activity:'Read the change history',
 'add-project':'Register an import project', 'add-mapping':'Add an immutable mapping version from JSON',
 import:'Import a Dromo CSV result file with an explicit mapping',
 'correct-row':'Correct one field and preserve the original', 'exclude-row':'Exclude a row with a reason',
 'restore-row':'Return an excluded row to validation', validate:'Validate all active rows, including uniqueness',
 approve:'Approve a clean batch as a different operator', reopen:'Remove approval with a reason before handover',
 deliver:'Write an approved CSV locally and record its checksum',
 'review-retention':'Record a new retention review date and purpose',log:'Append a batch note',
 'draft-chase':'Draft a request to resolve batch exceptions',export:'Export all records and history as JSON'
};
const reads=new Set(['projects','mappings','batches','batch-review','exception-queue','approval-queue','handover-queue','retention-review','attention','compliance','insights','weekly-review','activity','draft-chase','export']);
const options={
 'add-project':['code','name','owner','purpose','review-date'], 'add-mapping':['code','name','file'],
 import:['batch','name','project','mapping','due'], 'correct-row':['row','field','value','reason'],
 'exclude-row':['row','reason'], 'restore-row':['row','reason'], approve:['reason'],reopen:['reason'],
 deliver:['out'], 'review-retention':['review-date','purpose','reason'],log:['text'],export:['out']
};
const hash=s=>createHash('sha256').update(s).digest('hex');
const req=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k} is required`);return o[k].trim();};
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Invalid calendar date');return v;}
function parse(argv){let [cmd,...args]=argv;if(!cmd||cmd==='--help'||cmd==='help')return {cmd:'help',o:{},a:[]};const o={},a=[];for(const s of args){if(!s.startsWith('--'))a.push(s);else{const i=s.indexOf('=');const k=s.slice(2,i<0?undefined:i);if(!['json','dry-run','actor',...(options[cmd]||[])].includes(k))throw Error(`Unknown option --${k}`);if(k in o)throw Error(`Duplicate option --${k}`);o[k]=i<0?true:s.slice(i+1);if(['json','dry-run'].includes(k)&&o[k]!==true)throw Error(`--${k} is a boolean switch`);}}return {cmd,o,a};}
async function find(db,t,s){if(!s)throw Error(`Specify ${t}`);const rows=await db.query(`select * from ${t} order by code`);const exact=rows.filter(r=>r.id===s||r.code.toLowerCase()===s.toLowerCase());const hits=exact.length?exact:rows.filter(r=>r.id.startsWith(s.toLowerCase())||r.name.toLowerCase().includes(s.toLowerCase()));if(hits.length!==1){const e=Error(hits.length?'Ambiguous record; choose a code':'Record not found');e.candidates=hits.map(({id,code,name})=>({id,code,name}));throw e;}return hits[0];}
function checkMapping(d){if(!Array.isArray(d)||!d.length||d.length>100)throw Error('Mapping needs 1 to 100 fields');const keys=new Set(),sources=new Set();for(const f of d){if(!f||typeof f!=='object'||Array.isArray(f))throw Error('Invalid mapping field');for(const k of Object.keys(f))if(!['key','source','type','required','unique','trim','lowercase','options','min','max'].includes(k))throw Error(`Unknown mapping property ${k}`);if(!/^[a-z][a-z0-9_]{0,63}$/.test(f.key)||keys.has(f.key))throw Error('Mapping keys must be unique identifiers');keys.add(f.key);if(typeof f.source!=='string'||!f.source.trim()||sources.has(f.source.toLowerCase()))throw Error('Source columns must be unique and nonempty');sources.add(f.source.toLowerCase());if(!['text','email','integer','date','enum'].includes(f.type))throw Error('Unsupported field type');for(const k of ['required','unique','trim','lowercase'])if(f[k]!==undefined&&typeof f[k]!=='boolean')throw Error(`${k} must be boolean`);if(f.type==='enum'&&(!Array.isArray(f.options)||!f.options.length||!f.options.every(x=>typeof x==='string')))throw Error('Enum needs text options');for(const k of ['min','max'])if(f[k]!==undefined&&(!Number.isSafeInteger(f[k])||f.type!=='integer'))throw Error('Integer bounds must be safe integers');if(f.min!==undefined&&f.max!==undefined&&f.min>f.max)throw Error('min exceeds max');}return d;}
export function validateRows(rows,defs){const counts={};for(const d of defs.filter(d=>d.unique)){counts[d.key]=new Map();for(const r of rows.filter(r=>!r.excluded)){const v=String(r.values_json[d.key]??'');if(v)counts[d.key].set(v,(counts[d.key].get(v)||0)+1);}}
 return rows.map(r=>{const errors=[];if(!r.excluded)for(const d of defs){const v=String(r.values_json[d.key]??'');const add=(rule,message)=>errors.push({field:d.key,rule,message});if(!v){if(d.required)add('required','Value is required');continue;}if(d.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))add('email','Expected an email address');if(d.type==='integer'){if(!/^-?\d+$/.test(v)||!Number.isSafeInteger(Number(v)))add('integer','Expected a safe whole number');else{if(d.min!==undefined&&Number(v)<d.min)add('min',`Must be at least ${d.min}`);if(d.max!==undefined&&Number(v)>d.max)add('max',`Must be at most ${d.max}`);}}if(d.type==='date'){try{date(v);}catch{add('date','Expected a valid YYYY-MM-DD date');}}if(d.type==='enum'&&!d.options.includes(v))add('enum',`Expected one of ${d.options.join(', ')}`);if(d.unique&&counts[d.key].get(v)>1)add('unique','Value is duplicated in this batch');}return {...r,errors};});
}
function normalize(value,d){let v=String(value??'');if(d.trim)v=v.trim();if(d.lowercase)v=v.toLowerCase();return v;}
const allTables=['projects','mappings','batches','import_rows','validations','receipts','notes','activity'];
async function rowsFor(db,id){return db.query('select * from import_rows where batch_id=$1 order by row_number',[id]);}
async function editable(db,s){const b=await find(db,'batches',s);if(['approved','delivered'].includes(b.status))throw Error('Batch is locked; reopen approval before editing. Delivered batches require a new batch.');return b;}
async function invalidate(db,id,actor){await db.query("update batches set status='draft',validated_at=null,edited_by=$2 where id=$1",[id,actor]);}
const today=()=>new Date().toISOString().slice(0,10);
const rowNumber=o=>{const v=Number(req(o,'row'));if(!Number.isSafeInteger(v)||v<1)throw Error('Row must be a positive integer');return v;};
async function execute(db,cmd,a,o){
 if(cmd==='help')return commands;
 if(cmd==='projects'||cmd==='mappings')return db.query(`select * from ${cmd} order by code`);
 if(cmd==='batches')return db.query('select * from batch_week order by due_date,code');
 if(cmd==='exception-queue')return db.query('select * from exception_queue order by batch,row_number,field');
 if(cmd==='approval-queue')return db.query("select code,name,project,owner,total_rows,excluded_rows from batch_week where status='validated' order by due_date");
 if(cmd==='handover-queue')return db.query("select code,name,project,approved_by,total_rows,excluded_rows from batch_week where status='approved' order by due_date");
 if(cmd==='retention-review')return db.query('select code,name,owner,purpose,retention_review from projects where retention_review<=current_date order by retention_review');
 if(cmd==='attention')return db.query("select code,project,owner,due_date,status,total_rows,rows_with_errors from batch_week where status<>'delivered' and (due_date<current_date or updated_at<now()-interval '7 days' or rows_with_errors>0) order by due_date,code");
 if(cmd==='compliance')return db.query('select * from compliance_checks order by batch,rule');
 if(cmd==='activity')return db.query('select * from activity order by created_at,id');
 if(cmd==='weekly-review')return {attention:await execute(db,'attention',[],{}),exceptions:await execute(db,'exception-queue',[],{}),approvals:await execute(db,'approval-queue',[],{})};
 if(cmd==='batch-review'){const b=await find(db,'batches',a[0]);return {batch:b,rows:await rowsFor(db,b.id),validations:await db.query('select * from validations where batch_id=$1 order by created_at',[b.id]),receipts:await db.query('select * from receipts where batch_id=$1',[b.id]),notes:await db.query('select * from notes where batch_id=$1 order by created_at',[b.id]),history:await db.query("select * from activity where record_id=$1 or after_value->>'batch_id'=$2 order by created_at,id",[b.id,b.id])};}
 if(cmd==='add-project')return (await db.query('insert into projects(code,name,owner,purpose,retention_review) values($1,$2,$3,$4,$5) returning *',[req(o,'code'),req(o,'name'),req(o,'owner'),req(o,'purpose'),date(req(o,'review-date'))]))[0];
 if(cmd==='add-mapping'){const d=checkMapping(JSON.parse(fs.readFileSync(req(o,'file'),'utf8')));return (await db.query('insert into mappings(code,name,definition) values($1,$2,$3) returning *',[req(o,'code'),req(o,'name'),JSON.stringify(d)]))[0];}
 if(cmd==='import'){
  if(a.length!==2||a[0]!=='dromo')throw Error('Usage: import dromo <results.csv> --batch= --project= --mapping= --due=');
  const file=fs.readFileSync(a[1]);if(file.length>20*1024*1024)throw Error('File exceeds the 20 MiB local importer limit');
  const data=parseCsv(file.toString('utf8'));if(!data.length||data.length>100000)throw Error('CSV must have 1 to 100,000 rows');
  const p=await find(db,'projects',req(o,'project')),m=await find(db,'mappings',req(o,'mapping')),defs=checkMapping(m.definition),code=req(o,'batch'),due=date(req(o,'due'));const digest=hash(file);
  const existing=await db.query('select * from batches where code=$1',[code]);if(existing.length){const b=existing[0];if(b.source_hash===digest&&b.project_id===p.id&&b.mapping_id===m.id&&b.due_date===due)return {replayed:true,batch:code};throw Error('Batch code already used for different input or settings');}
  const headers=Object.keys(data[0]);const columns={};for(const d of defs){const h=headers.find(h=>h.toLowerCase()===d.source.toLowerCase());if(!h)throw Error(`Missing mapped column ${d.source}`);columns[d.key]=h;}
  const b=(await db.query('insert into batches(code,name,project_id,mapping_id,source_hash,source_name,imported_by,edited_by,due_date) values($1,$2,$3,$4,$5,$6,$7,$7,$8) returning *',[code,o.name||code,p.id,m.id,digest,path.basename(a[1]),o.actor,due]))[0];
  for(let i=0;i<data.length;i++){const values=Object.fromEntries(defs.map(d=>[d.key,normalize(data[i][columns[d.key]],d)]));await db.query('insert into import_rows(batch_id,row_number,original,values_json) values($1,$2,$3,$4)',[b.id,i+1,JSON.stringify(data[i]),JSON.stringify(values)]);}
  return {batch:code,rows:data.length,unmapped_columns:headers.filter(h=>!Object.values(columns).includes(h)),status:'draft'};
 }
 if(['correct-row','exclude-row','restore-row'].includes(cmd)){
  const b=await editable(db,a[0]),n=rowNumber(o),reason=req(o,'reason');const rows=await db.query('select * from import_rows where batch_id=$1 and row_number=$2',[b.id,n]);if(!rows.length)throw Error('Row not found');const r=rows[0];
  if(cmd==='correct-row'){const m=(await db.query('select * from mappings where id=$1',[b.mapping_id]))[0];const d=m.definition.find(d=>d.key===req(o,'field'));if(!d)throw Error('Field not in mapping');if(typeof o.value!=='string')throw Error('--value= is required');const v={...r.values_json,[d.key]:normalize(o.value,d)};await db.query('update import_rows set values_json=$2,errors=\'[]\' where id=$1',[r.id,JSON.stringify(v)]);}
  else await db.query('update import_rows set excluded=$2,exclusion_reason=$3,errors=\'[]\' where id=$1',[r.id,cmd==='exclude-row',cmd==='exclude-row'?reason:null]);
  await db.query('insert into notes(batch_id,actor,body) values($1,$2,$3)',[b.id,o.actor,`${cmd} row ${n}: ${reason}`]);await invalidate(db,b.id,o.actor);return {batch:b.code,row:n,status:'draft'};
 }
 if(cmd==='validate'){
  const b=await editable(db,a[0]),m=(await db.query('select definition from mappings where id=$1',[b.mapping_id]))[0];const rows=validateRows(await rowsFor(db,b.id),m.definition);let errors=0,active=0;
  for(const r of rows){errors+=r.errors.length;if(!r.excluded)active++;await db.query('update import_rows set errors=$2 where id=$1',[r.id,JSON.stringify(r.errors)]);}
  if(!active)errors++;
  await db.query('insert into validations(batch_id,actor,accepted_rows,rejected_rows,error_count) values($1,$2,$3,$4,$5)',[b.id,o.actor,rows.filter(r=>!r.excluded&&!r.errors.length).length,rows.filter(r=>r.excluded).length,errors]);
  await db.query('update batches set status=$2,validated_at=now() where id=$1',[b.id,errors?'invalid':'validated']);return {batch:b.code,active_rows:active,excluded_rows:rows.length-active,error_count:errors,status:errors?'invalid':'validated'};
 }
 if(cmd==='approve'){
  const b=await find(db,'batches',a[0]);if(b.status!=='validated')throw Error('Validate a clean, nonempty batch before approval');
  if([b.imported_by,b.edited_by].some(x=>x.trim().toLowerCase()===o.actor.toLowerCase()))throw Error('Independent reviewer must differ from importer and last editor');
  const p=(await db.query('select * from projects where id=$1',[b.project_id]))[0];if(p.retention_review<=today())throw Error('Retention review is due');
  return (await db.query("update batches set status='approved',approved_by=$2,approved_at=now(),approval_note=$3 where id=$1 returning code,status,approved_by",[b.id,o.actor,req(o,'reason')]))[0];
 }
 if(cmd==='reopen'){const b=await find(db,'batches',a[0]);if(b.status!=='approved')throw Error('Only an approved, undelivered batch can reopen');await db.query('insert into notes(batch_id,actor,body) values($1,$2,$3)',[b.id,o.actor,'Reopened: '+req(o,'reason')]);return (await db.query("update batches set status='draft',approved_by=null,approved_at=null,approval_note=null,validated_at=null,edited_by=$2 where id=$1 returning code,status",[b.id,o.actor]))[0];}
 if(cmd==='deliver'){
  const b=await find(db,'batches',a[0]);if(b.status!=='approved')throw Error('Only approved batches can be delivered once');const p=(await db.query('select * from projects where id=$1',[b.project_id]))[0];if(p.retention_review<=today())throw Error('Retention review is due');
  const m=(await db.query('select definition from mappings where id=$1',[b.mapping_id]))[0];const keys=m.definition.map(d=>d.key),rows=(await rowsFor(db,b.id)).filter(r=>!r.excluded);const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  const content=[keys,...rows.map(r=>keys.map(k=>r.values_json[k]))].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
  // Exact machine data, not spreadsheet-safe escaping. Open in a text editor; spreadsheet programs can execute formulas.
  const out=path.resolve(req(o,'out')),digest=hash(content);if(fs.existsSync(out))throw Error('Output already exists; choose a new file');
  await db.query('insert into receipts(batch_id,destination,content_hash,row_count,actor) values($1,$2,$3,$4,$5)',[b.id,out,digest,rows.length,o.actor]);
  await db.query("update batches set status='delivered' where id=$1",[b.id]);
  return {batch:b.code,rows:rows.length,sha256:digest,file:out,_file:content};
 }
 if(cmd==='review-retention'){const p=await find(db,'projects',a[0]);const d=date(req(o,'review-date'));if(d<=today())throw Error('Next review must be in the future');const reason=req(o,'reason');return (await db.query('update projects set retention_review=$2,purpose=$3,last_review_reason=$4,last_reviewed_by=$5 where id=$1 returning *',[p.id,d,req(o,'purpose'),reason,o.actor]))[0];}
 if(cmd==='log'){const b=await find(db,'batches',a[0]);return (await db.query('insert into notes(batch_id,actor,body) values($1,$2,$3) returning *',[b.id,o.actor,req(o,'text')]))[0];}
 if(cmd==='draft-chase'){const b=await find(db,'batches',a[0]);const rows=await db.query('select * from exception_queue where batch=$1 order by row_number,field',[b.code]);if(o['dry-run'])return {batch:b.code,issues:rows.length,sent:false,dry_run:true};const file=writeOut('drafts',`chase-${b.id}-${Date.now()}`,page({title:'Draft data correction request',subtitle:b.code,sections:[{title:'Please review these fields',note:'Fictional demo or internal draft. Verify recipients and records before sharing.',html:htmlTable(rows)}]}));return {file,sent:false,issues:rows.length};}
 if(cmd==='export'){const all={};for(const t of allTables)all[t]=await db.query(`select * from ${t} order by id`);if(o.out){const file=path.resolve(req(o,'out'));if(!o['dry-run'])fs.writeFileSync(file,JSON.stringify(all,null,2)+'\n',{flag:'wx',mode:0o600});return {file,counts:Object.fromEntries(allTables.map(t=>[t,all[t].length])),dry_run:!!o['dry-run']};}return all;}
 if(cmd==='insights'){const queries=[
 ['Which owners have the most rows needing correction?',"select owner,count(*)::integer errors from exception_queue group by owner order by errors desc,owner"],
 ['Which batches are overdue and still unapproved?',"select code,owner,due_date,status from batch_week where due_date<current_date and status not in ('approved','delivered') order by due_date"],
 ['Which fields repeatedly fail validation?',"select field,rule,count(*)::integer failures from exception_queue group by field,rule order by failures desc,field"],
 ['Which batches exclude the largest share of source rows?',"select code,total_rows,excluded_rows,round(100.0*excluded_rows/nullif(total_rows,0),1) excluded_percent from batch_week order by excluded_percent desc nulls last,code"],
 ['Which clean batches are waiting for another reviewer?',"select code,edited_by,total_rows from batch_week where status='validated' order by code"],
 ['Which projects need a retention decision before handover?',"select code,owner,retention_review from projects where retention_review<=current_date order by code"],
 ['Which imported rows have duplicate identifiers?',"select batch,row_number,field from exception_queue where rule='unique' order by batch,row_number"],
 ['Which mapping versions produce the most invalid batches?',"select m.code,count(*)::integer invalid_batches from batches b join mappings m on b.mapping_id=m.id where b.status='invalid' group by m.code order by invalid_batches desc,m.code"],
 ['Which approved batches still lack a handover receipt?',"select code,approved_by,due_date from batch_week where status='approved' order by code"],
 ['Which source files were loaded into more than one batch?',"select source_hash,count(*)::integer batches from batches group by source_hash having count(*)>1 order by source_hash"]
 ];const out=[];for(const [question,sql] of queries)out.push({question,rows:await db.query(sql)});return out;}
 throw Error(`Unknown command ${cmd}`);
}
export async function run(db,argv){const {cmd,a,o}=parse(argv);if(cmd==='help')return commands;if(!commands[cmd])throw Error(`Unknown command ${cmd}`);
 const expected=cmd==='import'?2:['batch-review','correct-row','exclude-row','restore-row','validate','approve','reopen','deliver','review-retention','log','draft-chase'].includes(cmd)?1:0;if(a.length!==expected)throw Error(`Expected ${expected} positional argument(s) for ${cmd}`);
 const mut=!reads.has(cmd);if(mut)o.actor=req(o,'actor');await db.exec(mut?'BEGIN':'BEGIN READ ONLY');let madeFile;
 try{if(mut){await db.exec('LOCK TABLE batches IN EXCLUSIVE MODE');await db.query("select set_config('app.actor',$1,true)",[o.actor]);}
 const res=await execute(db,cmd,a,o);
 if(res?._file!==undefined){const content=res._file;delete res._file;if(!o['dry-run']){fs.writeFileSync(res.file,content,{flag:'wx',mode:0o600});madeFile=res.file;}}
 await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return o['dry-run']?{...res,dry_run:true}:res;
 }catch(e){await db.exec('ROLLBACK');if(madeFile)fs.unlinkSync(madeFile);throw e;}
}
export function format(value){if(Array.isArray(value)){if(!value.length)return '  (none)';if(value[0].question)return value.map(x=>x.question+'\n'+format(x.rows)).join('\n\n');const rows=value.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='object'&&v!==null?JSON.stringify(v):v])));return table(rows,Object.keys(rows[0]).map(key=>({key,label:key,width:60})));}return JSON.stringify(value,null,2);}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{if(process.argv.includes('--help')||process.argv.length===2){console.log(format(Object.entries(commands).map(([command,description])=>({command,description}))));}else{db=await getDb();const out=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(out):format(out));}}catch(e){console.error(process.argv.includes('--json')?JSON.stringify({error:e.message,...(e.candidates?{candidates:e.candidates}:{})}):e.message+(e.candidates?'\n'+format(e.candidates):''));process.exitCode=1;}finally{if(db)await db.close();}}
