import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { openDatabase, issueAccess, receiver } from "../server/receiver.mjs";
import { SCHEMA, newSession, newAssignedSession, recordAttempt, recordSupport, advanceAssignedSession, mergeSessions } from "../web/core.js";
import { TASK_SCHEMA } from "../web/assignments.js";

// One transient runtime per backend; no public endpoint, deployment or large fixtures.
const measurements = { scope:"local synthetic C2 backend fixtures", publicRequests:0, cpuMilliseconds:null, cloudflareQuota:"unavailable; local counters are not public quota", d1CounterLimit:"Sum of response headers from successful D1 calls; aborted batch internals and CPU are not observable here", backends:[] };
const profiles = ["000101", "000102", "000103", "000104"];
const legacy = (profile) => {
  const session = newSession("multi", 1, profile);
  for (const question of session.questions) {
    question.activeMs = 1000;
    recordAttempt(question, question.answer);
    question.done = true;
  }
  session.index = session.questions.length;
  session.completedAt = new Date().toISOString();
  return session;
};
const completed = (task, profile, pattern = 0) => {
  const session = newAssignedSession(task, profile);
  for (let index = 0; index < session.questions.length; index++) {
    const question = session.questions[session.index];
    question.activeMs = 1000 + pattern * 300;
    if (pattern === 2 && index === 0) recordSupport(question, "hint");
    const answer = pattern === 1 && index === 0
      ? question.options.find((value) => value !== question.answer)
      : question.answer;
    assert.equal(recordAttempt(question, answer), true);
    advanceAssignedSession(session);
  }
  assert(session.completedAt);
  return session;
};
const report = (profile, sessions) => ({ schema:SCHEMA, profile, sessions });
const reordered = (value) => Array.isArray(value) ? value.map(reordered)
  : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).reverse().map(([key,item])=>[key,reordered(item)])) : value;

