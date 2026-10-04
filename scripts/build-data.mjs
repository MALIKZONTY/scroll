// Turns content/<topic>/*.txt (one post per line) into public/data/<topic>.json.
// A literal "\n" inside a line is a line break in the post. Lines starting with # are comments.
// IDs are a hash of the text, so seen/liked state survives reordering and new batches.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOPICS = {
  pickup: "pk", love: "lv", heartbreak: "hb", quotes: "qt", motivation: "mo", relatable: "rl",
  friendship: "fr", space: "sp", earth: "ea", time: "tm", psychology: "ps", mindblown: "mb", animals: "an",
};
const MAX_LEN = 300;

const fnv = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
};
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set("a an the is are was were of to in on at and or but for with you your i me my it its that this be as by from".split(" "));
const words = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)));
const jaccard = (a, b) => {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter || 1);
};

let total = 0, problems = 0;
const verbose = process.argv.includes("--verbose");
let similar = 0;
const seenAcross = new Map(); // normalized text -> topic

for (const [topic, code] of Object.entries(TOPICS)) {
  const dir = join(root, "content", topic);
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".txt")).sort() : [];
  const rows = [];
  const exact = new Map();
  const ids = new Set();
  const sets = [];
  for (const f of files) {
    readFileSync(join(dir, f), "utf8").split("\n").forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith("#")) return;
      const text = line.replace(/\\n/g, "\n").replace(/[ \t]+/g, " ");
      const where = `${topic}/${f}:${i + 1}`;
      const n = norm(text);
      if (exact.has(n)) { console.warn(`  dup      ${where} = ${exact.get(n)}`); problems++; return; }
      if (seenAcross.has(n)) { console.warn(`  dup      ${where} also in ${seenAcross.get(n)}`); problems++; return; }
      if (text.length > MAX_LEN) { console.warn(`  long     ${where} (${text.length} chars)`); problems++; }
      const ws = words(text);
      if (ws.size >= 4) {
        const twin = sets.find(([other]) => jaccard(ws, other) >= 0.7);
        if (twin) {
          if (verbose) console.warn(`  similar  ${where} ~ ${twin[1]} (dropped)`);
          similar++;
          return;
        }
      }
      let id = `${code}-${fnv(n)}`;
      if (ids.has(id)) { console.warn(`  id clash ${where}`); problems++; id += "x"; }
      exact.set(n, where);
      seenAcross.set(n, topic);
      ids.add(id);
      sets.push([ws, where]);
      rows.push([id, text]);
    });
  }
  writeFileSync(join(root, "public", "data", `${topic}.json`), JSON.stringify(rows));
  console.log(`${topic.padEnd(11)} ${String(rows.length).padStart(5)} posts`);
  total += rows.length;
}
console.log(`total       ${String(total).padStart(5)} posts${problems ? `, ${problems} warnings` : ""}${similar ? `, ${similar} near-duplicates dropped` : ""}`);
