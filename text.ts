import { Denops, execute } from "./deps.ts";
import { Buffer } from "./buffer.ts";

export class TextWidget implements Buffer {
  #content: string;
  constructor() {
    this.#content = "";
  }

  setContent(content: string) {
    this.#content = content;
  }

  async render(denops: Denops) {
    await denops.call(
      "setline",
      1,
      this.#content.split(/\r?\n/g),
    );

    await execute(
      denops,
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
}
