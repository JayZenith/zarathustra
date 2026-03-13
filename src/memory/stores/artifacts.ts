import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { createId } from "../../lib/ids.js";
import { nowIso } from "../../lib/time.js";
import type { MemoryRepo } from "../repo.js";

export async function recordArtifact(
  repo: MemoryRepo,
  sessionId: string,
  kind: string,
  filePath: string,
): Promise<string> {
  const [file, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);
  const sha256 = createHash("sha256").update(file).digest("hex");
  const id = createId("artifact");
  repo.db
    .query(
      `
        insert into artifacts (
          id, session_id, kind, path, sha256, size_bytes, created_at
        ) values (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(id, sessionId, kind, filePath, sha256, fileStat.size, nowIso());
  return id;
}
