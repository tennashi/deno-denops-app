import { Denops } from "./deps.ts";
import { ContentsConstructor } from "./buffer.ts";

export class TextWidget implements ContentsConstructor {
  #content: string;
  constructor() {
    this.#content = "";
  }

  setContent(content: string) {
    this.#content = content;
  }

  async setKeybinds(_: Denops) {}

  contents(): string[] {
    return this.#content.split(/\r?\n/g);
  }
}
