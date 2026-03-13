import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function appendJsonLine(filePath: string, payload: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
}
