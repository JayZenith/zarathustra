import { execFile } from "node:child_process";

export async function execShell(options: { cmd: string; cwd?: string }): Promise<string> {
  return await new Promise((resolve, reject) => {
    execFile("bash", ["-lc", options.cmd], { cwd: options.cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve([stdout, stderr].filter(Boolean).join(""));
    });
  });
}
