# OpenCode Qwen Auth Plugin

**Authenticate OpenCode with your Qwen Coder account.**

This plugin enables you to use your existing Qwen Coder CLI credentials directly within OpenCode. It reads the credentials from `~/.qwen/oauth_creds.json` and injects the authentication token into requests.

It also **automatically configures** the Qwen provider in OpenCode, so you don't need to manually edit your `opencode.json` configuration file.

## Prerequisites

- [OpenCode CLI](https://opencode.ai) installed.
- [Qwen Coder CLI](https://github.com/QwenLM/Qwen3-Coder) installed and authenticated.
  - You must have run `qwen login` successfully.
  - Verify that `~/.qwen/oauth_creds.json` exists.

## Installation

1.  Clone this repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Add the plugin to your OpenCode configuration file (`~/.config/opencode/config.json`):

    ```json
    {
      "plugin": ["file:///path/to/opencode_qwen_auth"]
    }
    ```

## Usage

1.  Run **OpenCode**.
2.  When prompted for authentication (or in the Auth settings), select **Qwen (CLI Auth)**.
3.  Select **Load from Qwen CLI (~/.qwen/oauth_creds.json)**.
4.  The plugin will authenticate.
5.  Open the Model Picker (`Cmd+K`). You will see **Qwen** listed with models like `Qwen 2.5 Coder 32B`, `Qwen3 Coder Plus (Default)`, etc.

## Supported Models

The following models are automatically configured by the plugin:

- `coder-model`: **Qwen3 Coder Plus** (Default Qwen CLI model)
- `vision-model`: **Qwen3 Vision Plus** (Multimodal/Image support)
- `qwen-2.5-coder-32b-instruct`: Qwen 2.5 Coder 32B
- `qwen-plus`: Qwen Plus
- `qwen-max`: Qwen Max

Note that `coder-model` and `vision-model` correspond to the generic aliases used by the Qwen CLI Free Tier/OAuth.

## Troubleshooting

-   **Models not showing?** Restart OpenCode after adding the plugin.
-   **Token Expired**: Run `qwen login` in your terminal to refresh credentials.
-   **File Not Found**: Ensure `~/.qwen/oauth_creds.json` exists.

## Development

-   Run verification script: `npx tsx scripts/verify-auth.ts`
