import { Agent, AgentPayload, AgentResponse } from './agent.ts';


export class SimpleChatAgent implements Agent {
  private config: object;

  constructor() {
    this.config = {};
  }

  async input(payload: AgentPayload): Promise<AgentResponse> {
    return {
      status: 200,
      error: '',
      payload: 'Input received'
    }
  }

  async onOutput(callback: (response: AgentResponse) => void) {
    
  }

  configure(config: object): void {
    // Let's validate the config here
    this.config = config;
  }

  getConfig(): object {
    return this.config;
  }

  getExpectedConfig(): object {
    return this.config;
  }
}