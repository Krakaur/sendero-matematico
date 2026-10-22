import {REASONING_C9_FAMILIES} from '../web/reasoning-c9.js';
import {task} from './c8-fixtures.mjs';
export const make=(f,v=1)=>({...task('balance'),classId:'c9-local',id:`c9-${f.id.replaceAll('_','-')}-${v}`,title:f.name,contentId:'reasoning-fixed-pack',contentVersion:2,parameters:{family:f.id,level:f.level,variant:v},completionRule:{kind:'answered_items',count:4},recipientProfileIds:['000901','000902','000903','000904']});
export const c9Tasks=()=>REASONING_C9_FAMILIES.flatMap(f=>[1,2].map(v=>make(f,v)));
