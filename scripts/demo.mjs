import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';import {migrate} from './migrate.mjs';import {seed} from './seed.mjs';import {run,format} from './imports.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'data-imports-demo-'));process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(dir,'db');process.env.OUTPUT_DIR=dir;
const db=await getDb();try{await migrate(db);await seed(db);for(const cmd of ['attention','exception-queue','compliance'])console.log(`\n$ npm run imports -- ${cmd}\n${format(await run(db,[cmd]))}`);}finally{await db.close();}
for(const cmd of ['view','docs']){const p=spawnSync(process.execPath,[`scripts/${cmd}.mjs`],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});if(p.status!==0)throw Error(p.stderr||p.stdout);console.log(p.stdout);}
console.log(`Fictional demonstration retained at ${dir}`);
