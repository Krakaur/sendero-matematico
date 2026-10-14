// Original illustrations generated for Sendero; provenance in docs/ARTE-RIO-0.7.0.md.
export function riverLandscape() {
  return `<div class="regatta-landscape river-painting" aria-hidden="true"><img class="river-panorama" src="./assets/forest-river-v1.png" width="1672" height="941" alt="" draggable="false"><div class="river-glints"></div></div>`;
}
// Historical export name kept for the preparation and finish renderers. Raster
// sprites use a composited CSS atlas; the paddle remains a small vector overlay.
export function canoeSVG(kind=0) {
  const k=Number.isInteger(kind)&&kind>=0&&kind<4?kind:0;
  const px=[83,76,85,91][k],py=[63,64,68,66][k];
  return `<div class="canoe-art" aria-hidden="true"><span class="boat-water-shadow"></span>
    <div class="boat-bob"><div class="sprite-window"><div class="racer-sprite" style="background-position:${k%2?100:0}% ${k<2?0:100}%;top:${k<2?-4.545:2.727}%"></div></div>
    <svg class="paddle-art" viewBox="0 0 120 110"><g class="racer-paddle" style="transform-origin:${px}px ${py}px"><path d="M${px} ${py} 104 99" stroke="#684421" stroke-width="4" stroke-linecap="round"/><path d="m97 89 7-4 9 18q-2 7-8 6Z" fill="#d6a461" stroke="#81562e" stroke-width="1.3"/><path d="m102 91 7 13" stroke="#f9da9b" stroke-width="1.5" stroke-linecap="round"/></g></svg></div>
  </div>`;
}
