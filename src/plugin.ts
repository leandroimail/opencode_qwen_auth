import { QWEN_PROVIDER_ID } from "./constants";
import { readQwenCredentials } from "./qwen/credentials";
import type {
  GetAuth,
  LoaderResult,
  PluginContext,
  PluginResult,
  Provider,
} from "./plugin/types";

export const QwenCLIAuthPlugin = async (
  { client }: PluginContext,
): Promise<PluginResult> => ({
  async config(config) {
    config.provider = config.provider ?? {};
    const existing = config.provider[QWEN_PROVIDER_ID] ?? {};

    config.provider[QWEN_PROVIDER_ID] = {
      ...existing,
      npm: existing.npm ?? "@ai-sdk/openai-compatible",
      name: existing.name ?? "Qwen",
      options: {
        ...existing.options,
        baseURL: existing.options?.baseURL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
      },
      models: {
        ...existing.models,
        "qwen-2.5-coder-32b-instruct": {
          name: "Qwen 2.5 Coder 32B",
          ...existing.models?.["qwen-2.5-coder-32b-instruct"],
        },
        "qwen-plus": {
          name: "Qwen Plus",
          ...existing.models?.["qwen-plus"],
        },
        "qwen-max": {
          name: "Qwen Max",
          ...existing.models?.["qwen-max"],
        },
        "coder-model": {
          name: "Qwen3 Coder Plus (Default)",
          ...existing.models?.["coder-model"],
        },
        "vision-model": {
          name: "Qwen3 Vision Plus",
          ...existing.models?.["vision-model"],
        }
      },
    };
  },
  auth: {
    provider: QWEN_PROVIDER_ID,
    loader: async (getAuth: GetAuth, provider: Provider): Promise<LoaderResult | null> => {
      const auth = await getAuth();
      
      const qwenAuth = auth as any;

      if (!qwenAuth || !qwenAuth.access) {
        return null;
      }

      if (qwenAuth.expires && Date.now() > qwenAuth.expires) {
          const fresh = await readQwenCredentials();
          if (fresh && fresh.expiry_date > Date.now()) {
              qwenAuth.access = fresh.access_token;
              qwenAuth.expires = fresh.expiry_date;
          } else {
              console.warn("Qwen token expired and could not be refreshed from file.");
          }
      }

      return {
        apiKey: "",
        async fetch(input, init) {
            const headers = new Headers(init?.headers);
            headers.set("Authorization", `Bearer ${qwenAuth.access}`);
            return fetch(input, { ...init, headers });
        },
      };
    },
    methods: [
      {
        label: "Load from Qwen CLI (~/.qwen/oauth_creds.json)",
        type: "oauth", 
        authorize: async () => {
          return {
            url: "https://qwen.ai", 
            instructions: "Reading credentials from local file...",
            method: "auto",
            callback: async () => {
                 const creds = await readQwenCredentials();
                 if (!creds) {
                     return { type: "failed", error: "Could not read ~/.qwen/oauth_creds.json" };
                 }
                 
                 return {
                     type: "success",
                     access: creds.access_token,
                     refresh: creds.refresh_token,
                     expires: creds.expiry_date,
                     resource_url: creds.resource_url
                 };
            },
          };
        },
      },
    ],
  },
});
