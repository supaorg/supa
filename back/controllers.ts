import { Router } from "../shared/restOnSockets/Router.ts";
import { Chat } from "./chat.ts";
import { v4 as uuidv4 } from "npm:uuid";
import { AppDb } from "./db/appDb.ts";
import { ThreadMessage } from "@shared/models.ts";
import { Agent, Profile } from "../shared/models.ts";
import { defaultAgent } from "./agents/defaultAgent.ts";
import { createWorkspaceInDocuments } from "./workspace.ts";
import { fs } from "./tools/fs.ts";

export function controllers(router: Router) {
  const aiChat = new Chat();

  let db: AppDb | null = null;

  const DB_ERROR = "Database is not initialized";

  router
    .onPost("new-workspace", async (ctx) => { 
      try {
        const path = await createWorkspaceInDocuments();
        db = new AppDb(path);
        ctx.response = path;
      } catch (e) {
        ctx.error = e.message;
      }
    })
    .onPost("workspace", async (ctx) => {
      db = new AppDb(ctx.data as string);

      // Check if the workspace folder exists
      try {
        const exists = await fs.dirExists(ctx.data as string);
        if (!exists) {
          ctx.error = "Workspace folder doesn't exist";
          return;
        }
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost("workspace-exists", async (ctx) => {
      try {
        const path = ctx.data as string;
        const exists = await fs.dirExists(path);

        ctx.response = exists;
      }
      catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost("setup", async (ctx) => {
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

      if (!ctx.data) {
        ctx.error = "Data is required";
        return;
      }

      const data = ctx.data as { name: string; openai: string };
      if (!data.name || !data.openai) {
        ctx.error = "Name and OpenAI key are required";
        return;
      }

      try {
        const profile = await db.insertProfile({ name: data.name });
        await db.insertSecrets({ openai: data.openai });
        router.broadcast("profile", profile);
        ctx.response = profile;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
      
    })
    .onGet("profile", async (ctx) => {
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

      try {
        const profile = await db.getProfile();
        ctx.response = profile;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost("profile", async (ctx) => {
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

      const profile = ctx.data as Profile;
      await db.insertProfile(profile);
      router.broadcast(ctx.route, profile);
    })
    .onValidateBroadcast("profile", (conn, params) => {
      return true;
    })
    .onGet("agents", async (ctx) => {
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

      try {
        const agents = await db.getAgents();
        ctx.response = agents;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost("agents", async (ctx) => {
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

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
      router.broadcast(ctx.route, newAgent);
    })
    .onGet("threads", async (ctx) => {
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

      try {
        const threads = await db.getThreads();
        ctx.response = threads;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
      
    })
    .onPost("threads", async (ctx) => {
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

      const agentId = ctx.data as string;

      const thread = await db.createThread({
        id: uuidv4(),
        agentId,
        createdAt: Date.now(),
        updatedAt: null,
        title: "",
      });

      ctx.response = thread;

      router.broadcast(ctx.route, thread);
    })
    .onDelete("threads/:threadId", async (ctx) => {
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

      const threadId = ctx.params.threadId;
      await db.deleteThread(threadId);
      router.broadcastDeletion("threads", threadId);
    })
    .onGet("threads/:threadId", async (ctx) => {
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

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
      if (db === null) {
        ctx.error = DB_ERROR;
        return;
      }

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
      router.broadcast(ctx.route, message);

      const dbThreadReply = await db.createThreadMessage(threadId, {
        id: uuidv4(),
        role: "assistant",
        text: "Thinking...",
        inProgress: 1,
        createdAt: Date.now(),
        updatedAt: null,
      });

      router.broadcast(ctx.route, dbThreadReply);

      const agent = await db.getAgent(thread.agentId) || defaultAgent;

      const profile = await db.getProfile();
      const userName = profile?.name || "User";

      const systemPrompt = agent.instructions + "\n\n" +
        "Preferably use markdown for formatting. If you write code examples: use tick marks for inline code and triple tick marks for code blocks." +
        "\n\n" +
        "User name is " + userName;

      await aiChat.ask(
        message.text as string,
        messages,
        systemPrompt,
        db.getOpenaiKey(),
        (res) => {
          dbThreadReply.text = res.answer;
          router.broadcast(ctx.route, dbThreadReply);
          // And save the message to the database
          if (db !== null) {
            db.updateThreadMessage(threadId, dbThreadReply);
          }
        },
      );

      dbThreadReply.inProgress = 0;
      dbThreadReply.updatedAt = Date.now();
      dbThreadReply.inProgress = 0;
      await db.updateThreadMessage(threadId, dbThreadReply);
      router.broadcast(ctx.route, dbThreadReply);

      messages.push(message);
      messages.push(dbThreadReply);

      if (!thread.title && messages.length >= 2) {
        const title = await aiChat.comeUpWithThreadTitle(
          messages,
          db.getOpenaiKey(),
        );
        thread.title = title;
        await db.updateThread(thread);
        router.broadcastUpdate("threads", thread);
      }
    });
}
