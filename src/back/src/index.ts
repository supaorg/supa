import { Router as NeoRouter } from "@shared/neorest/Router.ts";
import { Lang } from "aiwrapper"; // doesn't work as is

export const neoRouter = new NeoRouter();

/*
export async function sayHello() {
  const lang = Lang.openai({ apiKey: "" });

  const res = await lang.ask("Hello, world!");

  console.log(res);
}
*/