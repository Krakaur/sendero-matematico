// Ephemeral reading position only. No student records, storage or network.
const KEY = 'data-insight-key';
const CONTEXT = 'data-insight-context';
const keyOf = node => node?.getAttribute?.(KEY) || '';
const modalOpen = doc => !!doc?.querySelector?.('dialog[open], [role="dialog"][aria-modal="true"]:not([hidden]):not([aria-hidden="true"])');
function keyedNodes(root) {
  const index = new Map();
  for (const node of root.querySelectorAll(`[${KEY}]`)) {
    const key = keyOf(node);
    if (key) index.set(key,index.has(key) ? null : node);
  }
  return index;
}
function summaryOf(node) {
  return node?.tagName === 'DETAILS' ? [...node.children].find(n => n.tagName === 'SUMMARY') : node;
}
function available(node,root) {
  return !!node && root.contains(node) && !node.disabled && !node.closest('[hidden], [inert], [aria-hidden="true"]');
}
function parents(node,root) {
  const items=[];
  for(let p=node?.parentElement;p && root.contains(p);p=p.parentElement) {
    if(p.tagName==='DETAILS' && keyOf(p)) items.push({key:keyOf(p),summary:true});
  }
  return items;
}
function elementTop(node) {
  const rect=node?.getBoundingClientRect?.();
  return rect && Number.isFinite(rect.top) && Number.isFinite(rect.height) && rect.height>0 && Number.isFinite(rect.width) && rect.width>0
    ? {top:rect.top,height:rect.height} : null;
}
function visibleAnchor(node,view) {
  const rect=elementTop(node),height=view?.innerHeight;
  return rect && Number.isFinite(height) && height>0 && rect.top<height && rect.top+rect.height>0 ? rect.top : null;
}
export function captureTeacherReading(root,context) {
  if(!root || !context || !root.getAttribute(CONTEXT)) return null;
  const doc=root.ownerDocument,index=keyedNodes(root),active=doc.activeElement;
  const ownsFocus=root.contains(active);
  const focusNode=ownsFocus && active.tagName==='SUMMARY' ? active.parentElement : active;
  const focusKey=ownsFocus ? keyOf(focusNode) : '';
  const focus=focusKey && index.get(focusKey)===focusNode ? [{key:focusKey,summary:active.tagName==='SUMMARY'},...parents(focusNode,root)] : [];
  const view=doc.defaultView;
  return {context,rootContext:root.getAttribute(CONTEXT),
    details:[...index].filter(([,n])=>n?.tagName==='DETAILS').map(([key,n])=>({key,open:n.open})),
    focus,activeElement:active,documentFocused:doc.hasFocus?.()!==false,
    focusTop:focus.length?visibleAnchor(active,view):null};
}
export function restoreTeacherReading(root,saved,context) {
  if(!root || !saved || context!==saved.context || root.getAttribute(CONTEXT)!==saved.rootContext)
    return {restored:0,focused:false,reason:'context-changed'};
  const doc=root.ownerDocument;
  if(modalOpen(doc)) return {restored:0,focused:false,reason:'modal-open'};
  const index=keyedNodes(root);let restored=0;
  for(const state of saved.details) {
    const node=index.get(state.key);
    if(node?.tagName==='DETAILS'){node.open=state.open;restored++;}
  }
  const active=doc.activeElement;
  const focusFree=!active || active===doc.body || active===doc.documentElement || active===saved.activeElement;
  let focused=false,position='not-requested';
  if(saved.documentFocused && doc.hasFocus?.()!==false && focusFree) {
    for(const item of saved.focus) {
      const node=index.get(item.key),target=item.summary?summaryOf(node):node;
      if(!available(target,root)) continue;
      // A current deliberate focus is never replaced by an async refresh.
      target.focus({preventScroll:true});focused=doc.activeElement===target;
      if(focused) {
        const view=doc.defaultView,rect=elementTop(target);
        // Keep the reading anchor relative to the viewport even if evidence was
        // inserted above it. A fallback parent occupies the prior anchor's place.
        // Unknown/off-screen prior geometry never causes an absolute jump.
        if(Number.isFinite(saved.focusTop) && rect && Number.isFinite(view?.scrollY) && Number.isFinite(view?.scrollX) && typeof view?.scrollTo==='function') {
          view.scrollTo({left:view.scrollX,top:Math.max(0,view.scrollY+rect.top-saved.focusTop),behavior:'instant'});
          position='relative-requested';
        }
        break;
      }
    }
  }
  return {restored,focused,position,reason:focused?'reading-restored':'details-restored'};
}
export function refreshTeacherReading(main,{getContext,render}) {
  // Capture at response completion, after any reading the teacher did while waiting.
  if(modalOpen(main.ownerDocument)) return {rendered:false,reason:'modal-open'};
  const saved=captureTeacherReading(main.querySelector('.teaching-insights'),getContext());
  render();
  return {rendered:true,...restoreTeacherReading(main.querySelector('.teaching-insights'),saved,getContext())};
}
