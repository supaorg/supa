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
  setup: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  button: string;
  description: string;
  instructions: string;
  targetLLM?: string;
  meta?: { [key: string]: string };
}

export type ModelProvider = {
  id: string;
  name: string;
  access: ModelProviderAccessType;
  url: string;
  logoUrl: string;
  defaultModel?: string;
};

export type ModelProviderAccessType = 'cloud' | 'local';

export type ModelProviderCloudConfig = {
  id: string;
  type: 'cloud';
  apiKey: string;
}

export type ModelProviderLocalConfig = {
  id: string;
  type: 'local';
  apiUrl: string;
}

export type ModelProviderConfig = ModelProviderCloudConfig | ModelProviderLocalConfig;