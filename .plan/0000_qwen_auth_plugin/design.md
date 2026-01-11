# Design: OpenCode Qwen Auth Plugin

## 1. Goal
Create `opencode-qwen-auth`, a fork of `opencode-gemini-auth`, to enable Qwen Coder authentication in OpenCode using existing credentials from the Qwen Coder CLI.

## 2. Context
- **Source Credentials**: `~/.qwen/oauth_creds.json` (Contains `access_token`, `refresh_token`, `expiry_date`).
- **Target Platform**: OpenCode.
- **Base Codebase**: `opencode-gemini-auth` (cloned locally).

## 3. Architecture

### 3.1 Components
1.  **Plugin Entry (`index.ts` / `src/plugin.ts`)**:
    -   **Auth Hook**: Registers the auth provider with OpenCode (`qwen`).
    -   **Config Hook**: Automatically registers the Provider and Models in OpenCode's configuration.
        -   Sets `npm` package to `@ai-sdk/openai-compatible`.
        -   Sets `baseURL` to `https://dashscope.aliyuncs.com/compatible-mode/v1`.
        -   Registers default models (`coder-model`, `vision-model`, `qwen-plus`, etc.).

2.  **Credential Manager (`src/qwen/credentials.ts`)**:
    -   **Reading**: Reads `~/.qwen/oauth_creds.json`.
    -   **Validation**: Checks if `access_token` is valid based on `expiry_date`.
    -   **Refresh**: Logic implemented to refresh token or warn user.

3.  **Auth Provider Implementation (`src/plugin/auth.ts`)**:
    -   Implements OpenCode's AuthProvider interface.
    -   Returns the valid Bearer token to OpenCode.

## 4. Data Flow
1.  **Startup**: Plugin `config` hook runs -> Registers "Qwen" provider in OpenCode memory.
2.  **Auth Request**: OpenCode requests auth for "qwen".
3.  **Token Retrieval**: Plugin reads `oauth_creds.json`.
4.  **Validation**: Plugin checks expiry.
    -   If valid -> Return token.
    -   If expired -> (Optional) Call Refresh -> Return new token.
5.  **API Call**: OpenCode uses `@ai-sdk/openai-compatible` to call DashScope API, injecting the Bearer token provided by the plugin.

## 5. Key Changes from Gemini Plugin
-   **Path**: Change `~/.config/google-cloud/...` to `~/.qwen/oauth_creds.json`.
-   **Endpoints**: Change Google OAuth endpoints to Qwen endpoints.
-   **Programmatic Config**: Added `config` hook (missing in Gemini plugin) to ensure models appear in UI without manual user config.
