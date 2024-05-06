import newConnectionSecret from "./helpers/newConnectionSecret.ts";
import {
  DATA_SET, RESPONSE, ROUTE_MESSAGE,
  MsgDataSet, MsgType, MsgWrapper, SentMessages, MsgResponse, Payload, new_MsgWrapper, new_MsgRoute, MsgID, RouteResponse, new_RouteResponse, msg_ConnDataSet, MsgRoute, ConnectionSecret, MsgSubscribeToRoute, ON_ROUTE, MsgUnsubscribeFromRoute, OFF_ROUTE, pingMsg, PING, new_MsgResponseWithCode, new_MsgResponseOK, new_MsgGenericError, RouteVerb, new_RouteResponseError, new_SendAndForgetMsgWrapper,
} from "./types.ts";
import { TrackedPromise } from "./helpers/trackedPromise.ts";

type MessageResponsePair = {
  wrapper: MsgWrapper;
  response: TrackedPromise<MsgResponse>;
}

export class Connection {
  private static RESEND_NOT_ANSWERED_MESSAGES_AFTER_MS = 3000;
  private static SEND_LIMIT_PER_SEC = 100;
  private static CLOSE_ON_SERVER_AFTER_MS = 5000;

  private socket?: WebSocket;
  private nextMsgId: MsgID = 0;
  private isClient = false;
  private messagesToAck: SentMessages[] = [];
  private receivedMessages: MessageResponsePair[] = [];
  private messagesToSendAfterReconnect: MsgWrapper[] = [];
  private callbacks: Map<MsgID, (response: RouteResponse) => void> = new Map();
  private messagesSentInASecond = 0;
  private header: Record<string, Payload> = {};

  onOpen = () => { };
  onDataSet: (data: [string, Payload]) => void = () => { };
  onRouteMessage: (msgId: MsgID, msg: MsgRoute) => Promise<RouteResponse | void> = async () => { };
  onSubscribeToRoute: (route: string) => void = () => { };
  onUnsubscribeFromRoute: (route: string) => void = () => { };
  onClose: () => void = () => { };

  static newClient(ws?: WebSocket): Connection {
    const conn = new Connection(ws, newConnectionSecret(), true);
    return conn;
  }

  static newServer(ws: WebSocket, onDataSet: (data: [string, Payload]) => void): Connection {
    const conn = new Connection(ws);
    conn.onDataSet = onDataSet;
    return conn;
  }

  private constructor(ws?: WebSocket, secret: ConnectionSecret = "", isClient = false) {
    this.header['secret'] = secret;
    this.socket = ws;
    this.isClient = isClient;

    if (ws) {
      this.setSocket(ws);
    }

    setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        return;
      }

