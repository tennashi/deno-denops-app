import { Buffer } from "./buffer.ts";

export type PathParams = { [key: string]: string };

export type Component = (params: PathParams) => Promise<Buffer>;

interface Route {
  path: string;
  component: Component;
}

export type { Route };
