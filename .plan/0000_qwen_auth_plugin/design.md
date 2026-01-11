# Design: OpenCode Qwen Auth Plugin

## 1. Goal
Create `opencode-qwen-auth`, a fork of `opencode-gemini-auth`, to enable Qwen Coder authentication in OpenCode using existing credentials from the Qwen Coder CLI.

## 2. Context
- **Source Credentials**: `~/.qwen/oauth_creds.json` (Contains `access_token`, `refresh_token`, `expiry_date`).
- **Target Platform**: OpenCode.
- **Base Codebase**: `opencode-gemini-auth` (cloned locally).

## 3. Architecture

### 3.1 Components
1.  **Plugin Entry (`index.ts`)**:
    -   Registers the auth provider with OpenCode.
    -   Name: "Qwen (CLI Auth)".
    -   Provider ID: `qwen`.

2.  **Credential Manager (`src/qwen/credentials.ts`)**:
    -   **Reading**: Reads `~/.qwen/oauth_creds.json`.
    -   **Validation**: Checks if `access_token` is valid based on `expiry_date`.
    -   **Refresh**: *Crucial*. If token is expired, attempts to refresh using `refresh_token`.
        -   *Note*: The refresh endpoint needs to be identified (likely associated with `portal.qwen.ai`).
        -   *Fallback*: If refresh fails, prompt user to run `qwen login` in CLI.

3.  **Auth Provider Implementation (`src/plugin/auth.ts`)**:
    -   Implements OpenCode's AuthProvider interface.
    -   Returns the valid Bearer token to OpenCode.

## 4. Data Flow
1.  OpenCode requests auth for "qwen".
2.  Plugin reads `oauth_creds.json`.
3.  Plugin checks expiry.
    -   If valid -> Return token.
    -   If expired -> Call Refresh Endpoint -> Update `oauth_creds.json` (optional, but good practice) -> Return new token.
4.  OpenCode attaches token to request.

## 5. Key Changes from Gemini Plugin
-   **Path**: Change `~/.config/google-cloud/...` to `~/.qwen/oauth_creds.json`.
-   **Endpoints**: Change Google OAuth endpoints to Qwen endpoints (to be determined).
-   **Scopes**: Qwen likely has different scopes (or ignored if just using CLI token).

