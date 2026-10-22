import {newAssignedWorkshop} from './assigned-workshop.js';
import {reasoningSupportEvent} from './reasoning-support.js';
import {assignedItems} from './task-content.js';
import {assignmentSnapshot,validateAssignedSession,equivalent,sessionKey} from './assignments.js';
import {validEnrollment} from './enrollment.js';
import { validBankQuestion } from "./bank.js";
export const VERSION = "0.15.0";
export const SCHEMA = "sendero.report.v3";
export const TRAILS = {
  suma: {
    name: "El bosque de las sumas",
    short: "Sumas",
    symbol: "+",
    color: "green",
    description: "Reúne semillas y encuentra nuevos caminos.",
    skill: "Composición de números",
  },
  resta: {
    name: "El río de las restas",
    short: "Restas",
    symbol: "−",
    color: "blue",
    description: "Cruza el río, una pequeña aventura a la vez.",
    skill: "Diferencias entre cantidades",
  },
  multi: {
    name: "La huerta de los grupos",
    short: "Multiplicación",
    symbol: "×",
    color: "orange",
    description: "Descubre cuánto crece en cada grupo.",
    skill: "Grupos iguales",
  },
};
Object.assign(TRAILS, {
  tablas20: {name:"Tablas hasta el 20",short:"Tablas ampliadas",symbol:"×",color:"orange",description:"Practica y repasa productos del 1 al 20. Ampliación opcional.",skill:"Fluidez de cálculo"},
  razonar: {name:"El taller de las ideas",short:"Razonamiento",symbol:"?",color:"blue",description:"Interpreta situaciones, compara y encuentra lo que falta.",skill:"Problemas y representaciones"}
});
export function uid() {
  return crypto.randomUUID();
}
export function recordAttempt(question, value) {
  if (
    question.done ||
    (!question.options.includes(value) && question.responseMode!=='write') ||
    !Number.isInteger(value) || value<0 || value>2500 ||
    (question.attempts.length>=19&&value!==question.answer) ||
    question.attempts.includes(value)
  )
    return false;
  if (!question.attempts.length && question.timingProtocol === 1) question.firstResponseMs = question.activeMs;
  question.attempts.push(value);
  if(Array.isArray(question.events)) {
    question.events.push({type:value===question.answer?'correct':'wrong',value});
    if(![3,6].includes(question.supportProtocol)&&value!==question.answer&&!question.solutionShown)question.events.push({type:'solution'});
  }
  if (value !== question.answer) {if(![3,6].includes(question.supportProtocol))question.solutionShown = true;}
  else question.done = true;
  return true;
}
export function recordSupport(question) {
  if(question.done||question.hint)return false;
  question.hint=true;
  if(Array.isArray(question.events))question.events.push({type:'hint'});
  return true;
}
export function recordSolution(question) {
  if(question.done||question.solutionShown||!question.attempts.length)return false;
  question.solutionShown=true;question.solutionRequested=true;
  if(Array.isArray(question.events))question.events.push({type:'solution'});
  return true;
}
export function recordReasoningSupport(question,type) {
  if(question?.supportProtocol!==6||question.done)return false;
  const event=reasoningSupportEvent(question,question.events,type);
  if(!event)return false;
  question.events.push(event);return true;
}
export function newAssignedSession(task,profile) {
  const assignment=assignmentSnapshot(task);
  if(!task.recipientProfileIds.includes(profile))throw Error('Esta tarea no está asignada a este perfil.');
  if(task.contentId==='workshop-fixed-project')return {id:uid(),profile,trail:'razonar',level:task.parameters.level,version:VERSION,startedAt:new Date().toISOString(),completedAt:null,index:0,questions:[],assignment,assignmentId:task.id,assignmentVersion:task.version,taskProtocol:5,responseMode:'construction',workshop:newAssignedWorkshop(task)};
  const pack=assignedItems(task);
  const level=pack?pack[0].level:task.parameters.table<=3?1:task.parameters.table<=5?2:task.parameters.table<=8?3:4;
  const s=newSession(task.trail,level,profile);
  Object.assign(s,{assignment,assignmentId:task.id,assignmentVersion:task.version,taskProtocol:pack?(task.contentId==='reasoning-supported-pack'?6:task.contentId==='arithmetic-fixed-pack'?4:3):2,responseMode:'choice'});
  if(pack){s.questions=pack.map(q=>({...q,attempts:[],events:[],hint:false,solutionShown:false,solutionRequested:false,done:false,activeMs:0,supportProtocol:s.taskProtocol,...([3,6].includes(s.taskProtocol)?{reflection:''}:{timingProtocol:1,firstResponseMs:0,timingInterrupted:false})}));return s;}
  s.questions=Array.from({length:8},(_,i)=>{
    const q=makeQuestion('multi',level),a=task.parameters.table,b=i+1;
    return {...q,a,b,answer:a*b,options:arithmeticOptions('multi',a,b,a*b),itemId:`item-${i+1}`,events:[]};
  });
  return s;
}
// Protocol2 waits for an explicit finish action, including after a correct last answer.
export const requiresAssignedFinish=s=>!!s?.assignment&&s.taskProtocol>=2&&s.index===s.questions.length-1&&!s.completedAt;
export function advanceAssignedSession(s,at=new Date().toISOString()) {
  if(s.taskProtocol===5){if(s.completedAt||s.workshop?.phase!=='review')throw Error('Completa las tres fases antes de entregar.');const closure={...s,completedAt:at,completionAction:{kind:'finish-task',at}};validateAssignedSession(closure);Object.assign(s,closure);return true;}
  if(!s.assignment||s.completedAt||!s.questions[s.index]?.attempts.length)throw Error('Responde el reto antes de continuar.');
  if(s.index===s.questions.length-1){
    const closure={...s,completedAt:at,...(s.taskProtocol>=2?{completionAction:{kind:'finish-task',at}}:{})};
    validateAssignedSession(closure);Object.assign(s,closure);return true;
  }
  s.index++;return false;
}
export function adapt(state, question) {
  const next = {
    level: state.level,
    streak: state.streak || 0,
    support: state.support || 0,
  };
  if (
    question.attempts.length === 1 &&
    question.attempts[0] === question.answer &&
    !question.hint
  ) {
    next.streak++;
    next.support = 0;
    if (next.streak >= (question.bankId ? 6 : 3)) {
      next.level = Math.min(4, next.level + 1);
      next.streak = 0;
    }
  } else {
    next.streak = 0;
    next.support++;
    if (next.support >= 2) {
      next.level = Math.max(1, next.level - 1);
      next.support = 0;
    }
  }
  return next;
}
export function arithmeticOptions(trail,a,b,answer,rng=Math.random) {
  const plausible=trail==='multi'||trail==='tablas20'?[a+b,(a-1)*b,(a+1)*b,a*(b-1),a*(b+1)]:trail==='resta'?[a+b,answer-1,answer+1,answer-10,answer+10]:[Math.abs(a-b),answer-1,answer+1,answer-10,answer+10];
  const candidates=[...new Set(plausible.filter(n=>Number.isInteger(n)&&n>=0&&n!==answer))];
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  const options=new Set([answer,...candidates.slice(0,3)]);
  for(let d=1;options.size<4;d++)options.add(answer+d);
  const values=[...options];for(let i=values.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
  return values;
}
export function makeQuestion(trail, level, rng = Math.random) {
  const int = (min, max) => min + Math.floor(rng() * (max - min + 1));
  let a, b, answer;
  if (trail === "multi" || trail === "tablas20") {
    a = int(1, (trail === "tablas20" ? [10,12,15,20] : [3,5,8,10])[level - 1]);
    b = int(1, (trail === "tablas20" ? [10,12,15,20] : [3,5,8,10])[level - 1]);
    answer = a * b;
  } else {
    const max = [5, 10, 20, 50][level - 1];
    a = int(1, max);
    b = int(1, max);
    if (trail === "resta" && a < b) [a, b] = [b, a];
    answer = trail === "resta" ? a - b : a + b;
  }
  const values = arithmeticOptions(trail,a,b,answer,rng);
  return {
    a,
    b,
    answer,
    level,
    options: values,
    attempts: [],
    hint: false,
    solutionShown: false,
    activeMs: 0,
    timingProtocol: 1,
    timingInterrupted: false,
  };
}
export function newSession(trail, level, profile) {
  return {
    id: uid(),
    profile,
    trail,
    level,
    version: VERSION,
    startedAt: new Date().toISOString(),
    completedAt: null,
    index: 0,
    questions: Array.from({ length: 8 }, () => makeQuestion(trail, level)),
  };
}
export function summarize(sessions) {
  sessions=sessions.filter(s=>s.taskProtocol!==5);
  const questions = sessions.flatMap((s) =>
    s.questions.filter((q) => q.attempts.length),
  );
  const first = questions.filter((q) => q.attempts[0] === q.answer).length;
  return {
    sessions: sessions.length,
    items: questions.length,
    first,
    accuracy: questions.length
      ? Math.round((100 * first) / questions.length)
      : null,
    hints: questions.filter((q) => q.hint).length,
    activeMs: questions.reduce((n, q) => n + q.activeMs, 0),
  };
}
export function dimensions(sessions) {
  const qs = sessions.flatMap((s) =>
    s.questions.filter((q) => q.attempts.length),
  );
  const n = qs.length,
    errors = qs.filter((q) => q.attempts[0] !== q.answer);
  return {
    n,
    first: qs.filter((q) => q.attempts[0] === q.answer).length,
    independent: qs.filter(
      (q) => q.attempts.length === 1 && q.attempts[0] === q.answer && !q.hint && (q.supportProtocol!==6 || q.events?.[0]?.type==='correct'),
    ).length,
    hints: qs.filter((q) => q.hint).length,
    recovered: errors.filter(
      (q) => q.attempts.length === 2 && q.attempts.at(-1) === q.answer,
    ).length,
    errors: errors.length,
  };
}
export function validateReport(data) {
  if (
    !data ||
    ![SCHEMA,"sendero.report.v2","sendero.report.v1"].includes(data.schema) ||
    typeof data.profile !== "string" ||
    !/^[a-zA-Z0-9-]{1,60}$/.test(data.profile) ||
    !Array.isArray(data.sessions) ||
    data.sessions.length > 5000
  )
    throw new Error("No es un informe de Sendero compatible.");
  for (const s of data.sessions) {
    if (
      !s ||
      (s.enrollment !== undefined && !validEnrollment(s.enrollment)) ||
      typeof s.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(s.id) ||
      s.profile !== data.profile ||
      !Object.hasOwn(TRAILS, s.trail) ||
      ![1, 2, 3, 4].includes(s.level) ||
      typeof s.version !== "string" ||
      s.version.length > 20 ||
      !Number.isFinite(Date.parse(s.startedAt)) ||
      !Number.isFinite(Date.parse(s.completedAt)) ||
      !Array.isArray(s.questions) ||
      s.questions.length !== (s.taskProtocol===5?0:s.assignment?.completionRule?.count??8)
    )
      throw new Error("El informe contiene una sesión no válida.");
    validateAssignedSession(s);
    for (const q of s.questions) {
      if (
        !q ||
        ![1, 2, 3, 4].includes(q.level) ||
        ![q.a, q.b, q.answer, q.activeMs].every(Number.isFinite) ||
        !Number.isInteger(q.a) ||
        !Number.isInteger(q.b) ||
        q.a < 0 ||
        q.a > 50 ||
        q.b < 0 ||
        q.b > 50 ||
        q.activeMs < 0 ||
        q.activeMs > 86400000 ||
        typeof q.hint !== "boolean" ||
        (q.solutionShown !== undefined &&
          typeof q.solutionShown !== "boolean") ||
        !Array.isArray(q.attempts) ||
        q.attempts.length < 1 ||
        q.attempts.length > 20 ||
        !q.attempts.every((n) => Number.isInteger(n) && n >= 0 && n <= 2500) ||
        (!s.assignment && q.attempts.at(-1) !== q.answer)
      )
        throw new Error("El informe contiene respuestas no válidas.");
      if (q.timingProtocol !== undefined && (q.timingProtocol !== 1 || typeof q.timingInterrupted !== "boolean" || !Number.isFinite(q.firstResponseMs) || q.firstResponseMs < 0 || q.firstResponseMs > q.activeMs)) throw new Error("Registro temporal no válido.");
      const expected =
        s.trail === "suma"
          ? q.a + q.b
          : s.trail === "resta"
            ? q.a - q.b
            : q.a * q.b;
      if (s.trail === "razonar" ? ([3,6].includes(s.taskProtocol)?false:!validBankQuestion(q)) : q.answer !== expected)
        throw new Error("Los resultados no coinciden con los ejercicios.");
    }
  }
  return data;
}
export function mergeSessions(existing, incoming) {
  const ids = new Map(existing.map((s) => [sessionKey(s), s]));
  let added = 0;
  for (const s of incoming) {
    if(ids.has(sessionKey(s))&&!equivalent(ids.get(sessionKey(s)),s))throw Error('Conflicto: un identificador de partida contiene datos diferentes. Se conserva el informe anterior.');
    if (!ids.has(sessionKey(s))) {
      ids.set(sessionKey(s), s);
      added++;
    }
  }
  return { sessions: [...ids.values()], added };
}
