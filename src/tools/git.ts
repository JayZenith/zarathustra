import { execShell } from "./shell.js";

export async function gitStatus(cwd: string): Promise<string> {
  return await execShell({ cmd: "git status --short --branch", cwd });
}
