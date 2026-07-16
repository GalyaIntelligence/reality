import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "assets/self-improving-judgement-loop.svg");
const svg = fs.readFileSync(svgPath);

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1960 },
  background: "transparent",
});
const png = resvg.render().asPng();

const jpg = await sharp(png).jpeg({ quality: 92, mozjpeg: true }).toBuffer();

const outs = [
  path.join(root, "assets/self-improving-judgement-loop.jpg"),
  path.join(root, "judgement-loop.jpg"),
  path.join(root, "docs/public/judgement-loop.jpg"),
  path.join(root, "docs/public/self-improving-judgement-loop.jpg"),
];

for (const out of outs) {
  fs.writeFileSync(out, jpg);
  console.log("wrote", out);
}
