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
    ctx.fillStyle = "#2a684e";
    ctx.fillRect(0, 0, 3200, this.course.height);
    if (this.image.complete && this.image.naturalWidth) {
      // The original forest provides material detail on the banks. The water is
      // a separate surface clipped by the physical course, not a warped backdrop.
      const foliage = document.createElement("canvas");
      foliage.width = 1100;
      foliage.height = 520;
      const f = foliage.getContext("2d");
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 2; col++) {
          f.save();
          f.translate(col ? 1100 : 0, row ? 520 : 0);
          f.scale(col ? -1 : 1, row ? -1 : 1);
          f.drawImage(this.image, 0, 0, 850, 240, 0, 0, 550, 260);
          f.restore();
        }
      ctx.fillStyle = ctx.createPattern(foliage, "repeat");
      ctx.fillRect(0, 0, 3200, this.course.height);
      ctx.fillStyle = "#164c3926";
      ctx.fillRect(0, 0, 3200, this.course.height);
      this.terrainPattern = this.ctx.createPattern(foliage, "repeat");
    }
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
    // Reduced motion shows the entire course with a fixed camera.
    if (reduced)
      return {
        scale: Math.min(width / 3200, height / this.course.height),
        x: 0,
        y: 0,
        follow: progress,
      };
    if (this.course.loop) {
      const center = coursePoint(this.course.id, progress, 2);
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
    const center = this.course.points[Math.round(clamp(progress, 0, 1) * 640)];
    return {
      scale,
      x: clamp(
        point.x - (width / scale) * 0.37,
        0,
        Math.max(0, 3200 - width / scale),
      ),
      y: clamp(
        center.y - (height / scale) * 0.48,
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
    ctx.save();
    if (cam.angle !== undefined) {
      ctx.translate(cam.anchorX, cam.anchorY);
      ctx.rotate(-cam.angle);
    }
    ctx.translate(-cam.x * cam.scale, -cam.y * cam.scale);
    ctx.scale(cam.scale, cam.scale);
    ctx.fillStyle = this.terrainPattern || "#2a684e";
    ctx.fillRect(-3200, -1800, 9600, 5400);
    ctx.drawImage(this.world, 0, 0);
    ctx.restore();
    return cam;
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
    return {
      x: clamp(x, boatWidth * 0.5, width - boatWidth * 0.5),
      y: clamp(y, 40, height - 35),
      angle:
        outside || cam.scale < 0.3
          ? 0
          : ((p.angle - (cam.angle || 0)) * 180) / Math.PI,
      edge,
    };
  }
  dispose() {
    this.image.onload = null;
    this.world.width = 1;
    this.world.height = 1;
  }
}
