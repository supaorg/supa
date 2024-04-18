import { Chat } from "./chat.ts";
import { v4 as uuidv4 } from "npm:uuid";
import { Application, Router as Router } from "https://deno.land/x/oak/mod.ts";
import { Router as NeoRouter } from "../shared/restOnSockets/Router.ts";
import { AppDb } from "./db/appDb.ts";
import { load } from "https://deno.land/std@0.202.0/dotenv/mod.ts";
import { ProcessPortMsg } from "@shared/serverProcessMessages.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { ThreadMessage } from "@shared/models.ts";
import { Agent, Profile } from "../shared/models.ts";
import { defaultAgent } from "./agents/defaultAgent.ts";

const app = new Application();
const httpRouter = new Router();
const neoRouter = new NeoRouter();

// Let's load the .env varialbes explicitly at the very beginning.
await load({ export: true });

let dataPath = "data-dev/";

if (Deno.args.length > 0) {
  dataPath = Deno.args[0];
}

await ensureDir(dataPath);

const db = new AppDb(dataPath);
const aiChat = new Chat();

function getOpenaiKey(): string {
  const secrets = JSON.parse(Deno.readTextFileSync(dataPath + "secrets.json"));

  return secrets.openai;
}

function getUserName() {
  const profile = JSON.parse(Deno.readTextFileSync(dataPath + "profile.json"));

  return profile.name;
}

httpRouter.get("/", (context) => {
  if (!context.isUpgradable) {
    context.response.body = "Supamind API is running!";
    return;
  }
  const socket = context.upgrade();
  const connSecret = context.request.url.searchParams.get("connsecret");

  neoRouter.addSocket(socket, connSecret);
});

neoRouter
  .onPost("setup", async (ctx) => {
    // check that data and name, openai are present

    if (!ctx.data) {
      ctx.error = "Data is required";
      return;
    }

    const data = ctx.data as { name: string; openai: string };
    if (!data.name || !data.openai) {
      ctx.error = "Name and OpenAI key are required";
      return;
    }

    const profile = await db.insertProfile({ name: data.name });
    await db.insertSecrets({ openai: data.openai });
    neoRouter.broadcast("profile", profile);
    ctx.response = profile;
  })
  .onGet("profile", async (ctx) => {
    const profile = await db.getProfile();
    ctx.response = profile;
  })
  .onPost("profile", async (ctx) => {
    const profile = ctx.data as Profile;
    await db.insertProfile(profile);
    neoRouter.broadcast(ctx.route, profile);
  })
  .onValidateBroadcast("profile", (conn, params) => {
    return true;
  })
  .onGet("agents", async (ctx) => {
    const agents = await db.getAgents();
    ctx.response = agents;
  })
  .onPost("agents", async (ctx) => {
    if (!ctx.data) {
      ctx.error = "Data is required";
      return;
    }

    const agentForm = JSON.parse(ctx.data as string);

    const newAgent: Agent = {
      id: uuidv4(),
      name: agentForm.name,
      button: agentForm.buttonText,
      description: agentForm.description,
      targetLLM: "openai/gpt-4-turbo",
      instructions: agentForm.instructions,
    };

    await db.insertAgent(newAgent);
    neoRouter.broadcast(ctx.route, newAgent);
  })
  .onGet("threads", async (ctx) => {
    const threads = await db.getThreads();
    ctx.response = threads;
  })
  .onPost("threads", async (ctx) => {
    const agentId = ctx.data as string;

    const thread = await db.createThread({
      id: uuidv4(),
      agentId,
      createdAt: Date.now(),
      updatedAt: null,
      title: "",
    });

    ctx.response = thread;

    neoRouter.broadcast(ctx.route, thread);
  })
  .onDelete("threads/:threadId", async (ctx) => {
    const threadId = ctx.params.threadId;
    await db.deleteThread(threadId);
    neoRouter.broadcastDeletion("threads", threadId);
  })
  .onGet("threads/:threadId", async (ctx) => {
    const threadId = ctx.params.threadId;
    const thread = await db.getThread(threadId);

    if (thread === null) {
      ctx.error = "Couldn't get thread";
      return;
    }

    const messages = await db.getThreadMessages(threadId);

    ctx.response = messages;
  })
  .onValidateBroadcast("threads", (conn, params) => {
    return true;
  })
  .onValidateBroadcast("threads/:threadId", (conn, params) => {
    return true;
  })
  .onPost("threads/:threadId", async (ctx) => {
    const threadId = ctx.params.threadId;
    const thread = await db.getThread(threadId);

    if (thread === null) {
      ctx.error = "Thread doesn't exist";
      return;
    }

    const message = ctx.data as ThreadMessage;

    if (await db.checkThreadMessage(threadId, message.id)) {
      ctx.error = "Message already exists";
      return;
    }

    const messages = await db.getThreadMessages(threadId);

    await db.createThreadMessage(threadId, message);
    neoRouter.broadcast(ctx.route, message);

    const dbThreadReply = await db.createThreadMessage(threadId, {
      id: uuidv4(),
      role: "assistant",
      text: "Thinking...",
      inProgress: 1,
      createdAt: Date.now(),
      updatedAt: null,
    });

    neoRouter.broadcast(ctx.route, dbThreadReply);

    const agent = await db.getAgent(thread.agentId) || defaultAgent;

    const systemPrompt = agent.instructions + "\n\n" +
      "Preferably use markdown for formatting. If you write code examples: use tick marks for inline code and triple tick marks for code blocks." +
      "\n\n" +
      "User name is " + getUserName();

    await aiChat.ask(
      message.text as string,
      messages,
      systemPrompt,
      getOpenaiKey(),
      (res) => {
        dbThreadReply.text = res.answer;
        neoRouter.broadcast(ctx.route, dbThreadReply);
        // And save the message to the database
        db.updateThreadMessage(threadId, dbThreadReply);
      },
    );

    dbThreadReply.inProgress = 0;
    dbThreadReply.updatedAt = Date.now();
    dbThreadReply.inProgress = 0;
    await db.updateThreadMessage(threadId, dbThreadReply);
    neoRouter.broadcast(ctx.route, dbThreadReply);

    messages.push(message);
    messages.push(dbThreadReply);

    if (!thread.title && messages.length >= 2) {
      const title = await aiChat.comeUpWithThreadTitle(
        messages,
        getOpenaiKey(),
      );
      thread.title = title;
      await db.updateThread(thread);
      neoRouter.broadcastUpdate("threads", thread);
    }
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

async function startServer(
  app: Application,
  startingPort: number,
  callback: (port: number) => void,
) {
  let port = startingPort;
  while (true) {
    try {
      console.log(`Started the server on port ${port}.`);
      callback(port);
      await app.listen({ port });
      break;
    } catch (error) {
      if (error instanceof Deno.errors.AddrInUse) {
        console.log(
          `Port ${port} is already in use. Trying port ${port + 1}...`,
        );
        port++; // Try the next port
      } else {
        console.log(`Failed to start server: ${error}`);
        break; // Exit the loop if there's a different error
      }
    }
  }
}

startServer(app, 6969, (port) => {
  // We send the port as a JSON message so the parent process can identify it.
  console.log(JSON.stringify({ type: "port", value: port } as ProcessPortMsg));
});
