import { Thread, ThreadMessage, Profile, Secrets } from "@shared/models.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { Agent } from "../../shared/models.ts";
import { defaultAgent } from "../agents/defaultAgent.ts";

export class AppDb {
  constructor(private workspaceDir: string) {}

  private resolvePath(...paths: string[]): string {
    return join(this.workspaceDir, ...paths);
  }

  getOpenaiKey(): string {
    const secrets = JSON.parse(Deno.readTextFileSync(this.resolvePath("secrets.json")));
  
    return secrets.openai;
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

  async createThread(thread: Thread): Promise<Thread> {
    // @TODO: make them async!
    await ensureDir(this.resolvePath(`threads/${thread.id}`));

    // Create a file with id of the thread and a folder with the same id for messages
    await Deno.writeTextFile(
      this.resolvePath(`threads/${thread.id}/_thread.json`),
      JSON.stringify(thread),
    );
    await ensureDir(this.resolvePath("threads", thread.id));

    return thread;
  }

  async deleteThread(threadId: string): Promise<void> {
    try {
      await Deno.remove(this.resolvePath("threads", threadId), {
        recursive: true,
      });
    } catch (error) {
      console.error("Couldn't remove the thread", error);
    }
  }

  async getThread(threadId: string): Promise<Thread | null> {
    await ensureDir(this.resolvePath(`threads/${threadId}`));

    try {
      const threadStr = Deno.readTextFileSync(
        this.resolvePath(`threads/${threadId}/_thread.json`),
      );

      if (threadStr) {
        return JSON.parse(threadStr);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  async updateThread(thread: Thread): Promise<void> {
    await ensureDir(this.resolvePath(`threads/${thread.id}`));

    await Deno.writeTextFile(
      this.resolvePath(`threads/${thread.id}/_thread.json`),
      JSON.stringify(thread),
    );
  }

  async getThreads(): Promise<Thread[]> {
    await ensureDir(this.resolvePath("threads"));

    const threadFiles = this.getFiles(this.resolvePath("threads"), "_thread.json");
    const threads: Thread[] = [];

    for (const threadFile of threadFiles) {
      const threadStr = await Deno.readTextFile(threadFile);
      threads.push(JSON.parse(threadStr));
    }

    return threads;
  }

  private getFiles(folderPath: string, targetFilename: string): string[] {
    const threadFiles: string[] = [];
    const entries = Deno.readDirSync(folderPath);

    for (const entry of entries) {
      const entryPath = folderPath + '/' + entry.name;

      if (entry.isFile && entry.name === targetFilename) {
        threadFiles.push(entryPath);
      } else if (entry.isDirectory) {
        const subThreadFiles = this.getFiles(entryPath, targetFilename);
        threadFiles.push(...subThreadFiles);
      }
    }

    return threadFiles;
  }

  async createThreadMessage(threadId: string, message: ThreadMessage): Promise<ThreadMessage> {
    await ensureDir(this.resolvePath("threads", threadId));

    // Create a file with the id of the message
    Deno.writeTextFileSync(
      this.resolvePath("threads", threadId, `${message.id}.json`),
      JSON.stringify(message),
    );

    return message;
  }

  async checkThreadMessage(threadId: string, messageId: string): Promise<boolean> {
    try {
      await Deno.readTextFile(
        this.resolvePath("threads", threadId, `${messageId}.json`),
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  async updateThreadMessage(threadId: string, message: ThreadMessage): Promise<void> {
    await Deno.writeTextFile(
      this.resolvePath("threads", threadId, `${message.id}.json`),
      JSON.stringify(message),
    );
  }

  async getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
    // Get all messages in the folder with the thread id
    const messageFiles = Deno.readDirSync(
      this.resolvePath("threads", threadId),
    );

    const messages: ThreadMessage[] = [];

    for (const messageFile of messageFiles) {
      if (messageFile.isFile && messageFile.name.endsWith(".json")) {
        if (messageFile.name === "_thread.json") {
          continue;
        }

        const messageStr = await Deno.readTextFile(
          this.resolvePath("threads", threadId, messageFile.name),
        );
        try {
          messages.push(JSON.parse(messageStr));
        } catch {
          console.error("Invalid message file", messageFile.name);
        }
        
      }
    }

    messages.sort((a, b) => a.createdAt - b.createdAt);

    return messages;
  }
}
