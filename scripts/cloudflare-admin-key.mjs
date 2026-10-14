// Run once on the owner's computer. The raw key never enters Git or terminal output.
import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const file = new URL(
  "../server/private/cloudflare-admin.json",
  import.meta.url,
);
try {
  await access(file);
  throw Error("El archivo ya existe; no se sustituye automáticamente.");
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const token = randomBytes(32).toString("hex");
await mkdir(new URL("../server/private/", import.meta.url), {
  recursive: true,
});
await writeFile(
  file,
  JSON.stringify(
    {
      schema: "sendero.admin.v1",
      endpoint: "https://sendero-aula.dirkhans.workers.dev",
      token,
    },
    null,
    2,
  ) + "\n",
  { flag: "wx", mode: 0o600 },
);
const result = spawnSync(
  process.execPath,
  [
    "node_modules/wrangler/bin/wrangler.js",
    "secret",
    "put",
    "ADMIN_TOKEN_HASH",
    "--config",
    "cloudflare/wrangler.jsonc",
  ],
  {
    cwd: root,
    input: createHash("sha256").update(token).digest("hex"),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  },
);
// Wrangler only receives the hash. Its ordinary result is safe to display.
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
if (result.status !== 0) {
  console.error(
    "Se conservó el archivo privado. Reintenta instalar su hash sin generar otra clave.",
  );
  process.exit(result.status || 1);
}
console.log(
  "Acceso administrativo conservado en server/private/cloudflare-admin.json.",
);
