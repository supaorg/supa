import { Connection } from "./Connection.ts";
import {
  ConnectionSecret,
  MsgID,
  MsgResponse,
  MsgRoute,
  new_MsgNotFound,
  new_MsgResponse,
  new_MsgResponseWithCode,
  new_RouteResponse,
  new_RouteResponseError,
  Payload,
  RouteResponse,
  RouteVerb,
} from "./types.ts";
import {
  Key,
  match,
  MatchFunction,
  pathToRegexp,
} from "./helpers/pathsToRegexp.ts";

export class Router {
  /**
   * The next route subscription id (@TODO: use it to unsubscribe from routes)
   */
  private nextRouteSubID: RouteSubID = 0;
  /**
   * All the active connections that the route has
   */
  private connections: Record<ConnectionSecret, Connection> = {};
  /**
   * Routes that the router uses to handle **incoming** messages
   */
  private inRoutes: InRouteLayer[] = [];
  /**
   * Routes that the roter uses to send messages to the clients
   */
  private outRoutes: OutRouteLayer[] = [];

  constructor() {}

  addSocket(socket: WebSocket, reconnectSecret: ConnectionSecret | null) {
    if (reconnectSecret && this.connections[reconnectSecret]) {
      this.connections[reconnectSecret].setSocket(socket);
    } else {
      if (reconnectSecret) {
        console.error("Reconnect secret provided, but no connection found");
      }

      const conn = Connection.newServer(socket, (data) => {
        if (data[0] === "secret") {
          const secret = data[1] as ConnectionSecret;
          this.connections[secret] = conn;
        }
      });

      conn.onRouteMessage = async (msgId: MsgID, msg: MsgRoute) => {
        return await this.handleRouteMessage(conn.getSecret(), msgId, msg);
      };

      conn.onSubscribeToRoute = (route) => {
        this.subscribeConnectionToRoute(route, conn.getSecret());
      };

      conn.onUnsubscribeFromRoute = (route) => {
        this.unsubsctibeConnectionFromRoute(route, conn.getSecret());
      };

      conn.onClose = () => {
        this.removeConnection(conn.getSecret());
      };
    }
  }

  private async handleRouteMessage(
    connSecret: ConnectionSecret,
    msgId: MsgID,
    msg: MsgRoute,
  ): Promise<RouteResponse | void> {
    for (const route of this.inRoutes) {
      const match = route.match(msg.route);
      if (match) {
        let params: Record<string, string> = {};
        for (let i = 0; i < route.keys.length; i++) {
          params[route.keys[i]] = match.params[i];
        }

        const ctx = {
          params,
          data: msg.data,
          sender: this.connections[connSecret],
          route: msg.route,
        } as ResponseContext;

        const verbAndHandler = route.verbs.find((vh) => vh.verb === msg.verb);
        if (!verbAndHandler) {
          return new_RouteResponseError(
            `Route "${msg.route}" does not support verb "${msg.verb}"`,
          );
        }

        await verbAndHandler.handler(ctx);

        if (ctx.error) {
          return new_RouteResponseError(ctx.error);
        }

        return new_RouteResponse(ctx.response);
      }
    }
  }

  private setInRoute(
    route: string,
    verb: RouteVerb,
    handler: (ctx: ResponseContext) => void | Promise<void>,
  ): RouteSubID {
    const keys: Key[] = [];
    const regexp = pathToRegexp(route, keys);

    let targetRoute: InRouteLayer | undefined;
    for (const r of this.inRoutes) {
      if (String(r.regexp) === String(regexp)) {
        targetRoute = r;
        break;
      }
    }

    if (!targetRoute) {
      targetRoute = {
        id: this.nextRouteSubID++,
        route,
        regexp,
        match: match(regexp, { decode: decodeURIComponent }),
        keys: keys.map((k) => String(k.name)),
        verbs: [],
      };

      this.inRoutes.push(targetRoute);
    }

    const verbAndHandler = targetRoute.verbs.find((vh) => vh.verb === verb);
    if (!verbAndHandler) {
      targetRoute.verbs.push({
        // @TODO: perhaps push here the variables of the route, so we can use whatever user defined, e.g: :name, :id, etc
        verb,
        handler,
      });
    } else {
      // @TODO: how about having multiple handlers for the same verb?
      verbAndHandler.handler = handler;
    }

    return targetRoute.id;
  }

  setOutRoute(
    route: string,
    validate: (
      conn: Connection,
      params: Record<string, string>,
    ) => boolean | Promise<boolean>,
  ): RouteSubID {
    const keys: Key[] = [];
    const regexp = pathToRegexp(route, keys);

    let targetRoute: OutRouteLayer | undefined;
    for (const r of this.outRoutes) {
      if (String(r.regexp) === String(regexp)) {
        targetRoute = r;
        break;
      }
    }

    if (!targetRoute) {
      targetRoute = {
        id: this.nextRouteSubID++,
        route,
        regexp,
        match: match(regexp, { decode: decodeURIComponent }),
        keys: keys.map((k) => String(k.name)),
        listeners: [],
        validate,
      };

      this.outRoutes.push(targetRoute);
    }

    return targetRoute.id;
  }

