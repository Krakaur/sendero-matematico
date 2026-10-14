import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const outputDirectory = new URL(
  "../qa-private/" + (process.argv[2] || "cloudflare-20261014") + "/",
  import.meta.url,
);
const root = fileURLToPath(new URL("../web/", import.meta.url)),
  base = "https://krakaur.github.io/sendero-matematico/";
async function walk(dir) {
  const result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isDirectory()) result.push(...(await walk(path)));
    else if (e.isFile()) result.push(path);
  }
  return result;
}
const files = await walk(root),
  records = [],
  sha = (b) => createHash("sha256").update(b).digest("hex");
for (let i = 0; i < files.length; i += 4)
  records.push(
    ...(await Promise.all(
      files.slice(i, i + 4).map(async (file) => {
        const name = relative(root, file).replaceAll("\\", "/"),
          expected = execFileSync("git", ["show", "HEAD:web/" + name], {
            cwd: root,
            maxBuffer: 20 * 1024 * 1024,
          }),
          r = await fetch(base + name, {
            headers: { "Cache-Control": "no-cache" },
            signal: AbortSignal.timeout(30000),
          }),
          bytes = Buffer.from(await r.arrayBuffer());
        return {
          file: name,
          status: r.status,
          bytes: bytes.length,
          sha256: sha(bytes),
          matches: r.ok && sha(bytes) === sha(expected),
        };
      }),
    )),
  );
const result = {
  at: new Date().toISOString(),
  url: base,
  count: records.length,
  allMatch: records.every((r) => r.matches),
  records,
};
await mkdir(outputDirectory, {
  recursive: true,
});
await writeFile(
  new URL("public-web.json", outputDirectory),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify({
    count: result.count,
    allMatch: result.allMatch,
    mismatches: records.filter((r) => !r.matches),
  }),
);
if (!result.allMatch) process.exitCode = 1;
