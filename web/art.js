// Original vector symbols. Decorative: adjacent text carries the accessible label.
// These identifiers are never used as counted objects in mathematical models.
const shapes = {
 balance:'<path fill="#e4bf79" d="M12 49q36-32 72 0v23h-9V53Q48 31 21 53v19h-9z"/><path d="M16 43v32m64-32v32M29 39v20m19-24v19m19-15v20"/><path stroke="#298b93" d="M10 79q9-6 18 0t18 0t18 0t18 0"/>',
 sharing:'<path fill="#e9bf76" d="m16 42 8 37h48l8-37z"/><path d="M26 42c0-34 44-34 44 0M20 53h56M23 66h50M36 46l3 29m18-29-3 29"/><path fill="#e38f50" d="M47 22c-16 0-19 24 1 24s17-24-1-24z"/><path fill="#69a375" d="M47 22q1-14 14-11-2 12-14 11z"/>',
 array:'<path fill="#daeddc" d="M14 43 48 15l34 28v38H14z"/><path d="M48 17v64M17 45h62M27 35v44M68 35v44"/><path fill="#e9bf76" d="m33 63 4 15h22l4-15z"/><path fill="#55a17f" d="M48 62c-17 0-21-18-14-16 10 0 14 8 14 16 0-20 14-27 18-20 1 10-7 18-18 20z"/>',
 fraction:'<path fill="#e6bc7a" d="M14 61c0-44 68-44 68 0 0 25-68 25-68 0z"/><path stroke="#fff4d8" stroke-width="7" d="m32 39-5 14m21-21-5 17m20-12-6 15"/><path d="M16 67q32 10 64 0"/>',
 measure:'<path fill="#a7cba2" d="m21 30 50-7 7 44-50 7z"/><path fill="#e4bf79" d="M13 39v41h8V39l-4-6zm19 0v41h8V39l-4-6zm25 0v41h8V39l-4-6zm19 0v41h8V39l-4-6z"/><path d="M15 53h66M15 69h66"/><path fill="#559579" d="M46 37q-1-16-12-18 1 16 12 18 1-20 13-23-1 17-13 23z"/>',
 data:'<path fill="#c2dce7" d="m18 32 43-16 9 23-43 16z"/><path fill="#e6bd75" d="m61 16 8-3 9 23-8 3z"/><path d="M46 48v31M46 56 28 80m18-24 19 24"/><path fill="#70a897" d="m23 30-7 3 9 25 7-3z"/><path stroke="#e7b75d" d="m80 57 3 5 6 1-5 4 1 6-5-3-5 3 1-6-4-4 5-1z"/>',
 pattern:'<path d="M10 17q37 15 76 0M25 24v13m45-13v13"/><path fill="#e7b557" d="m14 42 11-8 11 8-3 30H17z"/><path fill="#e7b557" d="m59 42 11-8 11 8-3 30H62z"/><path stroke="#fff4cf" d="M24 45v18m45-18v18"/><path d="M17 74h16m29 0h16"/>',
 route:'<path fill="#f0dfb2" d="m12 21 24-7 25 9 23-7v59l-23 7-25-9-24 7z"/><path stroke="#d8bb80" d="M36 18v53m25-46v53"/><path stroke="#2c919d" stroke-width="8" d="M24 23c-15 25 41 7 24 34s29 8 26 15"/><path fill="#df9164" d="m66 27 5-9 5 9-5 9z"/>',
 suma:'<path fill="#e9bd70" d="M17 72h62v9H17z"/><path fill="#91bb95" d="M25 68V43h18v25z"/><path fill="#54a28e" d="M52 68V29h18v39z"/><path stroke="#fff7df" stroke-width="5" d="M25 24h18m-9-9v18"/>',
 resta:'<path fill="#a5cfcd" d="M15 54h28v25H15zm38-25h28v25H53z"/><path stroke="#fff7df" stroke-width="5" d="M20 29h23"/><path stroke="#327d89" d="M66 62v15H52"/>',
 multi:'<path fill="#e9bd70" d="M20 20h22v22H20zm34 0h22v22H54zM20 54h22v22H20zm34 0h22v22H54z"/><path stroke="#327d69" stroke-width="5" d="m39 39 18 18m0-18L39 57"/>',
 tablas20:'<path fill="#d8d0ea" d="m48 11 31 18v36L48 84 17 65V29z"/><path d="m17 29 31 19 31-19M48 48v36"/><path stroke="#fff7df" stroke-width="5" d="m32 24 12 12m0-12L32 36"/>',
 razonar:'<path fill="#e4bf79" d="M20 76h56v7H20z"/><path fill="#a6caa6" d="M48 14C15 14 17 48 34 58l3 13h22l3-13C79 48 81 14 48 14z"/><path d="M37 71h22M48 58V39"/><path fill="#579c7a" d="M48 47Q25 46 31 31q15 1 17 16 1-22 17-22 5 15-17 22z"/>'
};
export function artIcon(kind, cls='') {
 const shape=shapes[kind]||shapes.razonar;
 return `<svg class="sendero-icon ${cls}" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${shape}</g></svg>`;
}
export function workshopArt(kind) {
 const order=['balance','sharing','array','fraction','measure','data','pattern','route'];
 const i=order.indexOf(kind); if(i<0)return '';
 return `<div class="workshop-vignette vignette-${kind}" style="--art-x:${(i%4)*100/3}%;--art-y:${i<4?0:100}%" aria-hidden="true"></div>`;
}

