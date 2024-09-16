import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { Router as NeoRouter } from "../shared/neorest/Router.ts";
import { ProcessPortMsg } from "@shared/serverProcessMessages.ts";
import { startServer } from "./startServer.ts";
import { setupControllers } from "./controllers/setupControllers.ts";
import { ServerInfo } from "@shared/models.ts";

const app = new Application();
const httpRouter = new Router();
export const neoRouter = new NeoRouter();

setupControllers(neoRouter);

httpRouter.get("/", (context) => {
  if (!context.isUpgradable) {
    context.response.body = {
      version: "0.1.0",
      type: "local",
      workspaces: [],
    } as ServerInfo;
    return;
  }
  const socket = context.upgrade();
  const connSecret = context.request.url.searchParams.get("connsecret");

  neoRouter.addSocket(socket, connSecret);
});

app.use((ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "*",
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE",
  );
  return next();
});

app.use(httpRouter.routes());
app.use(httpRouter.allowedMethods());

startServer(app, 6969, (port) => {
  // We send the port as a JSON message so the parent process can identify it.
  console.log(JSON.stringify({ type: "port", value: port } as ProcessPortMsg));
});
