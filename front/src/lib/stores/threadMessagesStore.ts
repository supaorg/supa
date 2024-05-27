import type { Writable } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import type { Thread, ThreadMessage } from "@shared/models";
import { client } from "$lib/tools/client";
import { routes } from "@shared/routes/routes";
import type { Message } from "postcss";

export interface ThreadMessagesDictionary {
  [key: string]: ThreadMessage[];
}

export const threadsMessagesStore: Writable<ThreadMessagesDictionary> =
  localStorageStore<ThreadMessagesDictionary>("threadMessages", {});

export async function listenToMessages(threadId: string) {
  client.listen(routes.threadMessages(threadId), (broadcast) => {
    if (broadcast.action === "POST" || broadcast.action === "UPDATE") {
      onPostOrUpdateChatMsg(threadId, broadcast.data as ThreadMessage);
    }
    if (broadcast.action === "DELETE") {
      onDeleteChatMsg(threadId, broadcast.data as ThreadMessage);
    }
  });
}

export async function unlistenMessages(threadId: string) {
  client.unlisten(routes.threadMessages(threadId));
}

export async function postNewMessage(threadId: string, msg: ThreadMessage) {
  client.post(routes.threadMessages(threadId), msg);
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
  threadsMessagesStore.update((messages) => {
    const newMessages = { ...messages };
    if (newMessages[threadId]) {
      const newMsgs = newMessages[threadId].map((m) => {
        if (m.id === message.id) {
          return message;
        }
        return m;
      });
      newMessages[threadId] = newMsgs;
    } else {
      newMessages[threadId] = [message];
    }
    return newMessages;
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
