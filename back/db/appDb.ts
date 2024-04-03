import { Chat, ChatMessage, Profile, Secrets } from "@shared/models.ts";
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

  createChat(chat: Chat): Chat {
    ensureDir(this.resolvePath(`chats/${chat.id}`));

    // Create a file with id of the chat and a folder with the same id for messages
    Deno.writeTextFileSync(
      this.resolvePath(`chats/${chat.id}/_chat.json`),
      JSON.stringify(chat),
    );
    ensureDir(this.resolvePath("chats", chat.id));

    return chat;
  }

  deleteChat(chatId: string): void {
    try {
      Deno.removeSync(this.resolvePath("chats", chatId), {
        recursive: true,
      });
    } catch (error) {
      console.error("Couldn't remove the chat", error);
    }
  }

  getChat(chatId: string): Chat | null {
    ensureDir(this.resolvePath(`chats/${chatId}`));

    try {
      const chatStr = Deno.readTextFileSync(
        this.resolvePath(`chats/${chatId}/_chat.json`),
      );

      if (chatStr) {
        return JSON.parse(chatStr);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  updateChat(chat: Chat): void {
    ensureDir(this.resolvePath(`chats/${chat.id}`));

    Deno.writeTextFileSync(
      this.resolvePath(`chats/${chat.id}/_chat.json`),
      JSON.stringify(chat),
    );
  }

  getChats(): Chat[] {
    ensureDir(this.resolvePath("chats"));

    const chatFiles = this.getChatFiles(this.resolvePath("chats"));
    const chats: Chat[] = [];

    for (const chatFile of chatFiles) {
      const chatStr = Deno.readTextFileSync(chatFile);
      chats.push(JSON.parse(chatStr));
    }

    return chats;
  }

  private getChatFiles(folderPath: string): string[] {
    const chatFiles: string[] = [];
    const entries = Deno.readDirSync(folderPath);

    for (const entry of entries) {
      const entryPath = folderPath + '/' + entry.name;

      if (entry.isFile && entry.name === "_chat.json") {
        chatFiles.push(entryPath);
      } else if (entry.isDirectory) {
        const subChatFiles = this.getChatFiles(entryPath);
        chatFiles.push(...subChatFiles);
      }
    }

    return chatFiles;
  }

  createChatMessage(chatId: string, message: ChatMessage): ChatMessage {
    ensureDir(this.resolvePath("chats", chatId));

    // Create a file with the id of the message
    Deno.writeTextFileSync(
      this.resolvePath("chats", chatId, `${message.id}.json`),
      JSON.stringify(message),
    );

    return message;
  }

  checkChatMessage(chatId: string, messageId: string): boolean {
    try {
      Deno.readTextFileSync(
        this.resolvePath("chats", chatId, `${messageId}.json`),
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  updateChatMessage(chatId: string, message: ChatMessage): void {
    Deno.writeTextFileSync(
      this.resolvePath("chats", chatId, `${message.id}.json`),
      JSON.stringify(message),
    );
  }

  getChatMessages(
    chatId: string,
  ): ChatMessage[] {
    // Get all messages in the folder with the chat id
    const messageFiles = Deno.readDirSync(
      this.resolvePath("chats", chatId),
    );

    const messages: ChatMessage[] = [];

    for (const messageFile of messageFiles) {
      if (messageFile.isFile && messageFile.name.endsWith(".json")) {
        if (messageFile.name === "_chat.json") {
          continue;
        }

        const messageStr = Deno.readTextFileSync(
          this.resolvePath("chats", chatId, messageFile.name),
        );
        messages.push(JSON.parse(messageStr));
      }
    }

    messages.sort((a, b) => a.createdAt - b.createdAt);

    return messages;
  }
}
