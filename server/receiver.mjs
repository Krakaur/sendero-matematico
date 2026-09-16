import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {validateReport,SCHEMA} from '../web/core.js';
import {validateTasks} from '../web/classroom.js';
const digest=s=>createHash('sha256').update(s).digest('hex');
export function openDatabase(path) {
 const db=new DatabaseSync(path);db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY,name TEXT NOT NULL,tasks TEXT NOT NULL DEFAULT '[]');
 CREATE TABLE IF NOT EXISTS access(hash TEXT PRIMARY KEY,room TEXT NOT NULL REFERENCES rooms(id),role TEXT NOT NULL,profile TEXT);
 CREATE TABLE IF NOT EXISTS sessions(room TEXT,profile TEXT,id TEXT,body TEXT NOT NULL,PRIMARY KEY(room,profile,id));`);return db;
}
export function issueAccess(db,room,role,token) {db.prepare('INSERT INTO access(hash,room,role) VALUES(?,?,?)').run(digest(token),room,role);}
export function receiver(db,{origins=[]}={}) {
 return createServer(async(req,res)=>{
  const origin=req.headers.origin;
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  if(origin&&!origins.includes(origin))return json(403,{error:'origin'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.writeHead(204);return res.end();}
  const token=req.headers.authorization?.match(/^Bearer (.{32,200})$/)?.[1];
  const who=token&&db.prepare('SELECT * FROM access WHERE hash=?').get(digest(token));
  if(!who)return json(401,{error:'unauthorized'});
  const body=async()=>{const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>10*1024*1024)throw Error('size');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));};
  try {
   if(req.url==='/tasks'&&req.method==='GET')return json(200,{tasks:JSON.parse(db.prepare('SELECT tasks FROM rooms WHERE id=?').get(who.room).tasks)});
   if(req.url==='/tasks'&&req.method==='POST'&&who.role==='teacher'){
    const tasks=validateTasks((await body()).tasks);db.prepare('UPDATE rooms SET tasks=? WHERE id=?').run(JSON.stringify(tasks),who.room);return json(200,{tasks});
   }
   if(req.url==='/reports'&&req.method==='POST'&&who.role==='student') {
    const report=validateReport(await body());
    if(who.profile&&who.profile!==report.profile)return json(403,{error:'profile'});
    db.exec('BEGIN IMMEDIATE');
    try {
     const bound=db.prepare('SELECT profile FROM access WHERE hash=?').get(who.hash).profile;
     if(bound&&bound!==report.profile)throw Error('profile');
     for(const s of report.sessions){
      const old=db.prepare('SELECT body FROM sessions WHERE room=? AND profile=? AND id=?').get(who.room,report.profile,s.id);
      if(old&&!isDeepStrictEqual(JSON.parse(old.body),s))throw Error('conflict');
      if(!old)db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(who.room,report.profile,s.id,JSON.stringify(s));
     }
     db.prepare('UPDATE access SET profile=? WHERE hash=?').run(report.profile,who.hash);db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
    return json(200,{classId:who.room,profile:report.profile,accepted:report.sessions.map(s=>s.id),receivedAt:new Date().toISOString()});
   }
   if(req.url==='/reports'&&req.method==='GET'&&who.role==='teacher') {
    const grouped=new Map();for(const row of db.prepare('SELECT profile,body FROM sessions WHERE room=?').all(who.room)){if(!grouped.has(row.profile))grouped.set(row.profile,[]);grouped.get(row.profile).push(JSON.parse(row.body));}
    return json(200,{reports:[...grouped].map(([profile,sessions])=>({schema:SCHEMA,profile,sessions}))});
   }
   return json(403,{error:'permission'});
  }catch{return json(400,{error:'invalid_or_conflicting_data'});}
 });
}
