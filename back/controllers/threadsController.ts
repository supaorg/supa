import { BackServices } from "./backServices.ts";
import { v4 as uuidv4 } from "npm:uuid";
import { ThreadMessage } from "@shared/models.ts";
import { defaultAgent } from "../agents/defaultAgent.ts";
import { SimpleChatAgent } from "../agents/simpleChatAgent.ts";
import { AgentServices } from "../agents/agentServices.ts";
import { apiRoutes } from "@shared/apiRoutes.ts";
import { Thread } from "../../shared/models.ts";
import { AppConfig } from "../../shared/models.ts";
import { ThreadTitleAgent } from "../agents/threadTitleAgent.ts";

export function threadsController(services: BackServices) {
  const router = services.router;

  const messageAgents: { [messageId: string]: SimpleChatAgent } = {};

  router
    .onGet(apiRoutes.threads(), async (ctx) => {
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
    .onPost(apiRoutes.threads(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const agentId = ctx.data as string;

      try {
        const thread = await services.db.createThread({
          id: uuidv4(),
          agentId,
          createdAt: Date.now(),
          updatedAt: null,
          title: "",
        });

        ctx.response = thread;

        router.broadcastPost(ctx.route, thread);
      } catch (e) {
        ctx.error = e;
      }
    })
    .onDelete(apiRoutes.thread(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;
      try {
        await services.db.deleteThread(threadId);
        router.broadcastDeletion(apiRoutes.threads(), threadId);
      } catch (e) {
        ctx.error = e;
      }
    })
    .onGet(apiRoutes.threadMessages(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;

      try {
        const thread = await services.db.getThread(threadId);

        if (thread === null) {
          ctx.error = "Couldn't get thread";
          return;
        }
      } catch (e) {
        ctx.error = e;
        return;
      }

      try {
        const messages = await services.db.getThreadMessages(threadId);
        ctx.response = messages;
      } catch (e) {
        ctx.error = e;
      }
    })
    .onValidateBroadcast(apiRoutes.threads(), (conn, params) => {
      return true;
    })
    .onValidateBroadcast(apiRoutes.thread(), (conn, params) => {
      return true;
    })
    .onValidateBroadcast(apiRoutes.threadMessages(), (conn, params) => {
      return true;
    })
    .onPost(apiRoutes.retryThread(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;

      let thread: Thread | null;
      try {
        thread = await services.db.getThread(threadId);
      } catch (e) {
        ctx.error = e;
        return;
      }

      if (thread === null) {
        ctx.error = "Thread doesn't exist";
        return;
      }

      try {
        const messages = await services.db.getThreadMessages(threadId);

        // Only re-try if the last message is from the AI, an error or a lonely user message
        const replyMessage = messages[messages.length - 1];

        if (replyMessage.role !== "user") {
          // Delete the last message by the AI or an error
          await services.db.deleteThreadMessage(threadId, replyMessage.id);
          router.broadcastDeletion(
            apiRoutes.threadMessages(threadId),
            replyMessage,
          );
        }

        await sendReplyToThread(thread);
      } catch (e) {
        ctx.error = e;
        return;
      }
    })
    .onPost(apiRoutes.stopThread(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;

      let thread: Thread | null;
      try {
        thread = await services.db.getThread(threadId);
      } catch (e) {
        ctx.error = e;
        return;
      }

      if (thread === null) {
        ctx.error = "Thread doesn't exist";
        return;
      }

      try {
        const messages = await services.db.getThreadMessages(threadId);

        // Only stop if the last message is from the AI
        const replyMessage = messages[messages.length - 1];

        if (replyMessage.role !== "assistant") {
          ctx.error = "Can't stop the message";
          return;
        }

        const agent = messageAgents[replyMessage.id];
        if (!agent) {
          ctx.error = "Agent not found";
          return;
        }

        agent.stop();
      } catch (e) {
        ctx.error = e;
        return;
      }
    })
    .onPost(apiRoutes.thread(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;

      try {
        const thread = await services.db.getThread(threadId);

        if (thread === null) {
          ctx.error = "Thread doesn't exist";
          return;
        }

        const updThread = { ...thread, ...ctx.data as Thread };

        await services.db.updateThread(updThread);

        router.broadcastUpdate(ctx.route, updThread);
      } catch (e) {
        ctx.error = e;
      }
    })
    .onPost(apiRoutes.threadMessages(), async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const threadId = ctx.params.threadId;

      try {
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
        router.broadcastPost(ctx.route, message);

        await sendReplyToThread(thread);
      } catch (e) {
        ctx.error = e;
      }
    });

  async function sendReplyToThread(thread: Thread) {
    if (services.db === null) {
      throw new Error("No database");
    }

    const threadId = thread.id;

    const agentServices = new AgentServices(services.db);
    let messages: ThreadMessage[];
    let replyMessage: ThreadMessage;
    let chatAgent: SimpleChatAgent;
    let config: AppConfig;

    try {
      // Get all the messages in the thread (new message included)
      messages = await services.db.getThreadMessages(threadId);

      // Create an in-progress message for the agent
      replyMessage = await services.db.createThreadMessage(threadId, {
        id: uuidv4(),
        role: "assistant",
        text: "Thinking...",
        inProgress: 1,
        createdAt: Date.now(),
        updatedAt: null,
      });

      router.broadcastPost(apiRoutes.threadMessages(threadId), replyMessage);

      config = await services.db.getAgent(thread.appId) || defaultAgent;

      // Let's run the messages through the agent
      chatAgent = new SimpleChatAgent(agentServices, config);

      messageAgents[replyMessage.id] = chatAgent;
    } catch (e) {
      console.error(e);
      return;
    }

    try {
      const response = await chatAgent.input(messages, (resp) => {
        replyMessage.text = resp as string;
        router.broadcastPost(apiRoutes.threadMessages(threadId), replyMessage);
        // And save the message to the database
        if (services.db !== null) {
          services.db.updateThreadMessage(threadId, replyMessage);
        }
      });

      replyMessage.text = response as string;
    } catch (e) {
      replyMessage.text = e.message;
      replyMessage.role = "error";
    }

    replyMessage.inProgress = 0;
    replyMessage.updatedAt = Date.now();
    replyMessage.inProgress = 0;
    await services.db.updateThreadMessage(threadId, replyMessage);
    router.broadcastPost(apiRoutes.threadMessages(threadId), replyMessage);

    if (messages.length >= 1) {
      const titleAgent = new ThreadTitleAgent(agentServices, config);
      try {
        const title = await titleAgent.input({
          messages: messages,
          title: thread.title,
        }) as string;
        if (title) {
          thread.title = title;
          await services.db.updateThread(thread);
          router.broadcastUpdate(apiRoutes.threads(), thread);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
}
