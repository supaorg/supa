import { get, type Writable } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import type { ThreadMessage } from "@shared/models";
import { client } from "$lib/tools/client";
import { apiRoutes } from "@shared/apiRoutes";

export interface ThreadMessagesDictionary {
  [key: string]: ThreadMessage[];
}

export const threadsMessagesStore: Writable<ThreadMessagesDictionary> =
  localStorageStore<ThreadMessagesDictionary>("threadMessages", {});

export async function listenToMessages(threadId: string) {
  client.on(apiRoutes.threadMessages(threadId), (broadcast) => {
    if (broadcast.action === "POST" || broadcast.action === "UPDATE") {
      onPostOrUpdateChatMsg(threadId, broadcast.data as ThreadMessage);
    }
    if (broadcast.action === "DELETE") {
      onDeleteChatMsg(threadId, broadcast.data as ThreadMessage);
    }
  });
}

export async function unlistenMessages(threadId: string) {
  client.off(apiRoutes.threadMessages(threadId));
}

export async function postNewMessage(threadId: string, msg: ThreadMessage) {
  client.post(apiRoutes.threadMessages(threadId), msg);
  onPostOrUpdateChatMsg(threadId, msg);
}

export async function stopThread(threadId: string) {
  client.post(apiRoutes.stopThread(threadId));
}

function onDeleteChatMsg(threadId: string, message: ThreadMessage) {
  threadsMessagesStore.update((messages) => {
    const newMessages = { ...messages };
    if (newMessages[threadId]) {
      newMessages[threadId] = newMessages[threadId].filter((m) =>
        m.id !== message.id
      );
    }
    return newMessages;
  });
}

function onPostOrUpdateChatMsg(threadId: string, message: ThreadMessage) {
  threadsMessagesStore.update((dic) => {
    const threadMessages = dic[threadId];
    if (threadMessages) {
      const updMessages = [...threadMessages];
      let hasUpdatedMessage = false;

      // Iterate messages from the end to the beginning
      for (let i = threadMessages.length - 1; i >= 0; i--) {
        if (threadMessages[i].id === message.id) {
          updMessages[i] = message;
          hasUpdatedMessage = true;
          break;
        }
      }

      if (!hasUpdatedMessage) {
        updMessages.push(message);
      }

      dic[threadId] = updMessages;
    } else {
      dic[threadId] = [message];
    }
    return dic;
  });
}

export async function fetchThreadMessages(threadId: string): Promise<void> {
  const messages = await client
    .get(apiRoutes.threadMessages(threadId))
    .then((res) => {
      if (res.error) {
        console.error(res.error);
        //goto("/");
        return [];
      }

      const messages = res.data as ThreadMessage[];
      return messages;
    });

  threadsMessagesStore.update((dic) => {
    dic[threadId] = messages;
    return dic;
  });
}

export const THREAD_STATUS = {
  DISABLED: "disabled",
  CAN_SEND_MESSAGE: "can-send-message",
  SENDING: "sending",
  AI_MESSAGE_IN_PROGRESS: "ai-message-in-progress",
  ERROR: "error",
} as const;

export type ThreadStatus = typeof THREAD_STATUS[keyof typeof THREAD_STATUS];

export function getThreadStatus(
  threadId: string,
): ThreadStatus {
  const messages = get(threadsMessagesStore)[threadId];

  if (!messages) {
    // @TODO: consider to allow sending messages if there are no messages array
    return THREAD_STATUS.DISABLED;
  }

  if (messages.length === 0) {
    return THREAD_STATUS.CAN_SEND_MESSAGE;
  }

  const lastMessage = messages[messages.length - 1];

  if (lastMessage.role === "user") {
    return THREAD_STATUS.SENDING;
  }

  if (lastMessage.inProgress) {
    return THREAD_STATUS.AI_MESSAGE_IN_PROGRESS;
  }

  if (lastMessage.role === "error") {
    return THREAD_STATUS.ERROR;
  }

  return THREAD_STATUS.CAN_SEND_MESSAGE;
}

export function checkIfCanSendMessage(threadId: string): boolean {
  const status = getThreadStatus(threadId);

  return status === "can-send-message";
}
