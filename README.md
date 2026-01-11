# OpenCode Qwen Auth Plugin

**Authenticate OpenCode with your Qwen Coder account.**

This plugin enables you to use your existing Qwen Coder CLI credentials directly within OpenCode. It reads the credentials from `~/.qwen/oauth_creds.json`.

## Prerequisites

- [OpenCode CLI](https://opencode.ai) installed.
- [Qwen Coder CLI](https://github.com/QwenLM/Qwen3-Coder) installed and authenticated.
  - You must have run `qwen login` successfully.
  - Verify that `~/.qwen/oauth_creds.json` exists.

## Installation

Since this plugin is local/forked:

1.  Clone this repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Add the plugin to your OpenCode configuration file (`~/.config/opencode/config.json`):

    ```json
    {
      "plugin": ["file:///Users/leandro.ferreira/Desktop/Prompts/opencode_qwenauth_plugin"]
    }
    ```

## Usage

1.  Run **OpenCode**.
2.  When prompted for authentication (or in the Auth settings), select **Qwen (CLI Auth)**.
3.  Select **Load from Qwen CLI (~/.qwen/oauth_creds.json)**.
4.  The plugin will read your token and authenticate.

## Troubleshooting

-   **Token Expired**: If your token is expired, the plugin may fail to authenticate requests. Run `qwen login` in your terminal to refresh your credentials, then try again in OpenCode.
-   **File Not Found**: Ensure `~/.qwen/oauth_creds.json` exists.

## Development

-   Run verification script: `npx tsx scripts/verify-auth.ts`
