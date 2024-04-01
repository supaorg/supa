import { ChatMessage, ChatThread, Profile, Secrets } from "@shared/models.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";

export class AppDb {
  constructor(private dataPath: string) {}

  private resolvePath(...paths: string[]): string {
    return join(this.dataPath, ...paths);
  }

  getProfile(): Profile | null {
    try {
      const profileStr = Deno.readTextFileSync(
        this.resolvePath("profile.json"),
      );

      if (profileStr) {
        return JSON.parse(profileStr);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  insertProfile(profile: Profile): Profile {
    Deno.writeTextFileSync(
      this.resolvePath("profile.json"),
      JSON.stringify(profile),
    );

    return profile;
  }

  insertSecrets(secrets: Secrets): Secrets {
    Deno.writeTextFileSync(
      this.resolvePath("secrets.json"),
      JSON.stringify(secrets),
    );

    return secrets;
  }

  createChatThread(chatThread: ChatThread): ChatThread {
    ensureDir(this.resolvePath("chats"));

    // Create a file with id of the thread and a folder with the same id for messages
    Deno.writeTextFileSync(
      this.resolvePath("chats", `${chatThread.id}.json`),
      JSON.stringify(chatThread),
    );
    ensureDir(this.resolvePath("chats", chatThread.id));

    return chatThread;
  }

  deleteChatThread(chatThreadId: string): void {
    ensureDir(this.resolvePath("chats"));

    Deno.removeSync(this.resolvePath("chats", `${chatThreadId}.json`), {
      recursive: true,
    });
    Deno.removeSync(this.resolvePath("chats", chatThreadId), {
      recursive: true,
    });
  }

  getChatThreadById(chatThreadId: string): ChatThread | null {
    ensureDir(this.resolvePath("chats"));

    try {
      const threadStr = Deno.readTextFileSync(
        this.resolvePath("chats", `${chatThreadId}.json`),
      );

      if (threadStr) {
        return JSON.parse(threadStr);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  updateChatThread(thread: ChatThread): void {
    Deno.writeTextFileSync(
      this.resolvePath("chats", `${thread.id}.json`),
      JSON.stringify(thread),
    );
  }

  getChatThreads(): ChatThread[] {
    ensureDir(this.resolvePath("chats"));

    const threadFiles = Deno.readDirSync(this.resolvePath("chats"));

    const threads: ChatThread[] = [];

    for (const threadFile of threadFiles) {
      if (threadFile.isFile && threadFile.name.endsWith(".json")) {
        const threadStr = Deno.readTextFileSync(
          this.resolvePath("chats", threadFile.name),
        );
        threads.push(JSON.parse(threadStr));
      }
    }

    return threads;
  }

  createChatMessage(message: ChatMessage): ChatMessage {
    ensureDir(this.resolvePath("chats", message.chatThreadId));

    // Create a file with the id of the message
    Deno.writeTextFileSync(
      this.resolvePath("chats", message.chatThreadId, `${message.id}.json`),
      JSON.stringify(message),
    );

    return message;
  }

  checkChatMessage(threadId: string, messageId: string): boolean {
    try {
      Deno.readTextFileSync(
        this.resolvePath("chats", threadId, `${messageId}.json`),
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  updateChatMessage(message: ChatMessage): void {
    Deno.writeTextFileSync(
      this.resolvePath("chats", message.chatThreadId, `${message.id}.json`),
      JSON.stringify(message),
    );
  }

  getChatMessagesByThreadId(
    chatThreadId: string,
  ): ChatMessage[] {
    // Get all messages in the folder with the thread id
    const messageFiles = Deno.readDirSync(
      this.resolvePath("chats", chatThreadId),
    );

    const messages: ChatMessage[] = [];

    for (const messageFile of messageFiles) {
      if (messageFile.isFile && messageFile.name.endsWith(".json")) {
        const messageStr = Deno.readTextFileSync(
          this.resolvePath("chats", chatThreadId, messageFile.name),
        );
        messages.push(JSON.parse(messageStr));
      }
    }

    messages.sort((a, b) => a.createdAt - b.createdAt);

    return messages;
  }
}
