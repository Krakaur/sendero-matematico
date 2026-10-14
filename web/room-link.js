// Loaded only after choosing online play. PeerServer exchanges connection
// metadata; the encrypted WebRTC data channel carries the private match.
let peerLibrary;
async function library() {
  if (globalThis.Peer) return globalThis.Peer;
  peerLibrary ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "./vendor/peerjs-1.5.5.min.js";
    script.onload = () => resolve(globalThis.Peer);
    script.onerror = () => {
      peerLibrary = null;
      script.remove();
      reject(
        Error(
          "No se pudo cargar la conexión. Comprueba internet y vuelve a intentarlo.",
        ),
      );
    };
    document.head.append(script);
  });
  return peerLibrary;
}
export function readRoomInvitation(value) {
  const u = new URL(value, location.href),
    p = new URLSearchParams(u.hash.slice(1)),
    room = p.get("sala"),
    key = p.get("llave");
  if (
    !/^sendero-[a-f0-9-]{36}$/.test(room || "") ||
    !/^[a-f0-9]{32}$/.test(key || "")
  )
    throw Error("El enlace de invitación está incompleto o no es válido.");
  return { room, key };
}
function wireData(conn, handler) {
  conn.on("data", (data) => {
    try {
      if (
        !data ||
        typeof data !== "object" ||
        JSON.stringify(data).length > 524288
      )
        return;
      handler(data);
    } catch {
      /* Invalid remote packets do not execute code. */
    }
  });
}
export class RoomLink {
  constructor(events = {}) {
    this.events = events;
    this.connections = new Map();
    this.closed = false;
    this.host = false;
    this.lastSeen = new Map();
    this.members = new Map();
  }
  async open(id) {
    const Peer = await library();
    if (this.closed) throw Error("Conexión cancelada.");
    this.peer = new Peer(id || "sendero-" + crypto.randomUUID(), {
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
      debug: 0,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });
    this.peer.on("error", (error) =>
      this.events.error?.(
        error.type === "peer-unavailable"
          ? "La sala ya no está disponible. Pide un enlace nuevo."
          : "No se pudo conectar. Prueba otra red o juega en esta pantalla.",
      ),
    );
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            Error(
              "La conexión tardó demasiado. Prueba otra red o juega en esta pantalla.",
            ),
          ),
        16000,
      );
      this.peer.once("open", (id) => {
        clearTimeout(timer);
        this.id = id;
        resolve();
      });
      this.peer.once("error", () => {
        clearTimeout(timer);
        reject(
          Error(
            "El servicio de conexión no está disponible. Puedes jugar en esta pantalla.",
          ),
        );
      });
    });
  }
  async create(saved) {
    this.host = true;
    this.key = saved?.key || crypto.randomUUID().replaceAll("-", "");
    this.members=new Map(saved?.members||[]);
    await this.open(saved?.room || "sendero-" + crypto.randomUUID());
    this.peer.on("connection", (conn) => {
      if (
        conn.metadata?.protocol !== 1 ||
        conn.metadata?.key !== this.key ||
        (this.connections.size >= 3 && !this.connections.has(conn.peer)) ||
        !/^[a-f0-9]{32}$/.test(conn.metadata?.identity||'') ||
        (this.members.has(conn.peer)&&this.members.get(conn.peer)!==conn.metadata.identity)
      ) {
        conn.on("open", () => conn.close());
        return;
      }
      conn.on("open", () => {
        if (
          this.closed ||
          this.connections.has(conn.peer) ||
          this.events.join?.(conn.peer) === false
        ) {
          conn.close();
          return;
        }
        this.members.set(conn.peer,conn.metadata.identity);
        this.connections.set(conn.peer, conn);
        this.lastSeen.set(conn.peer, performance.now());
        this.events.connected?.(conn.peer);
        this.ping(conn);
      });
      wireData(conn, (data) => {
        if (this.connections.get(conn.peer) !== conn) return;
        this.lastSeen.set(conn.peer, performance.now());
        if (data.type === "pong" && Number.isFinite(data.sent)) {
          const rtt = performance.now() - data.sent;
          if (rtt >= 0 && rtt < 30000) this.events.latency?.(conn.peer, rtt);
          return;
        }
        if (data.type === "action")
          this.events.action?.(conn.peer, data.action);
      });
      conn.on("close", () => {
        if (this.connections.get(conn.peer) === conn) {
          this.connections.delete(conn.peer);
          this.events.close?.(conn.peer);
        }
      });
      conn.on("error", () => {
        if(this.connections.get(conn.peer)===conn){this.connections.delete(conn.peer);conn.close();this.events.close?.(conn.peer);}
      });
    });
    this.heartbeat = setInterval(() => {
      for (const conn of this.connections.values()) {
        this.ping(conn);
        if (performance.now() - (this.lastSeen.get(conn.peer) || 0) > 7000){
          this.events.slow?.(conn.peer);this.connections.delete(conn.peer);conn.close();this.events.close?.(conn.peer);
        }
      }
    }, 2000);
    const u = new URL("./juntos.html", location.href);
    u.hash = new URLSearchParams({ sala: this.id, llave: this.key }).toString();
    return u.href;
  }
  hostRecovery(){return this.host?{room:this.id,key:this.key,members:[...this.members]}:null;}
  async join(invitation) {
    const storageKey='sendero.room.identity.'+invitation.room;
    let identity;try{identity=JSON.parse(sessionStorage.getItem(storageKey));}catch{}
    if(!/^sendero-[a-f0-9-]{36}$/.test(identity?.id||'')||!/^[a-f0-9]{32}$/.test(identity?.token||''))identity={id:'sendero-'+crypto.randomUUID(),token:crypto.randomUUID().replaceAll('-','')};
    try{sessionStorage.setItem(storageKey,JSON.stringify(identity));}catch{}
    await this.open(identity.id);
    this.connection = this.peer.connect(invitation.room, {
      reliable: true,
      serialization: "json",
      metadata: { protocol: 1, key: invitation.key, identity:identity.token },
    });
    const conn = this.connection;
    wireData(conn, (data) => {
      this.lastMessage = performance.now();
      if (data.type === "ping") {
        conn.send({ type: "pong", sent: data.sent });
        return;
      }
      if (data.type === "state") {
        this.receivedState = true;
        this.events.snapshot?.(data.state, this.id);
      }
      if (data.type === "end")
        this.events.error?.(
          "La persona que creó la sala la ha cerrado. No se adjudica una victoria.",
        );
    });
    conn.on("close", () => {
      this.ended = true;
      clearInterval(this.heartbeat);
      if (this.receivedState) this.events.close?.(invitation.room);
      else
        this.events.error?.(
          "No se pudo entrar. Comprueba la invitación; la sala puede estar completa, iniciada o cerrada.",
        );
    });
    conn.on("error", () =>
      this.events.error?.("Se interrumpió la conexión. Puedes reconectar desde esta pestaña y recuperar tu lugar."),
    );
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            Error(
              "No se pudo establecer la partida. Esta red puede impedir la conexión directa. Prueba otra red o el modo en esta pantalla.",
            ),
          ),
        20000,
      );
      conn.once("open", () => {
        clearTimeout(timer);
        this.lastMessage = performance.now();
        resolve();
      });
      conn.once("close", () => {
        clearTimeout(timer);
        reject(
          Error(
            "La sala está completa, iniciada o cerrada. Pide una nueva invitación.",
          ),
        );
      });
    });
    if (this.ended || this.closed) return;
    this.heartbeat = setInterval(() => {
      if (performance.now() - this.lastMessage > 7000) this.events.slow?.();
    }, 2000);
  }
  ping(conn) {
    if (conn.open) conn.send({ type: "ping", sent: performance.now() });
  }
  send(action) {
    if (this.connection?.open) this.connection.send({ type: "action", action });
  }
  broadcast(state) {
    for (const conn of this.connections.values())
      if (conn.open) conn.send({ type: "state", state });
  }
  close() {
    this.closed = true;
    clearInterval(this.heartbeat);
    for (const c of this.connections.values()) {
      if (c.open) c.send({ type: "end" });
      c.close();
    }
    this.connection?.close();
    this.peer?.destroy();
    this.connections.clear();
  }
}
