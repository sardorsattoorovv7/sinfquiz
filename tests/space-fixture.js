import {readFileSync} from 'node:fs';
import {competition729Fixture,teacher,other,admin,students} from './competition-729-fixture.js';
export {teacher,other,admin,students};
export async function spaceFixture(){const f=await competition729Fixture();await f.db.exec('reset role');for(const path of ['supabase-math-atlas.sql','supabase-migration-7.20.sql','supabase-office-amaliy-fix.sql','supabase-migration-7.30.sql','supabase-migration-7.31.sql'])await f.db.exec(readFileSync(new URL('../'+path,import.meta.url),'utf8'));return {...f,space:(uid,action,payload={})=>f.call(uid,'sq_space',[action,payload])}}