      const now = Date.now();
      for (let i = 0; i < this.messagesToAck.length; i++) {
        const msg = this.messagesToAck[i];
        if (now - msg.sentAt > Connection.RESEND_NOT_ANSWERED_MESSAGES_AFTER_MS) {

          this.sendWrappedMsg(msg.wrappedMsg, i);
        }
      }
    }, 10);

    setInterval(() => {
      this.messagesSentInASecond = 0;
    }, 1000);

    this.pingPong();
  }

  public getSecret(): ConnectionSecret {
    return this.header['secret'] as ConnectionSecret || '';
  }

  closingTimer = -1;

  public setSocket(ws: WebSocket) {
    this.socket = ws;
    this.socket.onmessage = this.handleSocketEvent.bind(this);

    clearTimeout(this.closingTimer);

    this.socket.onclose = () => {
      if (this.isClient) {
        this.onClose();
        return;
      }

      this.closingTimer = setTimeout(() => {
        this.onClose();
      }, Connection.CLOSE_ON_SERVER_AFTER_MS);
    }

    this.socket.onopen = () => {
    }

    this.socket.onerror = (e) => {
      console.error("Socket error", e);
    }

    if (this.isClient) {
      // @TODO: turn into a method for setting any data. Send the whole 'header' array
      const msgId = this.postAndExpectResponse(msg_ConnDataSet('secret', this.header['secret'] as string));
      //@TODO: save prev values and set them back if the fallback is not 200
      this.callbacks.set(msgId, (response: RouteResponse) => {
        const data = response.data as [string, Payload]
        this.header[data[0]] = data[1];
      });
    }

    this.socket.onopen = () => {
      this.sendMessagesFromLaterList();
    }
  }

  private async pingPong() {
    while (true) {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        // Just wait for a bit and check again. Not too often to not be wasteful.
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const pongReceived = await this.sendPingWaitForPong();

      if (!pongReceived) {
        console.error("Pong not received. Closing the connection.");
        this.close();
      }
    }
  }

  private async sendPingWaitForPong(): Promise<boolean> {
    const msgId = this.postAndExpectResponse(pingMsg);
    let pongReceived = false;
    this.callbacks.set(msgId, (response: RouteResponse) => {
      if (!response.error) {
        pongReceived = true;
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    return pongReceived;
  }

  public post(msg: MsgType, callback?: (response: RouteResponse) => void) {
    const msgId = this.postAndExpectResponse(msg);
    if (callback) {
      this.callbacks.set(msgId, callback);
    }
  }

  public sendToRoute(route: string, payload: Payload, verb: RouteVerb, callback?: (response: RouteResponse) => void) {
    if (this.messagesSentInASecond > Connection.SEND_LIMIT_PER_SEC) {
      callback?.(new_MsgResponseWithCode(-1, 429, `Rate limit of ${Connection.SEND_LIMIT_PER_SEC} messages per second exceeded`));
    }

    const msg = new_MsgRoute(route, payload, verb);
    const msgId = this.postAndExpectResponse(msg);
    this.messagesSentInASecond++;

    if (callback) {
      // *Here we save the callback* to call it when the server responds. 
      // It's called from `handleResponse` method.
      this.callbacks.set(msgId, callback);
    }
  }

  public sendToRouteAndForget(route: string, payload: Payload) {
    const msg = new_MsgRoute(route, payload);
    this.postAndForget(msg);
  }

  public close() {
    this.socket?.close();
  }

  private sendMessagesFromLaterList() {
    for (const msg of this.messagesToSendAfterReconnect) {
      this.sendWrappedMsg(msg);
    }

    this.messagesToSendAfterReconnect = [];
  }

  /**
   * Send a message and expect a response (acknowledge).
   * @param msg 
   * @returns 
   */
  private postAndExpectResponse(msg: MsgType): MsgID {
    if (msg.type === RESPONSE) {
      // We should never expect a response (ack) to a response message.
      // That would result in an infinite loop of responses.
      // Let's throw an error to make sure we don't call it by mistake.
      throw new Error("Can't send a response that expects an acknowledge");
    }

    const id = this.nextMsgId++;
    const wrappedMsg = new_MsgWrapper(id, msg);

    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.sendWrappedMsg(wrappedMsg);
      } catch (e) {
        console.error("Error sending message", e);
      }
    } else {
      this.messagesToSendAfterReconnect.push(wrappedMsg);
    }

    return id;
  }

  /**
   * Send a message and forget about it. If the socket is not open - the message will be dropped. 
   * The message doesn't expect to get a response (acknowledge).
   * If the message is a promise - it will be awaited and then sent.
   * @param msgOrPromise 
   */
  private async postAndForget(msgOrPromise: MsgType | Promise<MsgType>) {
    const msg = await msgOrPromise;

    const wrappedMsg = new_SendAndForgetMsgWrapper(msg);

    // We drop 'post and forget' messages if the socket is not open.
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.sendWrappedMsg(wrappedMsg);
      } catch (e) {
        console.error("Error sending message", e);
      }
    }
  }

  private static messageNeedsAck(wrappedMsg: MsgWrapper): boolean {
    return wrappedMsg.id !== -1 && wrappedMsg.msg.type !== RESPONSE;
  }

  private sendWrappedMsg(wrappedMsg: MsgWrapper, sentIdx = -1) {
    if (Connection.messageNeedsAck(wrappedMsg)) {
      let targetIndex = sentIdx;
      if (sentIdx === -1) {
        // Add or update the message in the list of messages to acknowledge. 
        // Those messages expect to get a response.
        for (let i = this.messagesToAck.length - 1; i >= 0; i--) {
          if (this.messagesToAck[i].wrappedMsg.id === wrappedMsg.id) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex === -1) {
        this.messagesToAck.push({
          wrappedMsg,
          sentAt: Date.now(),
          sentAmount: 1
        });
      } else {
        this.messagesToAck[targetIndex].sentAmount++;
        this.messagesToAck[targetIndex].sentAt = Date.now();
      }
    }

    this.socket?.send(JSON.stringify(wrappedMsg));
  }

  private handleSocketEvent(event: MessageEvent) {
    const wrapper = JSON.parse(event.data) as MsgWrapper;

    this.handleMessage(wrapper);
  }

  private getReceivedPairById(id: MsgID): MessageResponsePair | null {
    for (let i = this.receivedMessages.length - 1; i >= 0; i--) {
      if (this.receivedMessages[i].wrapper.id === id) {
        return this.receivedMessages[i];
      }
    }

    return null;
  }

  private handleMessage(wrapper: MsgWrapper) {
    const id = wrapper.id;
    // When id is -1 it means that the message doesn't expect a response.
    // And we won't save it in the list of received messages.
    const needsResponse = id !== -1;
    const msg = wrapper.msg;

    const alreadyReceived = needsResponse ? this.getReceivedPairById(id) : null;
    if (alreadyReceived) {

      if (alreadyReceived.response.isPending) {
        console.log("Message is being processed");
        this.postAndForget(new_MsgResponseWithCode(id, 202, "Message is being processed"));
      } else {
        this.postAndForget(alreadyReceived.response.getOriginal());
      }

      // No need for further handling of that message. We already did that before.
      return;
    }

    let response: MsgResponse | Promise<MsgResponse> | null = null;

    try {
      switch (msg.type) {
        case DATA_SET:
          response = this.handleDataSet(id, msg as MsgDataSet);
          break;

        case PING:
          response = new_MsgResponseOK(id, "pong");
          break;

        case RESPONSE:
          this.handleResponse(msg as MsgResponse);
          break;

        case ON_ROUTE:
          response = this.handleRouteSubscription(id, msg as MsgSubscribeToRoute);
          break;

        case OFF_ROUTE:
          response = this.handleRouteUnsubscription(id, msg as MsgUnsubscribeFromRoute);
          break;

        case ROUTE_MESSAGE:
          response = this.handleRouteMessage(id, msg as MsgRoute);
          break;

        default:
          throw new Error("Unknown message type");
      }

      if (needsResponse) {
        if (!response) {
          response = new_MsgGenericError(id, "No response");
        }

        this.postAndForget(response);
      }
    } catch (e) {
      if (needsResponse) {
        console.error("Error handling message", e);
        this.postAndForget(new_MsgGenericError(id, "Error handling message"));
      }
    }

    if (needsResponse) {
      if (response === null) {
        response = new_MsgGenericError(id, "No response");
      }

      this.receivedMessages.push({ wrapper, response: new TrackedPromise(response) });
    }
  }

  private handleDataSet(msgId: MsgID, msg: MsgDataSet): MsgResponse {
    this.header[msg.key] = msg.value;
    this.onDataSet([msg.key, msg.value]);
    return new_MsgResponseOK(msgId, [msg.key, msg.value]);
  }

  private handleResponse(msg: MsgResponse) {
    const msgId = msg.target;

    if (msg.status === 202) {
      // When the message we sent is being processed we don't need to do anything.
      return;
    }

    let response: RouteResponse;

    if (msg.status === 200) {
      response = new_RouteResponse(msg.data);
    } else {
      response = new_RouteResponseError(msg.data as string);
    }

    const callback = this.callbacks.get(msgId);
    if (callback) {
      callback(response);
      this.callbacks.delete(msgId);
    }

    this.removeMessageToAck(msgId);
  }

  private handleRouteSubscription(msgId: number, msg: MsgSubscribeToRoute): MsgResponse {
    this.onSubscribeToRoute(msg.route);

    return new_MsgResponseOK(msgId);
  }

  private handleRouteUnsubscription(msgId: number, msg: MsgUnsubscribeFromRoute): MsgResponse {
    this.onUnsubscribeFromRoute(msg.route);

    return new_MsgResponseOK(msgId);
  }

  private async handleRouteMessage(msgId: number, msg: MsgRoute): Promise<MsgResponse> {
    const resp = await this.onRouteMessage(msgId, msg);

    if (resp === undefined) {
      return new_MsgResponseOK(msgId);
    } else {
      if (!resp.error) {
        return new_MsgResponseOK(msgId, resp.data);
      } else {
        return new_MsgResponseWithCode(msgId, 400, resp.error);
      }
    }
  }

  private removeMessageToAck(id: MsgID) {
    for (let i = this.messagesToAck.length - 1; i >= 0; i--) {
      if (this.messagesToAck[i].wrappedMsg.id === id) {
        this.messagesToAck.splice(i, 1);
        return;
      }
    }
  }
}