import test from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { openDatabase, issueAccess, receiver } from "../server/receiver.mjs";
import { newAssignedSession, recordAttempt, advanceAssignedSession } from "../web/core.js";
import { TASK_SCHEMA, sessionKey } from "../web/assignments.js";
import { readInvitation, classroomRequest, exchangeClassroom, applyExchange, applyDeliveryAttempt, deliveryStatus } from "../web/classroom.js";

// SQLite stays in memory. JSON snapshots model persisted application state and reload;
// they do not claim an OS crash, browser-storage durability or a human usability test.
// Concurrency uses one live application state, not competing localStorage writes from two tabs.
test("C3: durable delivery intent, three interruption windows and exact 4x3 receipt matrix", async (t) => {
  const metrics={scope:"local HTTP and SQLite memory; production exchangeClassroom/applyExchange",publicRequests:0,
    quota:"Recorded separately in quota ledger; local execution does not measure public quota",cpuMilliseconds:null,requests:0,reportPosts:0,
    targetClosures:12,uniqueLocalClosures:0,explicitRecordReplays:0,additionalIntegrityConcurrencyProbes:0,recoveries:[]};
  const started=performance.now();
  const db=openDatabase(":memory:");
  const classId="class-c3-local", teacherToken="t".repeat(64), profiles=["000101","000102","000103","000104"];
  db.prepare("INSERT INTO rooms(id,name) VALUES(?,?)").run(classId,"C3 sintética");
  issueAccess(db,classId,"teacher",teacherToken);
  const tokens=profiles.map((_,i)=>String(i+1).repeat(64));
  for(const token of tokens)issueAccess(db,classId,"student",token);
  const server=receiver(db);
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  const endpoint=`http://127.0.0.1:${server.address().port}`;
  const link=(role,token)=>readInvitation({schema:"sendero.invitation.v1",classId,role,token,endpoint},role);
  const teacherLink=link("teacher",teacherToken);
  const transport=async(url,options)=>{
    assert.equal(new URL(url).origin,endpoint,"No public network destination permitted");
    metrics.requests++;
    if(new URL(url).pathname==="/reports"&&options.method==="POST")metrics.reportPosts++;
    return fetch(url,options);
  };
  const count=(profile=null)=>profile
    ? db.prepare("SELECT count(*) n FROM sessions WHERE profile=?").get(profile).n
    : db.prepare("SELECT count(*) n FROM sessions").get().n;
  const tasks=[3,6,8].map((table,index)=>({schema:TASK_SCHEMA,classId,id:`c3-task-${index+1}`,version:1,
    title:`Grupos de ${table}`,trail:"multi",contentId:"multiply-fixed-table",contentVersion:1,
    parameters:{table},completionRule:{kind:"answered_items",count:8},recipientProfileIds:profiles,
    assignedAt:new Date().toISOString()}));
  const complete=(task,profile)=>{
    const session=newAssignedSession(task,profile);
    for(let i=0;i<8;i++){
      const question=session.questions[session.index];question.activeMs=1000;
      assert.equal(recordAttempt(question,question.answer),true);advanceAssignedSession(session);
    }
    assert(session.completedAt);return session;
  };
  const snapshots=[], originals=[], results=[];
  const save=(index,state)=>{snapshots[index]=JSON.stringify(state);};
  const load=(index)=>JSON.parse(snapshots[index]);
  const send=async(index,{fetcher=transport,beforePost=false,discardAck=false}={})=>{
    const state=load(index);
    const result=await exchangeClassroom(structuredClone(state),fetcher,{onAttempt:async(event)=>{
      applyDeliveryAttempt(state,event);save(index,state);
      if(beforePost)throw Error("C3 interruption before report POST");
    }});
    applyExchange(state,result);results[index]=result;
    if(!discardAck)save(index,state);
    return state;
  };
  const allStages=(state,stage)=>state.sessions.every((session)=>deliveryStatus(state,session).stage===stage);
  try{
    const current=await classroomRequest(teacherLink,"/tasks",null,transport);
    await classroomRequest(teacherLink,"/tasks",{tasks,expectedRevision:current.revision},transport);
    for(let index=0;index<4;index++){
      const state={profile:profiles[index],sessions:tasks.map((task)=>complete(task,profiles[index])),teacher:[],
        enrollment:{school:"Escuela sintética C3",grade:"3",group:"A",listNumber:index+1},classroom:link("student",tokens[index])};
      originals[index]=JSON.stringify(state.sessions);save(index,state);
      assert(allStages(state,"closed_local"));
    }
    metrics.uniqueLocalClosures=new Set(snapshots.flatMap((snapshot)=>JSON.parse(snapshot).sessions.map(sessionKey))).size;
    assert.equal(metrics.uniqueLocalClosures,12);
    await t.test("before POST: durable intention survives reload but proves neither sending nor receipt",async()=>{
      const before=metrics.reportPosts;
      await assert.rejects(()=>send(0,{beforePost:true}),/before report POST/);
      assert.equal(metrics.reportPosts,before);assert.equal(count(profiles[0]),0);
      assert(allStages(load(0),"send_attempted"));
      assert.equal(Object.keys(load(0).classroom.confirmations||{}).length,0);
      await send(0);assert.equal(count(profiles[0]),3);assert(allStages(load(0),"acknowledged"));
      metrics.recoveries.push({cut:"before-report-post",serverHadCommitted:false,receivedAfterReload:true});
    });
    await t.test("after commit before ack: same payload recovers without a second server record",async()=>{
      const drop=async(url,options)=>{
        const response=await transport(url,options);
        if(new URL(url).pathname==="/reports"&&options.method==="POST"){
          await response.text();throw Error("C3 interruption after commit before ack");
        }
        return response;
      };
      await assert.rejects(()=>send(1,{fetcher:drop}),/after commit before ack/);
      assert.equal(count(profiles[1]),3);assert(allStages(load(1),"send_attempted"));
      await send(1);assert.equal(count(profiles[1]),3);assert(allStages(load(1),"acknowledged"));
      metrics.recoveries.push({cut:"after-commit-before-ack",serverHadCommitted:true,receivedAfterReload:true});
    });
    await t.test("after valid ack before persistence: reload loses local receipt, never the committed report",async()=>{
      const memoryOnly=await send(2,{discardAck:true});
      assert(allStages(memoryOnly,"acknowledged"));assert(allStages(load(2),"send_attempted"));
      assert.equal(count(profiles[2]),3);
      await send(2);assert.equal(count(profiles[2]),3);assert(allStages(load(2),"acknowledged"));
      metrics.recoveries.push({cut:"after-ack-before-persistence",serverHadCommitted:true,receivedAfterReload:true});
    });
    await t.test("fourth profile closes the exact twelve unique assigned reports",async()=>{
      await send(3);assert.equal(count(),12);assert(allStages(load(3),"acknowledged"));
      for(let index=0;index<4;index++){
        const state=load(index);assert.equal(JSON.stringify(state.sessions),originals[index]);
        for(const session of state.sessions){
          const status=deliveryStatus(state,session);
          assert.equal(status.attempt.attemptCount,index<3?2:1);
          assert.equal(status.confirmation.profile,profiles[index]);
        }
      }
    });
    await t.test("twelve explicit one-record replays preserve twelve unique records and recover missing assigned receipts",async()=>{
      const before=metrics.reportPosts;
      for(let index=0;index<4;index++)for(const session of load(index).sessions){
        const state=load(index);delete state.classroom.confirmations[sessionKey(session)];
        // Keep the historical received id: assignment receipts must still be recovered.
        assert(state.classroom.received.includes(session.id));save(index,state);
        await send(index);assert.equal(count(),12);
      }
      metrics.explicitRecordReplays=metrics.reportPosts-before;
      assert.equal(metrics.explicitRecordReplays,12);
      for(let index=0;index<4;index++)assert.equal(JSON.stringify(load(index).sessions),originals[index]);
    });
    await t.test("adulterated ack and incomplete applyExchange cannot create a received marker",async()=>{
      const probe=load(0),session=probe.sessions[0];delete probe.classroom.confirmations[sessionKey(session)];
      let durable=JSON.stringify(probe);
      const tamper=async(url,options)=>{
        const response=await transport(url,options);
        if(new URL(url).pathname!=="/reports"||options.method!=="POST")return response;
        const receipt=await response.json();
        return Response.json({...receipt,classId:"another-class"});
      };
      await assert.rejects(()=>exchangeClassroom(structuredClone(probe),tamper,{onAttempt:async(event)=>{
        applyDeliveryAttempt(probe,event);durable=JSON.stringify(probe);
      }}),/confirmación/);
      assert.equal(deliveryStatus(JSON.parse(durable),session).stage,"send_attempted");assert.equal(count(),12);
      const unchanged=load(0),before=JSON.stringify(unchanged);
      assert.throws(()=>applyExchange(unchanged,{...results[0],confirmations:{}}),/acuse/);
      assert.equal(JSON.stringify(unchanged),before);metrics.additionalIntegrityConcurrencyProbes++;
    });
    await t.test("profile or classroom changed while awaiting must reject a prior-context receipt",async()=>{
      for(const state of [load(1),{...load(0),classroom:{...load(0).classroom,classId:"changed-class"}}]){
        const before=JSON.stringify(state);
        assert.throws(()=>applyExchange(state,results[0]),/acuse|perfil|aula/);
        assert.equal(JSON.stringify(state),before);
      }
    });
      await t.test("same profile and id in an older classroom cannot shadow the current acknowledgement",async()=>{
        const state=load(0), current=state.sessions[0];
        // Collision fixture only: never transmitted and excluded from the 4x3 closure matrix.
        const older=structuredClone(current);older.assignment.classId="previous-class";
        state.sessions.unshift(older);
        const before=JSON.stringify(state.sessions);
        applyExchange(state,results[0]);
        assert.equal(JSON.stringify(state.sessions),before);
        assert.equal(deliveryStatus(state,current).stage,"acknowledged");
        assert.equal(deliveryStatus(state,older).stage,"closed_local");
        assert.equal(state.classroom.confirmations[sessionKey(older)],undefined);
        assert.equal(count(),12);
      });
      await t.test("failure to persist the pre-POST callback prevents sending and invents no receipt",async()=>{
      const probe=load(0),session=probe.sessions[0];delete probe.classroom.confirmations[sessionKey(session)];
      const unchanged=JSON.stringify(probe),before=metrics.reportPosts;
      await assert.rejects(()=>exchangeClassroom(structuredClone(probe),transport,{onAttempt:async()=>{
        throw Error("C3 simulated storage failure");
      }}),/storage failure/);
      assert.equal(metrics.reportPosts,before);assert.equal(JSON.stringify(probe),unchanged);assert.equal(count(),12);
    });
    await t.test("two overlapping retries count two intentions and tolerate reversed response application",async()=>{
      const live=load(0),session=live.sessions[0],key=sessionKey(session);
      delete live.classroom.confirmations[key];
      const baseline=live.classroom.deliveryAttempts[key].attemptCount;
      const source=structuredClone(live);
      const responses=await Promise.all([0,1].map(()=>exchangeClassroom(structuredClone(source),transport,{onAttempt:async(event)=>applyDeliveryAttempt(live,event)})));
      const callbackCount=live.classroom.deliveryAttempts[key].attemptCount;
      assert.equal(callbackCount,baseline+2);
      applyExchange(live,responses[1]);applyExchange(live,responses[0]);
      assert.equal(live.classroom.deliveryAttempts[key].attemptCount,callbackCount);
      assert.equal(deliveryStatus(live,session).stage,"acknowledged");assert.equal(count(),12);
      metrics.additionalIntegrityConcurrencyProbes+=2;
    });
    await t.test("production teacher exchange integrates exactly four profiles times three tasks",async()=>{
      const state={profile:"teacher-c3",sessions:[],teacher:[],classroom:teacherLink};
      const received=await exchangeClassroom(structuredClone(state),transport);applyExchange(state,received);
      const keys=state.teacher.map((session)=>`${session.profile}/${session.assignmentId}@${session.assignmentVersion}`).sort();
      const expected=profiles.flatMap((profile)=>tasks.map((task)=>`${profile}/${task.id}@1`)).sort();
      assert.equal(state.teacher.length,12);assert.deepEqual(keys,expected);assert.equal(count(),12);
      assert.equal(new Set(state.teacher.map(sessionKey)).size,12);
      for(const session of state.teacher)assert(state.teacherConfirmations[sessionKey(session)]);
      metrics.uniqueServerRecords=12;metrics.duplicateServerRecords=0;metrics.teacherReceived=12;metrics.matrixKeys=keys;
      metrics.teacherEvidence={tasks:received.tasks,sessions:received.sessions,confirmations:received.teacherConfirmations,observedAt:received.at};
      assert.equal(metrics.recoveries.length,3);
    });
  }finally{
    await new Promise((resolve)=>server.close(resolve));db.close();
    metrics.elapsedMilliseconds=performance.now()-started;
    if(process.env.C3_METRICS_FILE)await writeFile(process.env.C3_METRICS_FILE,JSON.stringify(metrics,null,2)+"\n");
  }
});
