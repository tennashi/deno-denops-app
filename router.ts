import { Buffer } from "./buffer.ts";

export type Context = { [key: string]: string };

export type Component = (context: Context) => Promise<Buffer>;

interface Route {
  path: string;
  component: Component;
}

export type { Route };
