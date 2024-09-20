export type MsgID = number;

export type SendAndForgetMsgID = -1;

export type ConnectionSecret = string;

export type Payload = object | string | number | boolean | null | object[] | string[] | number[] | boolean[];

export type SentMessages = {
  wrappedMsg: MsgWrapper;
  sentAt: number;
  sentAmount: number;
}

export type RouteVerb = "ANY" | "GET" | "POST" | "DELETE" | "LISTEN" | "RESPONSE";

export interface MsgType {
  type: string;
}

export interface MsgForRoute extends MsgType {
  route: string;
}

export const DATA_SET = "set";

export interface MsgDataSet extends MsgType {
  type: typeof DATA_SET;
  key: string;
  value: Payload;
}

export function msg_ConnDataSet(key: string, value: Payload): MsgDataSet {
  return {
    type: DATA_SET,
    key,
    value,
  };
}

export const PING = "ping";

export interface MsgPing extends MsgType {
  type: typeof PING;
}

export const pingMsg: MsgPing = {
  type: PING,
}

export const ERROR = "err";

export interface RouteError extends MsgForRoute {
  type: typeof ERROR;
  route: string;
  status: number;
  text: string;
}

export const ON_ROUTE = "on";

export interface MsgSubscribeToRoute extends MsgForRoute {
  type: typeof ON_ROUTE;
  route: string;
}

export function new_MsgSubscribeToRoute(route: string): MsgSubscribeToRoute {
  return {
    type: ON_ROUTE,
    route,
  };
}

export const OFF_ROUTE = "off";

export interface MsgUnsubscribeFromRoute extends MsgForRoute {
  type: typeof OFF_ROUTE;
  route: string;
}

export function new_MsgUnsubscribeFromRoute(route: string): MsgUnsubscribeFromRoute {
  return {
    type: OFF_ROUTE,
    route,
  };
}

export const RESPONSE = "res";

export interface MsgResponse extends MsgType {
  type: typeof RESPONSE;
  target: number;
  status: number;
  data: Payload;
}

export function new_MsgResponse(targetMsgId: number, status: number, data: Payload): MsgResponse {
  return {
    type: RESPONSE,
    target: targetMsgId,
    status,
    data,
  };
}

export function new_MsgResponseOK(targetMsgId: number, data?: Payload): MsgResponse {
  return new_MsgResponse(targetMsgId, 200, data !== undefined ? data : "OK");
}

export function new_MsgResponseWithCode(targetMsgId: number, status: number, text: string): MsgResponse {
  return {
    type: RESPONSE,
    target: targetMsgId,
    status,
    data: text,
  };
}

export function new_MsgNotFound(targetMsgId: number, text: string): MsgResponse {
  return new_MsgResponseWithCode(targetMsgId, 404, text);
}

export function new_MsgGenericError(targetMsgId: number, text: string): MsgResponse {
  return new_MsgResponseWithCode(targetMsgId, 500, text);
}

export function new_MsgBadRequest(targetMsgId: number, text: string): MsgResponse {
  return new_MsgResponseWithCode(targetMsgId, 400, text);
}

export interface RouteResponse {
  data: Payload;
  error?: string;
}

export function new_RouteResponse(data: Payload): RouteResponse {
  return {
    data,
  };
}

export function new_RouteResponseError(error: string): RouteResponse {
  return {
    error,
    data: '',
  };
}

export const ROUTE_MESSAGE = "route";

export interface MsgRoute extends MsgForRoute {
  type: typeof ROUTE_MESSAGE;
  verb: RouteVerb;
  route: string;
  data: Payload;
  headers?: Record<string, string>;
}

export function new_MsgRoute(
  route: string,
  verb: RouteVerb = "ANY",
  data: Payload,
  headers?: Record<string, string>,
): MsgRoute {
  return {
    type: ROUTE_MESSAGE,
    verb,
    route,
    data,
    headers
  };
}

export interface MsgWrapper {
  id: MsgID | SendAndForgetMsgID;
  msg: MsgType;
}

export function new_MsgWrapper(id: MsgID, msg: MsgType): MsgWrapper {
  return {
    id,
    msg,
  };
}

export function new_SendAndForgetMsgWrapper(msg: MsgType): MsgWrapper {
  return {
    // id: -1 means that the message doesn't have an identifier and doesn't expect a response.
    id: -1,
    msg,
  };
}