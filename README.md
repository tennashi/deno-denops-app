# WIP: denops_app

UI module for [denops.vim](https://github.com/vim-denops/denops.vim).

```typescript
import { Denops } from "https://deno.land/x/denops_std@v1.0.0-alpha.0/mod.ts";
import { DenopsApp, TextWidget, ListWidget, Buffer, Route, PathParams } from "https://deno.land/x/denops_app@v0.0.3/mod.ts";

const items = [
  { id: 1, hoge: "hoge" },
  { id: 2, hoge: "hogehoge" },
  { id: 3, hoge: "hogehogehoge" },
]

const listHoge = (_params: PathParams): Promise<Buffer> => {
  const list = new ListWidget<{ id: number, hoge: string }>();
  items.forEach((item) => { 
    list.setItem(item, (item: { id: number, hoge: string}): string => item.hoge);
  });

  list.handleKey("<CR>", async (denops: Denops, item: { id: number, hoge: string }) => {
    await denops.cmd(`bd! | new denopsapp://${denops.name}/hoge/${item.id}`)
  });

  return Promise.resolve(list);
}

const detailHoge = (params: PathParams): Promise<Buffer> => {
  const text = new TextWidget();

  text.setContent(`Hoge: ${items[Number(params.id) - 1].hoge}`);

  return Promise.resolve(text);
}

export async function main(denops: Denops): Promise<void> {
  const app = new DenopsApp(denops);

  const routes: Route[] = [
    { path: "/hoge", component: listHoge },
    { path: "/hoge/:id", component: detailHoge },
  ];

  app.setRoutes(routes);
  app.addCommand("DenopsAppAwesomeListHoge", "/hoge");

  await app.initialize();
}
```
