import { execFile } from "node:child_process";

export async function runPython(script: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    execFile("python3", ["-c", script], (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve([stdout, stderr].filter(Boolean).join(""));
    });
  });
}
