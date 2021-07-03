import { Denops, execute } from "./deps.ts";
import { Buffer } from "./buffer.ts";

export class ListWidget<T> implements Buffer {
  #items: {
    item: T;
    renderFn: (item: T) => string;
  }[];

  #keybinds: {
    [key: string]: (denops: Denops, item: T) => Promise<void>;
  };

  constructor() {
    this.#items = [];
    this.#keybinds = {};
  }

  setItem(item: T, renderFn: (item: T) => string) {
    this.#items.push({ item, renderFn });
  }

  handleKey(key: string, handler: (denops: Denops, item: T) => Promise<void>) {
    this.#keybinds[key] = handler;
  }

  async render(denops: Denops) {
    await denops.call(
      "setline",
      1,
      this.#items.map((item) => item.renderFn(item.item)),
    );

    denops.dispatcher[`keyHandler`] = async (
      key: unknown,
      index: unknown,
    ): Promise<void> => {
      await this.#keybinds[key as string](
        denops,
        this.#items[index as number].item,
      );
    };

    Object.keys(this.#keybinds).forEach(async (key) => {
      await execute(
        denops,
        `nmap <buffer><expr> ${key} denops#notify('${denops.name}', 'keyHandler', ['${
          key.replaceAll("<", "<lt>")
        }', string(line('.') - 1)])`,
      );
    });

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
