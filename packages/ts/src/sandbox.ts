/** Child-process smoke-test before first real use of a validator. */

import { spawnSync } from "node:child_process";
import { EntrypointError } from "./errors.js";

export function smokeTest(dir: string, entrypoint: string, name: string): void {
  const [modulePath, className] = entrypoint.split(":");
  if (!modulePath || !className) {
    throw new EntrypointError(name, `invalid entrypoint '${entrypoint}'`);
  }

  const script = `
    import { pathToFileURL } from "node:url";
    import path from "node:path";
    const dir = ${JSON.stringify(dir)};
    const modPath = ${JSON.stringify(modulePath)};
    const className = ${JSON.stringify(className)};
    const resolved = path.isAbsolute(modPath)
      ? modPath
      : path.join(dir, modPath.endsWith(".ts") || modPath.endsWith(".js") ? modPath : modPath + ".ts");
    // Try .ts then .js
    import("node:fs").then(async (fs) => {
      let file = resolved;
      if (!fs.existsSync(file)) {
        const js = file.replace(/\\.ts$/, ".js");
        if (fs.existsSync(js)) file = js;
        else if (fs.existsSync(file + ".ts")) file = file + ".ts";
        else if (fs.existsSync(file + ".js")) file = file + ".js";
      }
      const mod = await import(pathToFileURL(file).href);
      const Cls = mod[className] ?? mod.default?.[className] ?? mod.default;
      if (typeof Cls !== "function") throw new Error("class not found: " + className);
      const inst = new Cls();
      if (!inst.name) throw new Error("missing name");
      if (!inst.latencyClass) throw new Error("missing latencyClass");
      if (typeof inst.index !== "function") throw new Error("missing index");
      if (typeof inst.judge !== "function") throw new Error("missing judge");
      if (!["inline", "async"].includes(inst.latencyClass)) {
        throw new Error("bad latencyClass: " + inst.latencyClass);
      }
      console.log("OK");
    }).catch((e) => { console.error(e); process.exit(1); });
  `;

  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    encoding: "utf8",
  });

  if (result.status !== 0 || !(result.stdout ?? "").includes("OK")) {
    const detail = (result.stderr || result.stdout || "smoke test failed").trim();
    throw new EntrypointError(name, detail);
  }
}
