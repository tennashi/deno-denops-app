import { Denops, diff, execute } from "./deps.ts";

export interface ContentsConstructor {
  setKeybinds: (denops: Denops) => Promise<void>;
  contents: () => string[];
}

export class VimBuffer {
  #denops: Denops;
  #currentContents: string[];
  #keybindInitializer: (denops: Denops) => Promise<void>;

  constructor(denops: Denops) {
    this.#denops = denops;
    this.#currentContents = [];
    this.#keybindInitializer = async (_: Denops) => {};
  }

  setKeybindInitializer(f: (denops: Denops) => Promise<void>) {
    this.#keybindInitializer = f;
  }

  async renderContents(contents: string[]) {
    if (this.#currentContents.length == 0) {
      await this.initBuffer(contents);
      return;
    }

    await this.updateBuffer(contents);
  }

  private async initBuffer(contents: string[]) {
    await this.#denops.cmd(`setlocal modifiable`);

    await this.#denops.call("setline", 1, contents);

    this.#currentContents = contents;

    await this.#keybindInitializer(this.#denops);

    await execute(
      this.#denops,
      [
        `setlocal bufhidden=hide`,
        `setlocal buftype=nofile`,
        `setlocal nobuckup`,
        `setlocal noswapfile`,
        `setlocal nomodified`,
        `setlocal nomodifiable`,
      ],
    );
  }

  private async updateBuffer(contents: string[]) {
    await this.#denops.cmd(`setlocal modifiable`);

    let lnum = 1;
    const ops = diff(this.#currentContents, contents);
    ops.forEach((op) => {
      switch (op.type) {
        case "removed":
          this.#denops.cmd(`call deletebufline('%', ${lnum})`);
          break;
        case "added":
          this.#denops.cmd(
            `call appendbufline('%', ${lnum - 1}, '${op.value}')`,
          );
          lnum++;
          break;
        default:
          lnum++;
      }
    });

    this.#currentContents = contents;

    await this.#denops.cmd(`setlocal nomodifiable`);
  }
}
