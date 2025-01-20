import { AgentServices } from "./AgentServices.ts";

export type AgentOutput = string | object;

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
}

export type AgentInput = any;

export type AgentResponse = {
  status: number;
  error: string;
  payload: AgentOutput;
};

// @TODO: consider making input and output generic 
export abstract class Agent<TConfig> {
  protected services: AgentServices;
  protected config: TConfig;

  constructor(services: AgentServices, config: TConfig) {
    this.services = services;
    this.config = config;
  }

  abstract input(payload: AgentInput, onStream?: (output: AgentOutput) => void): Promise<AgentOutput>;

  abstract stop(): void;

  getConfig(): TConfig {
    return this.config;
  }
}