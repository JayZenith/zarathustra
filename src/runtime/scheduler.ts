import { sleep } from "../lib/time.js";

export async function waitForNextCycle(delayMs = 1_000): Promise<void> {
  await sleep(delayMs);
}
