import { Buffer } from "./buffer.ts";

export type Context = { [key: string]: string };

export type Component = (context: Context) => Promise<Buffer>;

export interface Route {
  path: string;
  component: Component;
}
