export type ServerInfo = {
  version: string;
  type: "local" | "remote";
  spaces: Space[];
}

export interface AppData {
  v: number;
}

export type Space = AppData & {
  id: string;
  name: string | null;
  createdAt: number;
  path: string;
  setup: boolean;
}

export type ThreadMessage = {
  id: string;
  role: string | null;
  text: string | null;
  inProgress: number | null;
  createdAt: number;
  updatedAt: number | null;
}

export type Thread = AppData & {
  id: string;
  appConfigId: string;
  createdAt: number;
  updatedAt: number | null;
  title: string | null;
}

export type Profile = {
  name: string;
}

export interface AppConfig {
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

export type ModelProviderAccessType = "cloud" | "local";

export type ModelProviderCloudConfig = {
  id: string;
  type: "cloud";
  apiKey: string;
}

export type ModelProviderLocalConfig = {
  id: string;
  type: "local";
  apiUrl: string;
}

export type ModelProviderConfig = ModelProviderCloudConfig | ModelProviderLocalConfig;