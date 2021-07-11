import { Denops } from "./deps.ts";
import { Buffer } from "./buffer.ts";

export type PathParams = { [key: string]: string };

export type Component = (params: PathParams) => Promise<Buffer>;

export async function route(denops: Denops, path: string) {
  await denops.cmd(`bd! | new denopsapp://${denops.name}${path}`);
}

interface Route {
  path: string;
  component: Component;
}

export type { Route };
