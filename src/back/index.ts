import { Router as NeoRouter } from "../shared/neorest/Router.ts";
import { setupControllers } from "./controllers/setupControllers.ts";

export const neoRouter = new NeoRouter();

setupControllers(neoRouter);

console.log("BACKEND started");

