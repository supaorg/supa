import { BackServices } from "./backServices.ts";
import { v4 as uuidv4 } from "npm:uuid";
import { ThreadMessage } from "@shared/models.ts";
import { defaultAgent } from "../agents/defaultAgent.ts";
import { SimpleChatAgent } from "../agents/simpleChatAgent.ts";
import { ThreadTitleAgent } from "../agents/ThreadTitleAgent.ts";
import { AgentServices } from "../agents/agentServices.ts";
import { routes } from "../../shared/routes/routes.ts";

export function threadsController(services: BackServices) {
  const router = services.router;

  router
    .onGet(routes.threads, async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      try {
        const threads = await services.db.getThreads();
        ctx.response = threads;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost(routes.threads, async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const agentId = ctx.data as string;

      const thread = await services.db.createThread({
        id: uuidv4(),
        agentId,
        createdAt: Date.now(),
        updatedAt: null,
        title: "",
      });

      ctx.response = thread;

      router.broadcast(ctx.route, thread);
    })
    .onDelete(routes.thread(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;
      await services.db.deleteThread(threadId);
      router.broadcastDeletion(routes.threads, threadId);
    })
    .onGet(routes.thread(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;
      const thread = await services.db.getThread(threadId);

      if (thread === null) {
        ctx.error = "Couldn't get thread";
        return;
      }

      const messages = await services.db.getThreadMessages(threadId);

      ctx.response = messages;
    })
    .onValidateBroadcast(routes.threads, (conn, params) => {
      return true;
    })
    .onValidateBroadcast(routes.thread(), (conn, params) => {
      return true;
    })
    .onPost(routes.retryThread(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;
      const thread = await services.db.getThread(threadId);

      if (thread === null) {
        ctx.error = "Thread doesn't exist";
        return;
      }

      let messages = await services.db.getThreadMessages(threadId);

      // Only re-try if the last message is from the AI
      const dbThreadReply = messages[messages.length - 1];
      if (dbThreadReply.role !== "assistant") {
        ctx.error = "Last message is not from the AI";
        return;
      }

      const route = routes.thread(threadId);

      messages = await services.db.getThreadMessages(threadId);

      // Update the last message
      dbThreadReply.text = "Thinking...";
      dbThreadReply.createdAt = Date.now();
      dbThreadReply.updatedAt = Date.now();
      router.broadcast(route, dbThreadReply);

      // @TODO: get the actual config that we can pass to the agent
      const config = await services.db.getAgent(thread.agentId) || defaultAgent;

      const agentServices = new AgentServices(services.db);

      // Let's run the messages through the agent
      const chatAgent = new SimpleChatAgent(agentServices, config);
      const response = await chatAgent.input(messages, (resp) => {
        dbThreadReply.text = resp as string;
        router.broadcast(route, dbThreadReply);
        // And save the message to the database
        if (services.db !== null) {
          services.db.updateThreadMessage(threadId, dbThreadReply);
        }
      });

      dbThreadReply.text = response as string;
      dbThreadReply.inProgress = 0;
      dbThreadReply.updatedAt = Date.now();
      dbThreadReply.inProgress = 0;
      await services.db.updateThreadMessage(threadId, dbThreadReply);
      router.broadcast(ctx.route, dbThreadReply);

      if (!thread.title && messages.length >= 2) {
        const titleAgent = new ThreadTitleAgent(agentServices, config);
        const title = await titleAgent.input(messages) as string;
        if (title && title !== "NO TITLE") {
          thread.title = title;
          await services.db.updateThread(thread);
          router.broadcastUpdate(routes.threads, thread);
        }
      }

    })
    .onPost(routes.thread(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;
      const thread = await services.db.getThread(threadId);

      if (thread === null) {
        ctx.error = "Thread doesn't exist";
        return;
      }

      const message = ctx.data as ThreadMessage;

      if (await services.db.checkThreadMessage(threadId, message.id)) {
        ctx.error = "Message already exists";
        return;
      }

      // First create a message sent by the user
      await services.db.createThreadMessage(threadId, message);
      router.broadcast(ctx.route, message);

      // Get all the messages in the thread (new message included)
      const messages = await services.db.getThreadMessages(threadId);

      // Create an in-progress message for the agent
      const dbThreadReply = await services.db.createThreadMessage(threadId, {
        id: uuidv4(),
        role: "assistant",
        text: "Thinking...",
        inProgress: 1,
        createdAt: Date.now(),
        updatedAt: null,
      });
      router.broadcast(ctx.route, dbThreadReply);

      // @TODO: get the actual config that we can pass to the agent
      const config = await services.db.getAgent(thread.agentId) || defaultAgent;

      const agentServices = new AgentServices(services.db);

      // Let's run the messages through the agent
      const chatAgent = new SimpleChatAgent(agentServices, config);

      try {
        const response = await chatAgent.input(messages, (resp) => {
          dbThreadReply.text = resp as string;
          router.broadcast(ctx.route, dbThreadReply);
          // And save the message to the database
          if (services.db !== null) {
            services.db.updateThreadMessage(threadId, dbThreadReply);
          }
        });

        dbThreadReply.text = response as string;
      } catch (e) {
        dbThreadReply.text = e.message;
        // @TODO: mark the message as failed
      }
      
      dbThreadReply.inProgress = 0;
      dbThreadReply.updatedAt = Date.now();
      dbThreadReply.inProgress = 0;
      await services.db.updateThreadMessage(threadId, dbThreadReply);
      router.broadcast(ctx.route, dbThreadReply);

      if (!thread.title && messages.length >= 2) {
        const titleAgent = new ThreadTitleAgent(agentServices, config);
        try {
          const title = await titleAgent.input(messages) as string;
          if (title) {
            thread.title = title;
            await services.db.updateThread(thread);
            router.broadcastUpdate(routes.threads, thread);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
}
