import { Connection as Connection } from "./Connection";
import {
  new_MsgSubscribeToRoute,
  new_MsgUnsubscribeFromRoute,
  type Payload,
  type RouteResponse,
  type RouteVerb,
} from "./types";

export class Client {
  private conn: Connection;
  private isFullyConnected = false;
  private url?: string;
  private subscribedRoutes: Record<
    string,
    (broadcast: { action: "POST" | "DELETE"; data: Payload }) => void
  > = {};
  private reconnectTimeout = -1;

  public getURL() {
    return this.url;
  }

  constructor(url?: string) {
    if (url) {
      const socket = new WebSocket(url);
      this.conn = Connection.newClient(socket);
      this.url = url;
    } else {
      this.conn = Connection.newClient();
    }

    this.conn.onRouteMessage = async (_, msg) => {
      const sub = this.subscribedRoutes[msg.route];
      if (sub) {
        const action = msg.verb as "POST" | "DELETE";
        sub({ data: msg.data, action: action });
      }
    };

    this.conn.onClientConnect = () => {
      this.isFullyConnected = true;
    };

    this.conn.onClose = () => {
      this.isFullyConnected = false;

      clearTimeout(this.reconnectTimeout);

      console.error("Connection closed, re-connecting...");

      this.reconnectTimeout = setTimeout(() => {
        // We try to re-connect immidiately upon the connection closing.
        // We send a secret to the to the endpoint to re-establish the same connection.
        this.reconnect();
      }, 500);
    };
  }

  private reconnect() {
    if (!this.url) {
      return;
    }

    const secret = this.conn.getSecret();
    const urlWithSecret = Client.getUrlWithSecret(this.url, secret);
    const newSocket = new WebSocket(urlWithSecret);
    this.conn.setSocket(newSocket);
    this.resubscribeToRoutes();
  }

  private resubscribeToRoutes() {
    for (const route in this.subscribedRoutes) {
      this.conn.post(new_MsgSubscribeToRoute(route), (response) => {
        if (response.error) {
          console.error(`Failed to subscribe to route "${route}"`);
          // Remove the subscription if the server rejected it
          delete this.subscribedRoutes[route];
        }
      });
    }
  }

  private static getUrlWithSecret(url: string, secret: string) {
    const queryExists = url.includes("?");
    const base = queryExists ? url.split("?")[0] : url; // Get the base URL without query parameters
    const queryParams = queryExists ? url.split("?")[1] : "";
    const existingParams = new URLSearchParams(queryParams);
    existingParams.set("connsecret", secret); // Set the connsecret, replacing if exists
    const urlWithSecret = `${base}?${existingParams.toString()}`;

    return urlWithSecret;
  }

  public setUrl(url: string) {
    this.conn.setSocket(new WebSocket(url));
    this.url = url;
  }

  public close() {
    this.conn.close();
  }

  public get(route: string) {
    return this.sendToRoute(route, "", "GET");
  }

  public delete(route: string) {
    return this.sendToRoute(route, "", "DELETE");
  }

  public post(route: string, payload?: Payload): Promise<RouteResponse> {
    return this.sendToRoute(route, payload ? payload : "", "POST");
  }

  public postAndForget(route: string, payload?: Payload) {
    // @TODO: implement postAndForget
  }

  private sendToRoute(
    route: string,
    payload: Payload,
    verb: RouteVerb,
  ): Promise<RouteResponse> {
    // Here we return a promise that resolves when the server responds.
    // When the server responds, the callback is called from Connection's `handleResponse` method.
    return new Promise((resolve, _) => {
      this.conn.sendToRoute(route, payload, verb, (response: RouteResponse) => {
        resolve(response);
      });
    });
  }

  public listen(
    route: string,
    callback: (
      broadcast: { action: "POST" | "DELETE" | "UPDATE"; data: Payload },
    ) => void,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.subscribedRoutes[route]) {
        const errorMsg = `Route "${route}" already has a subscription`;
        console.error(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      this.subscribedRoutes[route] = callback;
      
      // Wait until the connection is fully established before subscribing to a route
      // otherwise the server will reject the subscription.
      while(true) {
        if (this.isFullyConnected) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.conn.post(new_MsgSubscribeToRoute(route), (response) => {
        if (response.error) {
          const errorMsg = `Failed to subscribe to route "${route}"`;
          console.error(errorMsg);
          // Remove the subscription if the server rejects it
          delete this.subscribedRoutes[route];
          reject(new Error(errorMsg));
        } else {
          resolve();
        }
      });
    });
  }

  public unlisten(route: string) {
    this.conn.post(new_MsgUnsubscribeFromRoute(route), (response) => {
      if (response.error) {
        console.error(`Failed to unsubscribe from route "${route}"`);
        return;
      }
    });
    
    delete this.subscribedRoutes[route];
  }
}
