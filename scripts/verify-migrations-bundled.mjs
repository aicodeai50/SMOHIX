import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");
const bundlePath = path.join(root, "supabase", "apply-all-migrations.sql");

const migrations = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const bundle = fs.existsSync(bundlePath) ? fs.readFileSync(bundlePath, "utf8") : "";
const missing = migrations.filter((name) => !bundle.includes(`-- ${name}`));

if (missing.length > 0) {
  console.error("apply-all-migrations.sql is missing migrations:");
  for (const name of missing) {
    console.error(`- ${name}`);
  }
  console.error("Run: npm run db:bundle");
  process.exit(1);
}

console.log(`verify-migrations-bundled: ok (${migrations.length} migrations)`);
