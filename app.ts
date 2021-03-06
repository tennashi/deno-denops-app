import { Denops, execute, group, GroupHelper } from "./deps.ts";
import { ContentsConstructor, VimBuffer } from "./buffer.ts";
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
  }

  addCommand(name: string, path: string) {
    this.#commands.push({ name: name, path: path });
  }

  private matchRoute(path: string): Promise<ContentsConstructor> {
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
      ...this.#denops.dispatcher,
      renderContents: async (path: unknown): Promise<void> => {
        const constructor = await this.matchRoute(
          (path as string).substring(`denopsapp://${this.#denops.name}`.length),
        );
        const buffer = new VimBuffer(this.#denops);
        buffer.setKeybindInitializer(constructor.setKeybinds.bind(constructor));
        await buffer.renderContents(constructor.contents());
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
