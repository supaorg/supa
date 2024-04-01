export type ChatMessage = {
  id: string;
  chatThreadId: string;
  role: string | null;
  text: string | null;
  inProgress: number | null;
  createdAt: number;
  updatedAt: number | null;
}

export type ChatThread = {
  id: string;
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