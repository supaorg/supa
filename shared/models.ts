export type ChatMessage = {
  id: string;
  role: string | null;
  text: string | null;
  inProgress: number | null;
  createdAt: number;
  updatedAt: number | null;
}

export type Chat = {
  id: string;
  agentId: string;
  createdAt: number;
  updatedAt: number | null;
  title: string | null;
};

export type Profile = {
  name: string;
};

export type Secrets = {
  openai: string;
}

export type Agent = {
  id: string;
  name: string;
  button: string;
  description: string;
  targetLLM: string;
  instructions: string;
};