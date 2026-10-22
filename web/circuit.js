// Distances are measured along each lane, not along screen x. Presentation only:
// the same fraction of eight solved tasks completes every lane and every course.
export const CIRCUITS = {
  bosque: {
    name: "Meandros del bosque",
    description: "Dos curvas amplias",
    waves: 1.15,
    amplitude: 150,
    phase: 0,
  },
  islas: {
    name: "Las tres islas",
    description: "Curvas enlazadas",
    waves: 1.8,
    amplitude: 120,
    phase: 0.4,
  },
  cascada: {
    name: "Vuelta a la cascada",
    description: "Una vuelta completa de 360°",
    loop: true,
  },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cache = new Map();
export function courseGeometry(id = "bosque") {
  if (!Object.hasOwn(CIRCUITS, id)) id = "bosque";
  if (cache.has(id)) return cache.get(id);
  const c = CIRCUITS[id],
    points = [],
    lanes = [[], [], [], []],
    offsets = [132, -132, -44, 44];
  for (let i = 0; i <= 640; i++) {
    const t = i / 640,
      x = c.loop ? 1600 - 1200 * Math.cos(t * Math.PI * 2) : 180 + 2840 * t;
    const y = c.loop
      ? 900 - 600 * Math.sin(t * Math.PI * 2)
      : 450 +
        c.amplitude *
          Math.sin(t * Math.PI * 2 * c.waves + c.phase) *
          Math.sin(Math.PI * t);
    points.push({ x, y });
  }
  points.forEach((p, i) => {
    const a = points[Math.max(0, i - 1)],
      b = points[Math.min(640, i + 1)],
      angle = Math.atan2(b.y - a.y, b.x - a.x);
    for (let l = 0; l < 4; l++) {
      const x = p.x - Math.sin(angle) * offsets[l],
        y = p.y + Math.cos(angle) * offsets[l],
        previous = lanes[l].at(-1);
      lanes[l].push({
        x,
        y,
        angle,
        distance: previous
          ? previous.distance + Math.hypot(x - previous.x, y - previous.y)
          : 0,
      });
    }
  });
  // Tangents must follow the offset lane itself, including tight bends.
  for (const lane of lanes)
    lane.forEach((p, i) => {
      const a = lane[Math.max(0, i - 1)],
        b = lane[Math.min(640, i + 1)];
      let angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (i) {
        while (angle - lane[i - 1].angle > Math.PI) angle -= 2 * Math.PI;
        while (angle - lane[i - 1].angle < -Math.PI) angle += 2 * Math.PI;
      }
      p.angle = angle;
    });
  const result = {
    id,
    points,
    lanes,
    width: 3200,
    height: c.loop ? 1800 : 900,
    name: c.name,
    loop: !!c.loop,
  };
  cache.set(id, result);
  return result;
}
export function coursePoint(id, progress, lane = 0) {
  const path = courseGeometry(id).lanes[clamp(lane | 0, 0, 3)],
    distance = clamp(progress, 0, 1) * path.at(-1).distance;
  let lo = 0,
    hi = path.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (path[mid].distance < distance) lo = mid;
    else hi = mid;
  }
  const a = path[lo],
    b = path[hi],
    t = (distance - a.distance) / (b.distance - a.distance || 1);
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    angle: a.angle + (b.angle - a.angle) * t,
    distance,
  };
}
export function circuitPicker(selected = "bosque") {
  return `<label class="circuit-picker">El circuito<select id="circuit-select">${Object.entries(
    CIRCUITS,
  )
    .map(
      ([id, c]) =>
        `<option value="${id}" ${id === selected ? "selected" : ""}>${c.name} · ${c.description}</option>`,
    )
    .join("")}</select></label>`;
}
export function courseMapHTML(id = "bosque") {
  const d = courseGeometry(id)
    .points.filter((_, i) => i % 8 === 0)
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  return `<svg viewBox="0 0 3200 ${courseGeometry(id).height}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
}

export class CircuitView {
  constructor(canvas, id = "bosque") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.course = courseGeometry(id);
    this.scene = canvas.closest?.(".curved-regatta") || null;
    this.legend = null;
    this.markerLayer = null;
    this.markerNodes = [];
    this.projectedMarkers = [];
    this.labelPlacements = [];
    this.markerSize = "";
    if (this.scene) {
      const boats = [...this.scene.querySelectorAll(".race-lane [data-racer]")];
      if (boats.length === 4) {
        const keys = ["T", "N", "R", "C"],
          colors = ["#f6b94f", "#b6a0d6", "#e48a70", "#8eb98e"];
        this.scene.querySelector(".circuit-legend")?.remove();
        this.legend = document.createElement("div");
        this.legend.className = "circuit-legend";
        this.legend.setAttribute("role", "list");
        this.legend.setAttribute("aria-label", "Personajes del circuito, en orden fijo, no por posición");
        boats.forEach((boat, i) => {
          const item = document.createElement("span"),
            key = document.createElement("b"),
            name = document.createElement("span");
          item.className = "circuit-legend-item";
          item.setAttribute("role", "listitem");
          item.style.setProperty("--racer-accent", colors[i]);
          key.className = "circuit-key";
          key.setAttribute("aria-hidden", "true");
          key.textContent = keys[i];
          name.textContent = i === 0 ? "Tú" : boat.querySelector(".lane-name")?.textContent?.trim() || "Rival";
          item.append(key, name);
          this.legend.append(item);
          boat.dataset.circuitKey = keys[i];
          boat.style.setProperty("--racer-accent", colors[i]);
        });
        this.scene.classList.add("circuit-has-legend");
        canvas.parentElement.append(this.legend);
        const ns = "http://www.w3.org/2000/svg",
          create = name => document.createElementNS(ns, name);
        this.markerLayer = create("svg");
        this.markerLayer.classList.add("circuit-callouts");
        this.markerLayer.setAttribute("aria-hidden", "true");
        this.markerLayer.setAttribute("preserveAspectRatio", "none");
        keys.forEach((key, i) => {
          const group = create("g"), outline = create("path"),
            line = create("path"), circle = create("circle"), text = create("text");
          outline.classList.add("callout-outline");
          line.classList.add("callout-line");
          circle.setAttribute("r", "11");
          circle.setAttribute("fill", colors[i]);
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("dy", ".35em");
          text.textContent = key;
          group.append(circle, text);
          this.markerLayer.append(outline, line);
          this.markerNodes.push({group, outline, line, lastTransform: "", lastLine: ""});
        });
        // Every label paints above every guide, including guides for later racers.
        this.markerNodes.forEach(({group}) => this.markerLayer.append(group));
        this.scene.classList.add("circuit-has-callouts");
        canvas.parentElement.append(this.markerLayer);
      }
    }
    this.image = new Image();
    this.image.src = "./assets/forest-river-v1.png";
    this.image.onload = () => {
      this.texture = null;
      this.paintWorld();
    };
    this.world = document.createElement("canvas");
    this.world.width = 3200;
    this.world.height = this.course.height;
    this.paintWorld();
  }
  paintWorld() {
    const ctx = this.world.getContext("2d"),
      p = this.course.points;
    // Only the physical river and its banks belong to the rotating world.
    // The forest is painted once in viewport space, without mirrored tiling.
    ctx.clearRect(0, 0, 3200, this.course.height);
    const path = () => {
      ctx.beginPath();
      p.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
    };
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const [width, color] of [
      [414, "#103b35"],
      [404, "#aab78c"],
      [384, "#e0c890"],
      [370, "#257e79"],
      [352, "#42bdb8"],
    ]) {
      path();
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    if (this.image.complete && this.image.naturalWidth) {
      const tile = document.createElement("canvas");
      tile.width = 1200;
      tile.height = 360;
      const t = tile.getContext("2d");
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 2; col++) {
          t.save();
          t.translate(col ? 1200 : 0, row ? 360 : 0);
          t.scale(col ? -1 : 1, row ? -1 : 1);
          t.drawImage(this.image, 350, 285, 1000, 300, 0, 0, 600, 180);
          t.restore();
        }
      path();
      ctx.strokeStyle = ctx.createPattern(tile, "repeat");
      ctx.lineWidth = 344;
      ctx.stroke();
    }
    // Subtle current marks and banks anchor movement in world coordinates.
    for (let i = 18; i < 630; i += 19) {
      const v = p[i],
        a = p[i + 1],
        angle = Math.atan2(a.y - v.y, a.x - v.x);
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(angle);
      ctx.strokeStyle = "#d5fff45c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-17, -75);
      ctx.lineTo(17, -75);
      ctx.moveTo(-12, 80);
      ctx.lineTo(12, 80);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 32; i < 620; i += 31) {
      const v = p[i],
        a = p[i + 1],
        angle = Math.atan2(a.y - v.y, a.x - v.x);
      for (const side of [-1, 1]) {
        const x = v.x - Math.sin(angle) * side * 206,
          y = v.y + Math.cos(angle) * side * 206;
        ctx.fillStyle = i % 2 ? "#d8c79a" : "#9cae86";
        ctx.beginPath();
        ctx.ellipse(x, y, 17, 10, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const [index, label] of this.course.loop
      ? [[0, "SALIDA · META"]]
      : [
          [0, "SALIDA"],
          [640, "META"],
        ]) {
      const v = p[index],
        a = p[index === 0 ? 1 : 639],
        angle =
          index === 0
            ? Math.atan2(a.y - v.y, a.x - v.x)
            : Math.atan2(v.y - a.y, v.x - a.x);
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(angle);
      for (let j = 0; j < 18; j++) {
        ctx.fillStyle = j % 2 ? "#fff5ce" : "#225449";
        ctx.fillRect(-5, -180 + j * 20, 10, 20);
      }
      ctx.fillStyle = "#fff6d8";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(label, -25, -209);
      ctx.restore();
    }
  }
  camera(progress, width, height, reduced = false) {
    const scale = clamp(height / 500, 0.42, 0.9),
      point = coursePoint(this.course.id, progress, 0);
    // Reduced motion keeps a fixed overview with 44px margins. Fitting only the
    // centerline to the viewport can otherwise clamp the learner at start/meta.
    if (reduced) {
      const fixedScale = Math.max(
        0.001,
        Math.min((width - 88) / 3200, (height - 88) / this.course.height),
      );
      return {
        scale: fixedScale,
        x: (3200 - width / fixedScale) / 2,
        y: (this.course.height - height / fixedScale) / 2,
        follow: progress,
      };
    }
    if (this.course.loop) {
      // Follow the learner's actual lane. A lane-2 anchor can put lane 0 outside
      // a short mobile viewport even though the learner is the camera subject.
      const center = point;
      return {
        scale,
        x: center.x,
        y: center.y,
        angle: point.angle,
        anchorX: width * 0.37,
        anchorY: height * 0.46,
        follow: progress,
      };
    }
    return {
      scale,
      x: clamp(
        point.x - (width / scale) * 0.37,
        0,
        Math.max(0, 3200 - width / scale),
      ),
      y: clamp(
        point.y - (height / scale) * 0.48,
        0,
        Math.max(0, 900 - height / scale),
      ),
      follow: progress,
    };
  }
  draw(progress, width, height, reduced = false) {
    const dpr = Math.min(1.5, devicePixelRatio || 1),
      cw = Math.round(width * dpr),
      ch = Math.round(height * dpr);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    const cam = this.camera(progress, width, height, reduced),
      ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#194d40";
    ctx.fillRect(0, 0, width, height);
    if (this.image.complete && this.image.naturalWidth && width > 0 && height > 0) {
      const forestHeight = Math.min(240, this.image.naturalWidth * height / width),
        forestWidth = forestHeight * width / height,
        forestLeft = (this.image.naturalWidth - forestWidth) / 2;
      ctx.drawImage(this.image, forestLeft, 0, forestWidth, forestHeight, 0, 0, width, height);
      ctx.fillStyle = "#164c3926";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.save();
    if (cam.angle !== undefined) {
      ctx.translate(cam.anchorX, cam.anchorY);
      ctx.rotate(-cam.angle);
    }
    ctx.translate(-cam.x * cam.scale, -cam.y * cam.scale);
    ctx.scale(cam.scale, cam.scale);

    ctx.drawImage(this.world, 0, 0);
    ctx.restore();
    return cam;
  }
  paintMarkers(width, height, boatWidth) {
    if (!this.markerLayer || ![0, 1, 2, 3].every(i => this.projectedMarkers[i])) return;
    const size = `0 0 ${width} ${height}`;
    if (size !== this.markerSize) {
      this.markerLayer.setAttribute("viewBox", size);
      this.markerSize = size;
    }
    const placed = [], left = 14, right = Math.max(left, width - 14),
      // Keep identity circles above the mobile message strip without DOM reads.
      top = Math.min(48, Math.max(14, height - 14)), bottom = Math.max(top, height - 40),
      offsets = [[0, 30], [60, 0], [-60, 0], [32, 32], [-32, 32], [40, -58], [-40, -58], [0, -82]];
    for (let i = 0; i < 4; i++) {
      const source = this.projectedMarkers[i], previous = this.labelPlacements[i],
        candidates = offsets.map(([dx, dy]) => ({x: source.x + dx, y: source.y + dy}));
      // Eight local positions + eight edge slots = exactly 16 candidates/actor.
      // This changes label placement only; the physical projected boat is fixed.
      for (let row = 0; row < 4; row++) {
        const y = top + (bottom - top) * row / 3;
        candidates.push({x: left, y}, {x: right, y});
      }
      let best = null, bestCost = Infinity;
      for (const candidate of candidates) {
        const x = clamp(candidate.x, left, right), y = clamp(candidate.y, top, bottom);
        if (placed.some(p => (x-p.x)**2 + (y-p.y)**2 < 26**2)) continue;
        const onBoat = this.projectedMarkers.some(p =>
          Math.abs(x-p.x) < boatWidth / 2 + 11 && y > p.y-boatWidth*.75-11 && y < p.y+23);
        const cost = (x-source.x)**2 + (y-source.y)**2 + (onBoat ? 30000 : 0) +
          (previous ? .15*((x-previous.x)**2 + (y-previous.y)**2) : 0);
        if (cost < bestCost) {best = {x,y}; bestCost = cost;}
      }
      // Scene CSS has a 160px minimum; the eight edge slots give four labels room.
      best ||= {x: clamp(source.x,left,right), y: clamp(source.y,top,bottom)};
      placed.push(best);
      const node = this.markerNodes[i],
        transform = `translate(${best.x.toFixed(1)} ${best.y.toFixed(1)})`,
        line = `M ${source.x.toFixed(1)} ${source.y.toFixed(1)} L ${best.x.toFixed(1)} ${best.y.toFixed(1)}`;
      if (transform !== node.lastTransform) {
        node.group.setAttribute("transform", transform);
        node.lastTransform = transform;
      }
      if (line !== node.lastLine) {
        node.outline.setAttribute("d", line);
        node.line.setAttribute("d", line);
        node.lastLine = line;
      }
    }
    this.labelPlacements = placed;
  }
  project(progress, lane, cam, width, height, boatWidth) {
    const p = coursePoint(this.course.id, progress, lane);
    let x = (p.x - cam.x) * cam.scale,
      y = (p.y - cam.y) * cam.scale;
    if (cam.angle !== undefined) {
      const a = -cam.angle,
        c = Math.cos(a),
        s = Math.sin(a),
        rx = x * c - y * s;
      y = x * s + y * c + cam.anchorY;
      x = rx + cam.anchorX;
    }
    const outside =
        x < boatWidth * 0.5 ||
        x > width - boatWidth * 0.5 ||
        y < 40 ||
        y > height - 35,
      edge = outside ? (progress > cam.follow ? "ahead" : "behind") : "";
    if (outside) {
      x = edge === "ahead" ? width - boatWidth * 0.55 : boatWidth * 0.55;
      y = 48 + ((height - 98) * [3, 0, 1, 2][lane]) / 3;
    }
    const projected = {
      x: clamp(x, boatWidth * 0.5, width - boatWidth * 0.5),
      y: clamp(y, 40, height - 35),
      angle:
        outside || cam.scale < 0.3
          ? 0
          : ((p.angle - (cam.angle || 0)) * 180) / Math.PI,
      edge,
    };
    this.projectedMarkers[clamp(lane | 0, 0, 3)] = projected;
    if ((lane | 0) === 3) this.paintMarkers(width, height, boatWidth);
    return projected;
  }
  dispose() {
    this.image.onload = null;
    this.legend?.remove();
    this.markerLayer?.remove();
    this.scene?.classList.remove("circuit-has-legend", "circuit-has-callouts");
    this.world.width = 1;
    this.world.height = 1;
  }
}
