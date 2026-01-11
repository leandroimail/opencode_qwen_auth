import { QWEN_PROVIDER_ID } from "./constants.js";
import { readQwenCredentials } from "./qwen/credentials.js";
import type {
  GetAuth,
  LoaderResult,
  PluginContext,
  PluginResult,
  Provider,
  Config
} from "./plugin/types.js";

export const QwenCLIAuthPlugin = async (
  { client }: PluginContext,
): Promise<PluginResult> => ({
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
        async fetch(input: RequestInfo | URL, init?: RequestInit) {
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
