export type ThreadMessage = {
  id: string;
  role: string | null;
  text: string | null;
  inProgress: number | null;
  createdAt: number;
  updatedAt: number | null;
}

export type Thread = {
  id: string;
  agentId: string;
  createdAt: number;
  updatedAt: number | null;
  title: string | null;
}

export type Profile = {
  name: string;
}

export type Secrets = {
  openai: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  button: string;
  description: string;
  instructions: string;
  targetLLM: string;
  meta?: { [key: string]: string };
}