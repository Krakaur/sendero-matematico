import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { extractFile } from "@electron/asar";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const files = [];
for (const name of await readdir("web")) {
  const path = `web/${name}`;
  if ((await stat(path)).isFile()) {
    const bytes = await readFile(path);
    files.push({ path, bytes: bytes.length, sha256: sha(bytes) });
  }
}
for (const path of [
  "desktop/main.cjs",
  "package.json",
  "package-lock.json",
  "tests/core.test.js",
]) {
  const bytes = await readFile(path);
  files.push({ path, bytes: bytes.length, sha256: sha(bytes) });
}
const androidSources = execFileSync(
  "git",
  [
    "ls-files",
    "android",
    ".github/workflows/android.yml",
    "scripts/verify-android.py",
  ],
  { encoding: "utf8" },
)
  .trim()
  .split("\n");
for (const path of androidSources) {
  const content = await readFile(path);
  files.push({ path, bytes: content.length, sha256: sha(content) });
}
for (const path of files
  .filter((f) => f.path.startsWith("web/") || f.path === "desktop/main.cjs")
  .map((f) => f.path)) {
  const packed = extractFile("dist/win-unpacked/resources/app.asar", path);
  if (sha(packed) !== sha(await readFile(path)))
    throw Error(`Packaged source mismatch: ${path}`);
}
const version = JSON.parse(await readFile("package.json", "utf8")).version;
const artifact = `Sendero-${version}-Windows-x64.exe`;
const bytes = await readFile(`dist/${artifact}`);
for (const entry of files)
  entry.gitBlobSha256 = sha(
    execFileSync("git", ["show", `HEAD:${entry.path}`], { encoding: "buffer" }),
  );
const release = {
  version,
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  hashScope:
    "sha256: build workspace bytes; gitBlobSha256: committed bytes, which may use different line endings",
  generatedAt: new Date().toISOString(),
  files,
  windows: {
    artifact,
    bytes: bytes.length,
    sha256: sha(bytes),
    signature: "unsigned",
    packagedSourceMatches: true,
  },
};
const androidDir = "dist/android";
const androidAssets = JSON.parse(
  await readFile(`${androidDir}/apk-assets.json`, "utf8"),
);
for (const packed of androidAssets) {
  const source = files.find((f) => f.path === packed.path);
  if (!source || source.gitBlobSha256 !== packed.sha256)
    throw Error(`Android source mismatch: ${packed.path}`);
}
release.android = {
  sourceCommit: (
    await readFile(`${androidDir}/source-commit.txt`, "utf8")
  ).trim(),
  signatureVerification: (
    await readFile(`${androidDir}/apk-signature.txt`, "utf8")
  ).trim(),
  permissions: (
    await readFile(`${androidDir}/apk-permissions.txt`, "utf8")
  ).trim(),
  packagedSourceMatchesGit: true,
  artifacts: [],
};
for (const extension of ["apk", "aab"]) {
  const name = `Sendero-${version}-Android.${extension}`;
  const data = await readFile(`${androidDir}/${name}`);
  release.android.artifacts.push({
    artifact: name,
    bytes: data.length,
    sha256: sha(data),
  });
}
await writeFile(
  "docs/BUILD_MANIFEST.json",
  JSON.stringify(release, null, 2) + "\n",
);
await writeFile(
  "dist/SHA256SUMS.txt",
  `${sha(bytes)}  ${artifact}\n` +
    release.android.artifacts
      .map((a) => `${a.sha256}  ${a.artifact}\n`)
      .join(""),
);
console.log(
  JSON.stringify(
    {
      webBytes: files
        .filter((f) => f.path.startsWith("web/"))
        .reduce((n, f) => n + f.bytes, 0),
      windows: release.windows,
      android: release.android.artifacts,
    },
    null,
    2,
  ),
);
