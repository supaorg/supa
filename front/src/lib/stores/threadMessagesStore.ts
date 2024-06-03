import { get, type Writable } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import type { ThreadMessage } from "@shared/models";
import { client } from "$lib/tools/client";
import { routes } from "@shared/routes/routes";

export interface ThreadMessagesDictionary {
  [key: string]: ThreadMessage[];
}

export const threadsMessagesStore: Writable<ThreadMessagesDictionary> =
  localStorageStore<ThreadMessagesDictionary>("threadMessages", {});

export async function listenToMessages(threadId: string) {
  client.on(routes.threadMessages(threadId), (broadcast) => {
    if (broadcast.action === "POST" || broadcast.action === "UPDATE") {
      onPostOrUpdateChatMsg(threadId, broadcast.data as ThreadMessage);
    }
    if (broadcast.action === "DELETE") {
      onDeleteChatMsg(threadId, broadcast.data as ThreadMessage);
    }
  });
}

export async function unlistenMessages(threadId: string) {
  client.off(routes.threadMessages(threadId));
}

export async function postNewMessage(threadId: string, msg: ThreadMessage) {
  client.post(routes.threadMessages(threadId), msg);
  onPostOrUpdateChatMsg(threadId, msg);
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
    .get(routes.threadMessages(threadId))
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

export function checkIfCanSendMessage(threadId: string): boolean {
  const messages = get(threadsMessagesStore)[threadId];

  if (!messages) {
    return false;
  }

  if (messages?.length === 0) {
    return true;
  }

  const lastMessage = messages[messages.length - 1];

  const lastMessageIsByUser = lastMessage.role === "user";
  if (lastMessageIsByUser) {
    // Last message is by user, wait for the new request
    return false;
  }

  const lastMessageIsInProgress = lastMessage.inProgress;
  if (lastMessageIsInProgress) {
    // Last message is in progress, wait for it to finish
    return false;
  }

  const lastMessageIsError = lastMessage.role === "error";
  if (lastMessageIsError) {
    // Last message is an error, wait for it to be resolved
    return false;
  }

  return true;
}
