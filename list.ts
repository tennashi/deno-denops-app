import { Denops, execute } from "./deps.ts";
import { Buffer } from "./buffer.ts";

export class ListWidget<T> implements Buffer {
  #renderFn: (item: T) => string;
  #items: T[];

  #keybinds: {
    [key: string]: (denops: Denops, item: T) => Promise<void>;
  };

  constructor(renderFn: (item: T) => string) {
    this.#items = [];
    this.#renderFn = renderFn;
    this.#keybinds = {};
  }

  addItem(item: T) {
    this.#items.push(item);
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
        this.#items[index as number],
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
