// Synthetic QA only. Loopback, memory database, disposable known invitations.
import {openDatabase,receiver,issueAccess} from '../server/receiver.mjs';
const db=openDatabase(':memory:');db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run('qa-ui','QA synthetic');
issueAccess(db,'qa-ui','teacher','t'.repeat(64));issueAccess(db,'qa-ui','student','s'.repeat(64));
receiver(db,{origins:['http://127.0.0.1:8768']}).listen(4180,'127.0.0.1',()=>console.log('Synthetic local QA receiver on 4180'));
