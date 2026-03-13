import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

export const PATHS = {
  repoRoot,
  program: path.join(repoRoot, "program.md"),
  targetsDir: path.join(repoRoot, "targets"),
  varDir: path.join(repoRoot, "var"),
  runsDir: path.join(repoRoot, "var", "runs"),
  cacheDir: path.join(repoRoot, "var", "cache"),
  dbFile: path.join(repoRoot, "var", "zarathustra.sqlite"),
  schemaFile: path.join(repoRoot, "src", "memory", "schema.sql"),
};
