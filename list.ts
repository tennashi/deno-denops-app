import { Denops, execute, diff } from "./deps.ts";
import { Buffer } from "./buffer.ts";

export class ListWidget<T> implements Buffer {
  #renderFn: (item: T) => string;
  #items: T[];
  #renderdItems: T[];
  #firstRenderd: boolean;

  #keybinds: {
    [key: string]: (denops: Denops, item: T) => Promise<void>;
  };

  constructor(renderFn: (item: T) => string) {
    this.#items = [];
    this.#renderdItems = [];
    this.#renderFn = renderFn;
    this.#keybinds = {};
    this.#firstRenderd = false;
  }

  setItems(items: T[]) {
    this.#items = items;
  }

  addItem(item: T) {
    this.#items.push(item);
  }

  handleKey(key: string, handler: (denops: Denops, item: T) => Promise<void>) {
    this.#keybinds[key] = handler;
  }

  async render(denops: Denops) {
    await execute(
      denops,
      [
        `setlocal modifiable`,
      ],
    );

    if (!this.#firstRenderd) {
      await denops.call('setline', 1, this.#items.map(this.#renderFn));
      this.#firstRenderd = true;
    } else {
      const renderd = this.#renderdItems.map(this.#renderFn)
      const willRender = this.#items.map(this.#renderFn)
      const ops = diff(renderd, willRender);

      let lnum = 1;
      ops.forEach((op) => {
        switch (op.type) {
        case "removed":
          execute(denops, `call deletebufline('%', ${lnum})`);
          break;
        case "added":
          execute(denops, `call appendbufline('%', ${lnum - 1}, '${op.value}')`)
          lnum++;
          break;
        default:
          lnum++;
        }
      });
    }

    this.#renderdItems = this.#items.slice();

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
