// Usage (from apps/api): node scripts/export-web-demo.cjs ../web database/seeders/data/demo-content.json
// Transpile apps/web demo content (TS) in-memory and dump it as JSON for the Laravel seeders.
const path = require("path"), fs = require("fs"), Module = require("module");
const web = process.argv[2], out = process.argv[3];
const ts = require(path.join(web, "node_modules/typescript"));
const src = path.join(web, "src");
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (req, parent, ...rest) {
  if (req === "server-only") return path.join(__dirname, "noop.cjs");
  if (req.startsWith("@/")) req = path.join(src, req.slice(2));
  if (req.startsWith(".") && parent) req = path.resolve(path.dirname(parent.filename), req);
  for (const ext of ["", ".ts", ".tsx", "/index.ts"]) if (path.isAbsolute(req) && fs.existsSync(req + ext) && fs.statSync(req + ext).isFile()) return req + ext;
  return origResolve.call(this, req, parent, ...rest);
};
require.extensions[".ts"] = (m, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  m._compile(code, filename);
};
const d = (f) => require(path.join(src, "content/demo", f));
const catalog = d("catalog.ts"), news = d("news.ts"), jobs = d("jobs.ts"), pages = d("pages.ts"), home = d("home.ts");
const dump = {
  _source: "Generated from apps/web/src/content/demo/*.ts — regenerate with the command in apps/api/README.md",
  home: home.demoHome, services: catalog.demoServices, accounts: catalog.demoAccounts, financing: catalog.demoFinancing,
  cards: catalog.demoCards, locations: catalog.demoLocations, offers: catalog.demoOffers,
  newsCategories: news.demoNewsCategories, news: news.demoNews, jobs: jobs.demoJobs, faqGroups: jobs.demoFaqGroups, pages: pages.demoPages,
};
fs.writeFileSync(out, JSON.stringify(dump, null, 1) + "\n");
console.log(Object.fromEntries(Object.entries(dump).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v])));
