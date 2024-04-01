import * as socketTypes from "./socketTypes.ts";
import { v4 as uuidv4 } from "npm:uuid";

// @TODO: add handling of messages in the class itself along with pingpong logic
// @TODO: rename to ChatConnection
export class Connection {
  private _socket: WebSocket;
  private _threadId: uuidv4 | null = null;
  private _packetSubscribers: Array<(msg: socketTypes.SocketPacket) => void> = [];
  private _closeSubscribers: Array<() => void> = [];
  private _errorSubscribers: Array<(err: Event) => void> = [];
  private initialized = false;

  static newClientConnection(socket: WebSocket, threadId: uuidv4): Connection { 
    return new Connection(socket, threadId);
  }

  // @TODO: insert a JWT validator here?
  // @TODO: on init connection handler
  static newServerConnection(socket: WebSocket): Connection { 
    const con = new Connection(socket);

    con.onPacket((msg) => {
      if (msg.type === "init") {
        con.initialized = true;
      }
    });

    return con;
  }

  private constructor(socket: WebSocket, threadId: uuidv4 | null = null) {
    this._socket = socket;
    this._threadId = threadId;

    this._socket.onmessage = (e) => {
      const msg = JSON.parse(e.data) as socketTypes.SocketPacket;

      // Validate the message
      if (!socketTypes.isSocketMsg(msg)) {
        console.error("Invalid message", msg);
        this.send(socketTypes.createErrorMsg(1, "Invalid message"));
        return;
      }

      if (!this.initialized && msg.type !== "init") {
        this.send(socketTypes.createErrorMsg(1, "Not initialized, yet. The server expects an init packet first."));
        return;
      }

      this._packetSubscribers.forEach((subscriber) => subscriber(msg));
    };
  }

  get socket(): WebSocket {
    return this._socket;
  }

  get threadId(): uuidv4 | null {
    return this._threadId;
  }

  set threadId(threadId: uuidv4 | null) {
    // @TODO: throw exception if threadId is already set

    this._threadId = threadId;
  }

  onPacket(callback: (msg: socketTypes.SocketPacket) => void) {
    this._packetSubscribers.push(callback);
  }

  onClose(callback: () => void) {
    this._closeSubscribers.push(callback);
  }

  onError(callback: (err: Event) => void) {
    this._errorSubscribers.push(callback);
  }

  send(msg: socketTypes.SocketPacket) {
    //console.log("Sending message: ", msg);

    try {
      this._socket.send(JSON.stringify(msg));
    } catch (e) {
      console.error(e);
    }
  }
}
