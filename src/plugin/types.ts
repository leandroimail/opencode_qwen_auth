import type { QwenCredentials } from "../qwen/credentials";

export interface AuthMethod {
  label: string;
  type: "oauth" | "api" | "local"; 
  authorize?: () => Promise<any>;
}

export interface PluginClient {
  auth: {
    set(input: { path: { id: string }; body: any }): Promise<void>;
  };
}

export interface PluginContext {
  client: PluginClient;
}

export interface Config {
  provider?: Record<string, any>;
  [key: string]: any;
}

export interface PluginResult {
  config?: (config: Config) => Promise<void>;
  auth: {
    provider: string;
    loader: (getAuth: GetAuth, provider: Provider) => Promise<LoaderResult | null>;
    methods: AuthMethod[];
  };
}

export type GetAuth = () => Promise<QwenCredentials | null>;

export interface Provider {
  options?: Record<string, unknown>;
}

export interface LoaderResult {
  apiKey: string;
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}
