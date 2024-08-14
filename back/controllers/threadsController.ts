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
import { WorkspaceDb } from "../db/workspaceDb.ts";

export function threadsController(services: BackServices) {
  const router = services.router;

  const messageAgents: { [messageId: string]: SimpleChatAgent } = {};

  router
    .onGet(
      apiRoutes.threads(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          try {
            const threads = await db.getThreads();
            ctx.response = threads;
          } catch (e) {
            ctx.error = e.message;
            return;
          }
        }),
    )
    .onPost(
      apiRoutes.threads(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const appId = ctx.data as string;

          try {
            const thread = await db.createThread({
              id: uuidv4(),
              appId,
              createdAt: Date.now(),
              updatedAt: null,
              title: "",
            });

            ctx.response = thread;

            router.broadcastPost(ctx.route, thread);
          } catch (e) {
            ctx.error = e;
          }
        }),
    )
    .onDelete(
      apiRoutes.thread(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const threadId = ctx.params.threadId;
          try {
            await db.deleteThread(threadId);
            router.broadcastDeletion(apiRoutes.threads(), threadId);
          } catch (e) {
            ctx.error = e;
          }
        }),
    )
    .onGet(
      apiRoutes.threadMessages(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const threadId = ctx.params.threadId;

          try {
            const thread = await db.getThread(threadId);

            if (thread === null) {
              ctx.error = "Couldn't get thread";
              return;
            }
          } catch (e) {
            ctx.error = e;
            return;
          }

          try {
            const messages = await db.getThreadMessages(threadId);
            ctx.response = messages;
          } catch (e) {
            ctx.error = e;
          }
        }),
    )
    .onValidateBroadcast(apiRoutes.threads(), (conn, params) => {
      return true;
    })
    .onValidateBroadcast(apiRoutes.thread(), (conn, params) => {
      return true;
    })
    .onValidateBroadcast(apiRoutes.threadMessages(), (conn, params) => {
      return true;
    })
    .onPost(
      apiRoutes.retryThread(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const threadId = ctx.params.threadId;
          let thread: Thread | null;

          try {
            thread = await db.getThread(threadId);
          } catch (e) {
            ctx.error = e;
            return;
          }

          if (thread === null) {
            ctx.error = "Thread doesn't exist";
            return;
          }

          try {
            const messages = await db.getThreadMessages(threadId);

            // Only re-try if the last message is from the AI, an error or a lonely user message
            const replyMessage = messages[messages.length - 1];

            if (replyMessage.role !== "user") {
              // Delete the last message by the AI or an error
              await db.deleteThreadMessage(threadId, replyMessage.id);
              router.broadcastDeletion(
                apiRoutes.threadMessages(threadId),
                replyMessage,
              );
            }

            await sendReplyToThread(db, thread);
          } catch (e) {
            ctx.error = e;
            return;
          }
        }),
    )
    .onPost(
      apiRoutes.stopThread(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const threadId = ctx.params.threadId;

          let thread: Thread | null;
          try {
            thread = await db.getThread(threadId);
          } catch (e) {
            ctx.error = e;
            return;
          }

          if (thread === null) {
            ctx.error = "Thread doesn't exist";
            return;
          }

          try {
            const messages = await db.getThreadMessages(threadId);

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
        }),
    )
    .onPost(
      apiRoutes.thread(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const threadId = ctx.params.threadId;

          try {
            const thread = await db.getThread(threadId);

            if (thread === null) {
              ctx.error = "Thread doesn't exist";
              return;
            }

            const updThread = { ...thread, ...ctx.data as Thread };

            await db.updateThread(updThread);

            router.broadcastUpdate(ctx.route, updThread);
          } catch (e) {
            ctx.error = e;
          }
        }),
    )
    .onPost(
      apiRoutes.threadMessages(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const threadId = ctx.params.threadId;

          try {
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

            // First create a message sent by the user
            await db.createThreadMessage(threadId, message);
            router.broadcastPost(ctx.route, message);

            await sendReplyToThread(db, thread);
          } catch (e) {
            ctx.error = e;
          }
        }),
    );

  async function sendReplyToThread(db: WorkspaceDb, thread: Thread) {
    const threadId = thread.id;
    const agentServices = new AgentServices(db);
    let messages: ThreadMessage[];
    let replyMessage: ThreadMessage;
    let chatAgent: SimpleChatAgent;
    let config: AppConfig;

    try {
      // Get all the messages in the thread (new message included)
      messages = await db.getThreadMessages(threadId);

      // Create an in-progress message for the agent
      replyMessage = await db.createThreadMessage(threadId, {
        id: uuidv4(),
        role: "assistant",
        text: "Thinking...",
        inProgress: 1,
        createdAt: Date.now(),
        updatedAt: null,
      });

      router.broadcastPost(apiRoutes.threadMessages(threadId), replyMessage);

      config = await db.getAgent(thread.appId) || defaultAgent;

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
        db.updateThreadMessage(threadId, replyMessage);
      });

      replyMessage.text = response as string;
    } catch (e) {
      replyMessage.text = e.message;
      replyMessage.role = "error";
    }

    replyMessage.inProgress = 0;
    replyMessage.updatedAt = Date.now();
    replyMessage.inProgress = 0;
    await db.updateThreadMessage(threadId, replyMessage);
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
          await db.updateThread(thread);
          router.broadcastUpdate(apiRoutes.threads(), thread);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
}