import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { Router as NeoRouter } from "../shared/restOnSockets/Router.ts";
import { ProcessPortMsg } from "@shared/serverProcessMessages.ts";
import { controllers } from "./controllers.ts";
import { startServer } from "./startServer.ts";

const app = new Application();
const httpRouter = new Router();
const neoRouter = new NeoRouter();

controllers(neoRouter);

httpRouter.get("/", (context) => {
  if (!context.isUpgradable) {
    context.response.body = "Supamind API is running!";
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
