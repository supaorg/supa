import { Child, Command } from "@tauri-apps/api/shell";
import { appDataDir } from "@tauri-apps/api/path";

export function isTauri() {
  return typeof window !== 'undefined' && '__TAURI__' in window;
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

    await this.#startServer();
  }

  async kill() {
    await this.#killServer();
  }

  getUrl() {
    if (this.port == -1) {
      throw new Error("Server is not running.");
    }

    return `http://localhost:${this.port}`;
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
      this.appDataDirPath
    ]);

    command.stdout.on("data", (data) => {
      this.#handleProcessData(data);
    });

    this.process = await command.spawn();
  }

  async #handleProcessData(data: string) {
    try {
      const parsedData = JSON.parse(data);

      if (parsedData.type == "port") {
        this.port = parsedData.value;
      }
    } catch (error) {
      console.log('Server log: ' + data);
    }
  }

  async #killServer() {
    if (this.process) {
      await this.process.kill();
    }

    this.process = null;
  }
}