  onPost(
    route: string,
    handler: (ctx: ResponseContext) => void | Promise<void>,
  ): this {
    this.setInRoute(route, "POST", handler);

    return this;
  }

  onGet(
    route: string,
    handler: (ctx: ResponseContext) => void | Promise<void>,
  ): this {
    this.setInRoute(route, "GET", handler);

    return this;
  }

  onDelete(
    route: string,
    handler: (ctx: ResponseContext) => void | Promise<void>,
  ): this {
    this.setInRoute(route, "DELETE", handler);

    return this;
  }

  onValidateBroadcast(
    route: string,
    validate: (
      conn: Connection,
      params: Record<string, string>,
    ) => boolean | Promise<boolean>,
  ): this {
    this.setOutRoute(route, validate);

    return this;
  }

  post(route: string, conn: Connection, payload: Payload) {
    this.connections[conn.getSecret()].sendToRoute(route, payload, "POST");
  }

  broadcast(route: string, payload: Payload, exceptConn?: Connection) {
    this.internalBroadcast(route, "POST", payload, exceptConn);
  }

  broadcastDeletion(route: string, payload: Payload, exceptConn?: Connection) {
    this.internalBroadcast(route, "DELETE", payload, exceptConn);
  }

  broadcastUpdate(route: string, payload: Payload, exceptConn?: Connection) {
    this.internalBroadcast(route, "UPDATE", payload, exceptConn);
  }

  subscribeConnectionToRoute(path: string, connSecret: ConnectionSecret) {
    if (!this.connections[connSecret]) {
      throw new Error(`Connection with id ${connSecret} does not exist`);
    }

    for (const route of this.outRoutes) {
      const match = route.match(path);
      if (match) {
        route.listeners.push({
          conn: connSecret,
          params: Object.values(match.params),
        });
      }
    }
  }

  unsubsctibeConnectionFromRoute(path: string, connSecret: ConnectionSecret) {
    if (!this.connections[connSecret]) {
      throw new Error(`Connection with id ${connSecret} does not exist`);
    }

    for (const route of this.outRoutes) {
      const match = route.match(path);
      if (match) {
        route.listeners = route.listeners.filter((l) => l.conn !== connSecret);
      }
    }
  }

  private internalBroadcast(
    route: string,
    action: "POST" | "DELETE" | "UPDATE",
    payload: Payload,
    exceptConn?: Connection,
  ) {
    // @TODO: consider to create a route if it does not exist

    const verb = action as RouteVerb;

    for (const r of this.outRoutes) {
      const match = r.match(route);
      if (match) {
        const paramsArr = Object.values(match.params);
        for (const listener of r.listeners) {
          const conn = this.connections[listener.conn];
          if (conn !== exceptConn) {
            // Make sure the params match.
            // That means that the listener is subscribed to the exact same route
            let paramsMatch = true;
            for (let i = 0; i < listener.params.length; i++) {
              if (listener.params[i] !== paramsArr[i]) {
                paramsMatch = false;
                break;
              }
            }

            if (paramsMatch) {
              const isValidForListener = r.validate(
                conn,
                match.params as Record<string, string>,
              );
              if (isValidForListener instanceof Promise) {
                isValidForListener.then((isValid) => {
                  if (isValid) {
                    conn.sendToRoute(route, payload, verb);
                  }
                });
              } else if (isValidForListener) {
                conn.sendToRoute(route, payload, verb);
              }
            }
          }
        }
      }
    }
  }

  private removeConnection(connSecret: ConnectionSecret) {
    delete this.connections[connSecret];

    for (const route of this.outRoutes) {
      route.listeners.filter((l) => l.conn !== connSecret);
    }
  }
}

type RouteHandler = (ctx: ResponseContext) => void | Promise<void>;

type RouteSubID = number;

type RouteListener = {
  conn: ConnectionSecret;
  params: string[];
};

type VerbAndHandler = {
  verb: RouteVerb;
  handler: RouteHandler;
};

type InRouteLayer = {
  id: RouteSubID;
  route: string;
  regexp: RegExp;
  match: MatchFunction;
  keys: string[];
  verbs: VerbAndHandler[];
};

type OutRouteLayer = {
  id: RouteSubID;
  route: string;
  regexp: RegExp;
  match: MatchFunction;
  keys: string[];
  listeners: RouteListener[];
  validate: (
    conn: Connection,
    params: Record<string, string>,
  ) => boolean | Promise<boolean>;
};

type ResponseContext = {
  params: Record<string, string>;
  sender: Connection;
  data: Payload;
  error?: string;
  response: Payload;
  route: string;
};
