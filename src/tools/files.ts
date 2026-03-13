import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function readTextFile(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8");
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}
