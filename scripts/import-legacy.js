import {readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomInt} from 'node:crypto';
import {randomToken,validateQuiz} from '../server/security.js';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
if(existsSync(join(root,'.env')))process.loadEnvFile(join(root,'.env'));
const [source]=process.argv.slice(2);
if(!source)throw Error('Serverni to‘xtating. Ishlatish: node scripts/import-legacy.js OLD_DB_PATH');
const target=join(process.env.SINFQUIZ_DATA_DIR||join(root,'data'),'db.json');
const db=JSON.parse(readFileSync(target,'utf8')),old=JSON.parse(readFileSync(resolve(source),'utf8')),copies=[];
db.quizzes||=[];db.players||=[];db.users||=[];
for(const item of old.quizzes||[]){let pin;do{pin=String(randomInt(100000,1000000))}while([...db.quizzes,...copies].some(q=>q.pin===pin));const quiz=validateQuiz({...item,pin,status:'passive'});copies.push({...quiz,id:randomToken(),ownerId:'local-admin',createdAt:Date.now(),version:1})}
writeFileSync(target+'.backup-'+Date.now(),readFileSync(target),{mode:0o600});db.quizzes.push(...copies);writeFileSync(target+'.tmp',JSON.stringify(db,null,2),{mode:0o600});renameSync(target+'.tmp',target);console.log(`${copies.length} test lokal adminga PASSIVE holatda import qilindi.`);