async function makeBackend(kind) {
  const measurement = { kind, requests:0, d1RowsRead:0, d1RowsWritten:0, cases:[], cpuMilliseconds:null };
  measurements.backends.push(measurement);
  let request, finish, room, otherRoom, teacher, otherTeacher, students;
  if (kind === "worker") {
    const bundle = await build({ entryPoints:[fileURLToPath(new URL("../cloudflare/worker.mjs", import.meta.url))], bundle:true, format:"esm", write:false, platform:"browser", target:"es2022" });
    const administrator = "a".repeat(64);
    const runtime = new Miniflare(convertV4MiniflareOptions({
      modules:true, script:bundle.outputFiles[0].text, compatibilityDate:"2026-10-14", d1Databases:["DB"],
      bindings:{ ADMIN_TOKEN_HASH:createHash("sha256").update(administrator).digest("hex"), SERVICE_ENABLED:"true", ALLOWED_ORIGINS:"https://krakaur.github.io", MAX_DAILY_REQUESTS:"10000", MAX_DAILY_PER_ACCESS:"1000" },
    }));
    finish = () => runtime.dispose();
    try {
      const db = await runtime.getD1Database("DB");
      const sql = (await readFile(new URL("../cloudflare/migrations/0001_classroom.sql", import.meta.url),"utf8")) + (await readFile(new URL("../cloudflare/migrations/0002_school_multiplayer.sql", import.meta.url),"utf8"));
      for (const statement of sql.match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|INDEX)[\s\S]*?;/g))
        await db.prepare(statement).run();
      request = async (path, body, token) => {
        const response = await runtime.dispatchFetch("https://c2-local.test" + path, {
          method:body ? "POST" : "GET", headers:{ Authorization:"Bearer " + token, ...(body ? {"Content-Type":"application/json"} : {}) }, body:body ? JSON.stringify(body) : undefined,
        });
        measurement.requests++;
        measurement.d1RowsRead += Number(response.headers.get("X-D1-Rows-Read") || 0);
        measurement.d1RowsWritten += Number(response.headers.get("X-D1-Rows-Written") || 0);
        return { status:response.status, data:await response.json() };
      };
      const first = await request("/admin-api/rooms", {name:"C2 sintética"}, administrator);
      const second = await request("/admin-api/rooms", {name:"Otra aula sintética"}, administrator);
      assert.equal(first.status,201); assert.equal(second.status,201);
      room = first.data.classId; teacher = first.data.token;
      otherRoom = second.data.classId; otherTeacher = second.data.token;
      students = [];
      for (let i=0; i<4; i++) {
        const created = await request("/students", {}, teacher);
        assert.equal(created.status,200); students.push(created.data.token);
      }
    } catch (error) { await finish(); throw error; }
  } else {
    const db = openDatabase(":memory:");
    room = "class-c2-a"; otherRoom = "class-c2-b";
    for (const id of [room,otherRoom]) db.prepare("INSERT INTO rooms(id,name) VALUES(?,?)").run(id,"C2 sintética");
    teacher = "t".repeat(64); otherTeacher = "u".repeat(64);
    students = ["1","2","3","4"].map((character) => character.repeat(64));
    issueAccess(db,room,"teacher",teacher); issueAccess(db,otherRoom,"teacher",otherTeacher);
    for (const student of students) issueAccess(db,room,"student",student);
    const server = receiver(db);
    await new Promise((resolve,reject) => { server.once("error",reject); server.listen(0,"127.0.0.1",resolve); });
    finish = async () => { await new Promise((resolve) => server.close(resolve)); db.close(); };
    request = async (path,body,token) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}` + path, {
        method:body ? "POST" : "GET", headers:{ Authorization:"Bearer " + token, ...(body ? {"Content-Type":"application/json"} : {}) }, body:body ? JSON.stringify(body) : undefined,
      });
      measurement.requests++;
      return { status:response.status, data:await response.json() };
    };
    measurement.d1RowsRead = null; measurement.d1RowsWritten = null;
  }
  return { kind, request, finish, room, otherRoom, teacher, otherTeacher, students, measurement };
}

test("C2: four students, immutable assignments and atomic reports on both backends", async (t) => {
  const started = performance.now();
  try {
    for (const kind of ["receiver","worker"]) {
      const backend = await makeBackend(kind);
      const { request, room, otherRoom, teacher, otherTeacher, students, measurement } = backend;
      const task1 = { schema:TASK_SCHEMA, classId:room, id:"c2-multiply-a", version:1, title:"Grupos de tres", trail:"multi", contentId:"multiply-fixed-table", contentVersion:1, parameters:{table:3}, completionRule:{kind:"answered_items",count:8}, recipientProfileIds:profiles, assignedAt:new Date().toISOString() };
      const taskB = {...task1,id:"c2-multiply-b",title:"Grupos de seis",parameters:{table:6}};
      const privateTask = {...task1,id:"c2-private-membership",title:"Destinatarios restringidos",recipientProfileIds:profiles.slice(0,2)};
      let version2, assigned, capturedReportPages;
      const received = async (capture=false) => {
        const sessions=[], pages=[];
        let cursor=0, more=true;
        for (let page=0; more && page<5; page++) {
          const response=await request("/reports"+(kind==="worker"?"?after="+cursor:""),null,teacher);
          assert.equal(response.status,200); assert.equal(response.data.confirmationSource,"server-read");
          assert(Number.isFinite(Date.parse(response.data.confirmedAt)));
          if (capture) pages.push(response.data);
          for (const group of response.data.reports) sessions.push(...group.sessions);
          cursor=response.data.cursor; more=Boolean(response.data.more);
        }
        assert.equal(more,false,"Bounded report pagination must finish");
        if (capture) capturedReportPages=pages;
        return sessions;
      };
      const matrixKeys = (sessions) => sessions.map((session)=>`${session.profile}/${session.assignmentId}@${session.assignmentVersion}`).sort();
      const expectedMatrix = profiles.flatMap((profile)=>[task1,taskB].map((task)=>`${profile}/${task.id}@1`)).sort();
      const checked = async (name, callback) => t.test(`${kind}: ${name}`, async () => {
        const before = measurement.requests;
        await callback();
        measurement.cases.push({name,passed:true,requests:measurement.requests-before});
      });
      try {
        await checked("capabilities include enrollment and legacy tasks remain compatible", async () => {
          const capabilities = (await request("/capabilities",null,teacher)).data.features;
          assert(capabilities.includes("assignments-v2")); assert(capabilities.includes("enrollment"));
          assert.equal((await request("/tasks",{tasks:[{id:"legacy-task",title:"Práctica libre",trail:"multi"}]},teacher)).status,200);
        });
        await checked("first access uses enrollment, reveals no task beforehand and redacts peers afterward", async () => {
          const before = await request("/tasks",null,teacher);
          assert.equal((await request("/tasks",{tasks:[task1]},teacher)).status,409);
          assert.equal((await request("/tasks",{tasks:[task1,taskB,privateTask],expectedRevision:before.data.revision},teacher)).status,200);
          for (let i=0;i<4;i++) {
            const unbound = await request("/tasks",null,students[i]);
            assert.equal(unbound.status,200);
            assert.equal(unbound.data.tasks.filter((task)=>task.schema===TASK_SCHEMA).length,0);
            const enrollment = {school:"Escuela sintética C2",grade:"3",group:"A",listNumber:i+1};
            const linked = await request("/enrollment",{profile:profiles[i],enrollment},students[i]);
            assert.equal(linked.status,200); assert.equal(linked.data.profile,profiles[i]);
            const visible = await request("/tasks",null,students[i]);
            assert.equal(visible.status,200);
            const tasks = visible.data.tasks.filter((task) => task.schema === TASK_SCHEMA);
            assert.equal(tasks.length,i<2?3:2);
            assert.deepEqual(tasks.map((task)=>task.id).sort(),[task1.id,taskB.id,...(i<2?[privateTask.id]:[])].sort());
            for (const task of tasks) assert.deepEqual(task.recipientProfileIds,[profiles[i]]);
          }
        });
        await checked("unpublished, wrong-class and wrong-recipient snapshots are rejected", async () => {
          const variants = [
            [0,{...task1,id:"never-published"}],
            [0,{...task1,classId:otherRoom}],
            [2,{...privateTask,recipientProfileIds:[profiles[2]]}],
          ];
          for (const [index,task] of variants) {
            const response = await request("/reports",report(profiles[index],[completed(task,profiles[index])]),students[index]);
            assert.equal(response.status,400);
          }
          const orphan = legacy(profiles[0]); orphan.assignmentId=task1.id; orphan.assignmentVersion=1;
          assert.equal((await request("/reports",report(profiles[0],[orphan]),students[0])).status,400);
        });
        await checked("exactly eight assigned v1 episodes cover four profiles times tasks A and B", async () => {
          assigned = profiles.flatMap((profile,index)=>[task1,taskB].map((task)=>completed(task,profile,index)));
          assert.equal(assigned.length,8);
          assert.deepEqual(matrixKeys(assigned),expectedMatrix);
          for (let i=0;i<4;i++) {
            const episodes=assigned.filter((session)=>session.profile===profiles[i]);
            assert.equal(episodes.length,2);
            for (const session of episodes) assert(!Object.hasOwn(session.assignment,"recipientProfileIds"));
            const response = await request("/reports",report(profiles[i],JSON.parse(JSON.stringify(episodes))),students[i]);
            assert.equal(response.status,200);
            assert.deepEqual(response.data.accepted,episodes.map((session)=>session.id));
            assert.equal(response.data.receiptSource,"server-acknowledgement");
          }
        });
        await checked("concurrent writers with one base revision cannot overwrite each other", async () => {
          const before = await request("/tasks",null,teacher);
          const a = {...task1,version:2,parameters:{table:4},recipientProfileIds:profiles};
          const b = {...a,parameters:{table:5}};
          // Deliberately two overlapping requests; all other tests are sequential.
          const responses = await Promise.all([a,b].map((task) => request("/tasks",{tasks:[task],expectedRevision:before.data.revision},teacher)));
          assert.deepEqual(responses.map((response)=>response.status).sort(),[200,409]);
          const current = await request("/tasks",null,teacher);
          assert(current.data.tasks.some((task)=>task.id===task1.id && task.version===1));
          version2 = current.data.tasks.find((task)=>task.id===task1.id && task.version===2);
          assert(version2);
          const changed = await request("/tasks",{tasks:[{...version2,title:"Alteración retroactiva"}],expectedRevision:current.data.revision},teacher);
          assert(changed.status>=400 && changed.status<500);
        });
        await checked("identical replay is accepted and mixed conflicting batch rolls back", async () => {
          assert.equal((await request("/reports",report(profiles[0],[reordered(assigned[0])]),students[0])).status,200);
          const changed = structuredClone(assigned[0]); changed.questions[0].activeMs++;
          const pending = completed(task1,profiles[0]);
          assert.equal((await request("/reports",report(profiles[0],[pending,changed]),students[0])).status,409);
        });
        await checked("legacy sessions remain explicit and are never a prerequisite for assigned access", async () => {
          for (let i=0;i<4;i++) {
            const session=legacy(profiles[i]);
            assert.equal(session.assignment,undefined); assert.equal(session.assignmentId,undefined);
            assert.equal((await request("/reports",report(profiles[i],[session]),students[i])).status,200);
          }
        });
        await checked("teacher reads exact 4x2 v1 matrix after A-v2 edit, with legacy explicitly separate", async () => {
          const sessions=await received(true);
          const attributed=sessions.filter((session)=>session.assignment);
          assert.equal(sessions.length,12);
          assert.equal(attributed.length,8);
          assert.equal(sessions.filter((session)=>!session.assignment).length,4);
          assert.deepEqual(matrixKeys(attributed),expectedMatrix);
          assert.deepEqual([...new Set(sessions.map((session)=>session.profile))].sort(),profiles);
          for (const session of assigned) assert.deepEqual(sessions.find((item)=>item.id===session.id),session);
          measurement.assignedMatrix = {profiles:4,tasks:2,expected:8,receivedV1:attributed.length,keys:matrixKeys(attributed),legacy:4,historicalPayloadsUnchanged:true};
          const catalog=await request("/tasks",null,teacher);
          assert.equal(catalog.status,200);
          measurement.uiEvidence = {
            evidenceClass:"synthetic-local-server-read", classId:room,
            observedAt:new Date().toISOString(),
            confirmedAt:capturedReportPages.at(-1).confirmedAt,
            confirmationSource:"server-read",
            phase:"Eight assigned v1 episodes and four legacy episodes; zero v2 episodes received",
            counts:{assignedV1:8,legacy:4,assignedV2:0},
            tasks:catalog.data.tasks, tasksRevision:catalog.data.revision,
            reportPages:capturedReportPages,
          };
        });
        await checked("new A-v2 episode is distinct and does not rewrite the eight historical v1 episodes", async () => {
          const fresh=completed(version2,profiles[0],3);
          assert.equal((await request("/reports",report(profiles[0],[fresh]),students[0])).status,200);
          const sessions=await received();
          assert.equal(sessions.length,13);
          const v1=sessions.filter((session)=>session.assignmentVersion===1);
          assert.equal(v1.length,8); assert.deepEqual(matrixKeys(v1),expectedMatrix);
          const v2=sessions.filter((session)=>session.assignmentVersion===2);
          assert.equal(v2.length,1); assert.deepEqual(v2[0],fresh);
          assert.equal(sessions.filter((session)=>!session.assignment).length,4);
          for (const session of assigned) assert.deepEqual(sessions.find((item)=>item.id===session.id),session);
          measurement.afterVersion2 = {receivedV1:v1.length,receivedV2:v2.length,legacy:4,total:sessions.length};
        });
        await checked("roles, bound profiles and classrooms remain isolated", async () => {
          const enrollment={school:"Escuela sintética C2",grade:"3",group:"A",listNumber:1};
          assert.equal((await request("/enrollment",{profile:profiles[1],enrollment},students[0])).status,403);
          assert.equal((await request("/enrollment",{profile:profiles[0],enrollment},teacher)).status,403);
          assert.equal((await request("/reports",null,students[0])).status,403);
          assert.equal((await request("/reports",report(profiles[0],[assigned[0]]),teacher)).status,403);
          assert.equal((await request("/reports",report(profiles[0],[assigned[0]]),students[1])).status,403);
          assert.equal((await request("/tasks",{tasks:[]},students[0])).status,403);
          assert.deepEqual((await request("/reports",null,otherTeacher)).data.reports,[]);
          const otherTasks = await request("/tasks",null,otherTeacher);
          assert.deepEqual(otherTasks.data.tasks,[]);
          assert.equal((await request("/tasks",{tasks:[task1],expectedRevision:otherTasks.data.revision},otherTeacher)).status,400);
        });
        await checked("same valid session id in two profiles remains two records after teacher merge", async () => {
          const pair=[completed(task1,profiles[0]),completed(task1,profiles[1],1)];
          pair[1].id=pair[0].id;
          for (let index=0;index<2;index++)
            assert.equal((await request("/reports",report(profiles[index],[pair[index]]),students[index])).status,200);
          const sessions=await received();
          assert.equal(sessions.length,15);
          const sameId=sessions.filter((session)=>session.id===pair[0].id);
          assert.equal(sameId.length,2);
          assert.deepEqual(sameId.map((session)=>session.profile).sort(),profiles.slice(0,2));
          for (const session of pair)
            assert.deepEqual(sameId.find((item)=>item.profile===session.profile),session);
          const merged=mergeSessions(sessions.filter((session)=>session.id!==pair[0].id),sameId);
          assert.equal(merged.added,2); assert.equal(merged.sessions.length,15);
          const replayed=mergeSessions(merged.sessions,reordered([...sameId].reverse()));
          assert.equal(replayed.added,0); assert.equal(replayed.sessions.length,15);
          measurement.profileCollision = {sharedId:pair[0].id,profiles:profiles.slice(0,2),receivedDistinct:2,mergedTotal:15,replayedAdded:0};
        });
      } finally { await backend.finish(); }
    }
  } finally {
    measurements.elapsedMilliseconds=performance.now()-started;
    if (process.env.C2_METRICS_FILE)
      await writeFile(process.env.C2_METRICS_FILE,JSON.stringify(measurements,null,2)+"\n");
  }
});
