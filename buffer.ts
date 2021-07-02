import { Denops } from "./deps.ts";

export interface Buffer {
  render: (denops: Denops) => Promise<void>;
}
