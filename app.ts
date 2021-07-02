import { Denops, execute, group, GroupHelper } from "./deps.ts";
import { Buffer } from "./buffer.ts";
import { Component, Route } from "./router.ts";

export class DenopsApp {
  #routes: {
    pathRegexp: RegExp;
    component: Component;
  }[];
  #denops: Denops;
  #commands: {
    name: string;
    path: string;
  }[];

  constructor(denops: Denops) {
    this.#routes = [];
    this.#denops = denops;
    this.#commands = [];
  }

  setRoutes(routes: Route[]) {
    this.#routes = routes.map((route) => ({
      pathRegexp: new RegExp(
        "^" + route.path.replaceAll(/\/:(\w+)/g, "/(?<$1>\\w+)") + "$",
      ),
      component: route.component,
    }));
    console.log(this.#routes);
  }

  addCommand(name: string, path: string) {
    this.#commands.push({ name: name, path: path });
  }

  matchRoute(path: string): Promise<Buffer> {
    for (const route of this.#routes) {
      const matched = path.match(route.pathRegexp);

      if (!matched) {
        continue;
      }

      const pathParams = matched.groups || {};
      return route.component(pathParams);
    }

    throw Error("not found");
  }

  async initialize() {
    this.#denops.dispatcher = {
      renderContents: async (path: unknown): Promise<void> => {
        const buffer = await this.matchRoute(
          (path as string).substring(`denopsapp://${this.#denops.name}`.length),
        );
        await buffer.render(this.#denops);
      },
    };

    this.#commands.forEach(async (cmd) => {
      await execute(
        this.#denops,
        `command! ${cmd.name} split denopsapp://${this.#denops.name}${cmd.path}`,
      );
    });

    await group(
      this.#denops,
      `${this.#denops.name}-buffer`,
      (helper: GroupHelper) => {
        helper.define(
          "BufReadCmd",
          `denopsapp://${this.#denops.name}/*`,
          `call denops#notify('${this.#denops.name}', 'renderContents', [expand('<amatch>')])`,
        );
      },
    );
  }
}
