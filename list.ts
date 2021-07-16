import { Denops, execute } from "./deps.ts";
import { ContentsConstructor } from "./buffer.ts";

export class ListWidget<T> implements ContentsConstructor {
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

  setItems(items: T[]) {
    this.#items = items;
  }

  addItem(item: T) {
    this.#items.push(item);
  }

  handleKey(key: string, handler: (denops: Denops, item: T) => Promise<void>) {
    this.#keybinds[key] = handler;
  }

  async setKeybinds(denops: Denops) {
    denops.dispatcher["keyHandler"] = async (
      key: unknown,
      index: unknown,
    ): Promise<void> => {
      await this.#keybinds[key as string](
        denops,
        this.#items[index as number],
      );
    };
    await Object.keys(this.#keybinds).forEach(async (key) => {
      await execute(
        denops,
        `nmap <buffer><expr> ${key} denops#notify('${denops.name}', 'keyHandler', ['${
          key.replaceAll("<", "<lt>")
        }', string(line('.') - 1)])`,
      );
    });
  }

  contents(): string[] {
    return this.#items.map(this.#renderFn);
  }
}
