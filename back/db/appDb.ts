import { Chat, ChatMessage, Profile, Secrets } from "@shared/models.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { Agent } from "../../shared/models.ts";
import { defaultAgent } from "../agents/defaultAgent.ts";

export class AppDb {
  constructor(private dataPath: string) {}

  private resolvePath(...paths: string[]): string {
    return join(this.dataPath, ...paths);
  }

  async getProfile(): Promise<Profile | null> {
    try {
      const profileStr = await Deno.readTextFile(
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

  async insertProfile(profile: Profile): Promise<Profile> {
    await Deno.writeTextFile(
      this.resolvePath("profile.json"),
      JSON.stringify(profile),
    );

    return profile;
  }

  async insertSecrets(secrets: Secrets): Promise<Secrets> {
    await Deno.writeTextFile(
      this.resolvePath("secrets.json"),
      JSON.stringify(secrets),
    );

    return secrets;
  }

  async getAgents(): Promise<Agent[]> {
    await ensureDir(this.resolvePath("agents"));
    const agents = this.getFiles(this.resolvePath("agents"), "_agent.json");

    return [defaultAgent, ...agents.map((agentFile) => {
      const agentStr = Deno.readTextFileSync(agentFile);
      return JSON.parse(agentStr);
    })];
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    await ensureDir(this.resolvePath("agents"));

    try {
      const agentStr = Deno.readTextFileSync(
        this.resolvePath(`agents/${agentId}/_agent.json`),
      );

      if (agentStr) {
        return JSON.parse(agentStr);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  async insertAgent(agent: Agent): Promise<Agent> {
    await ensureDir(this.resolvePath("agents", agent.id));

    Deno.writeTextFileSync(
      this.resolvePath("agents", agent.id, "_agent.json"),
      JSON.stringify(agent),
    );

    return agent;
  }

  async createChat(chat: Chat): Promise<Chat> {
    // @TODO: make them async!
    await ensureDir(this.resolvePath(`chats/${chat.id}`));

    // Create a file with id of the chat and a folder with the same id for messages
    await Deno.writeTextFile(
      this.resolvePath(`chats/${chat.id}/_chat.json`),
      JSON.stringify(chat),
    );
    await ensureDir(this.resolvePath("chats", chat.id));

    return chat;
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      await Deno.remove(this.resolvePath("chats", chatId), {
        recursive: true,
      });
    } catch (error) {
      console.error("Couldn't remove the chat", error);
    }
  }

  async getChat(chatId: string): Promise<Chat | null> {
    await ensureDir(this.resolvePath(`chats/${chatId}`));

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

  async updateChat(chat: Chat): Promise<void> {
    await ensureDir(this.resolvePath(`chats/${chat.id}`));

    await Deno.writeTextFile(
      this.resolvePath(`chats/${chat.id}/_chat.json`),
      JSON.stringify(chat),
    );
  }

  async getChats(): Promise<Chat[]> {
    await ensureDir(this.resolvePath("chats"));

    const chatFiles = this.getFiles(this.resolvePath("chats"), "_chat.json");
    const chats: Chat[] = [];

    for (const chatFile of chatFiles) {
      const chatStr = await Deno.readTextFile(chatFile);
      chats.push(JSON.parse(chatStr));
    }

    return chats;
  }

  private getFiles(folderPath: string, targetFilename: string): string[] {
    const chatFiles: string[] = [];
    const entries = Deno.readDirSync(folderPath);

    for (const entry of entries) {
      const entryPath = folderPath + '/' + entry.name;

      if (entry.isFile && entry.name === targetFilename) {
        chatFiles.push(entryPath);
      } else if (entry.isDirectory) {
        const subChatFiles = this.getFiles(entryPath, targetFilename);
        chatFiles.push(...subChatFiles);
      }
    }

    return chatFiles;
  }

  async createChatMessage(chatId: string, message: ChatMessage): Promise<ChatMessage> {
    await ensureDir(this.resolvePath("chats", chatId));

    // Create a file with the id of the message
    Deno.writeTextFileSync(
      this.resolvePath("chats", chatId, `${message.id}.json`),
      JSON.stringify(message),
    );

    return message;
  }

  async checkChatMessage(chatId: string, messageId: string): Promise<boolean> {
    try {
      await Deno.readTextFile(
        this.resolvePath("chats", chatId, `${messageId}.json`),
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  async updateChatMessage(chatId: string, message: ChatMessage): Promise<void> {
    await Deno.writeTextFile(
      this.resolvePath("chats", chatId, `${message.id}.json`),
      JSON.stringify(message),
    );
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
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

        const messageStr = await Deno.readTextFile(
          this.resolvePath("chats", chatId, messageFile.name),
        );
        messages.push(JSON.parse(messageStr));
      }
    }

    messages.sort((a, b) => a.createdAt - b.createdAt);

    return messages;
  }
}
