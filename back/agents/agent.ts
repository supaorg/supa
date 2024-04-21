export type AgentPayload = string | object;

export type AgentResponse = {
  status: number;
  error: string;
  payload: AgentPayload;
};

export interface Agent {
  input: (payload: AgentPayload) => Promise<AgentResponse>;
  onOutput: (callback: (response: AgentResponse) => void) => void;
  configure: (config: object) => void;
  getConfig: () => object;
  getExpectedConfig: () => object; // @TODO: make a schema for this
}