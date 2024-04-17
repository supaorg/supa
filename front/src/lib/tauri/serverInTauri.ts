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
      this.appDataDirPath
    ]);

    command.stdout.on("data", (data) => {
      console.log('Server log: ' + data);

      this.#handleProcessData(data);
    });
    
    command.on('close', (code) => {
      console.log(`Process exited with code: ${code}`);
    });

    command.on('error', (error) => {
      console.error(`Process crashed with error: ${error.message}`);
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