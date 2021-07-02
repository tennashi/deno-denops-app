import { Denops } from "./deps.ts";

interface Buffer {
  render: (denops: Denops) => Promise<void>;
}

export type { Buffer };
