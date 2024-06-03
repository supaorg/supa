import { Child, Command } from "@tauri-apps/api/shell";
import { appDataDir } from "@tauri-apps/api/path";

export function isTauri() {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

let serverInTauri: ServerInTauri | null = null;

export async function setupServerInTauri(): Promise<ServerInTauri> {
  serverInTauri = new ServerInTauri();
  await serverInTauri.init();

  return serverInTauri;
}

export function getServerInTauri(): ServerInTauri {
  if (!serverInTauri) {
    throw new Error("Server is not set up.");
  }

  return serverInTauri;
}

export class ServerInTauri {
  process: Child | null = null;
  port = -1;
  appDataDirPath = "";

  async init() {
    if (!isTauri()) {
      throw new Error("The app is not running in Tauri.");
    }

    this.appDataDirPath = await appDataDir();

    // @TODO: first check if the server is already running at a couple of ports.
    // An endpoint will have to return the workspace it's running on. And it has to match with the app's workspace.
    // There also could be a version and other info to make a decision whether to go with the running server or start a new one.

    await this.#startServer();
  }

  async kill() {
    await this.#killServer();
  }

  getHttpUrl() {
    if (this.port == -1) {
      throw new Error("Server is not running.");
    }

    return `http://localhost:${this.port}`;
  }

  getWebSocketUrl() {
    if (this.port == -1) {
      throw new Error("Server is not running.");
    }

    return `ws://localhost:${this.port}`;
  }

  getDataDirPath() {
    return this.appDataDirPath;
  }

  async #startServer() {
    if (this.process) {
      console.log("killing process: " + this.process.pid);
      await this.process.kill();
    }

    const command = Command.sidecar("binaries/server", [
      this.appDataDirPath,
    ]);

    command.stdout.on("data", (data) => {
      this.#handleProcessData(data);
    });

    command.on("close", (code) => {
      console.log(`Process exited with code: ${JSON.stringify(code)}`);
    });

    command.on("error", (error) => {
      console.error(`Process crashed with error: ${JSON.stringify(error)}`);
    });

    this.process = await command.spawn();

    // Wait for the server to start
    while (this.port == -1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async #handleProcessData(data: string) {
    try {
      const parsedData = JSON.parse(data);

      console.log("Server log: " + data);

      if (parsedData.type == "port") {
        this.port = parsedData.value;
      }
    } catch (error) {
      console.log("Server log: " + data);
    }
  }

  async #killServer() {
    if (this.process) {
      await this.process.kill();
    }

    this.process = null;
  }
}
