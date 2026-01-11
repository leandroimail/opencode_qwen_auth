# Integration Guide: OpenCode & Qwen

This document explains how the **OpenCode Qwen Auth Plugin** integrates with OpenCode.

## Architecture

This plugin uses two OpenCode hooks:

1.  **`config` Hook**:
    -   Programmatically registers the `qwen` provider in OpenCode's configuration.
    -   Sets the `@ai-sdk/openai-compatible` adapter.
    -   Configures the `baseURL` to `https://dashscope.aliyuncs.com/compatible-mode/v1`.
    -   Registers default models (`qwen-2.5-coder-32b-instruct`, `qwen-plus`, `qwen-max`).

2.  **`auth` Hook**:
    -   Registers an Auth Provider with ID `qwen`.
    -   Reads the access token from `~/.qwen/oauth_creds.json`.
    -   Intercepts requests to the `qwen` provider and injects the `Authorization: Bearer <token>` header.

## Customization

The plugin provides sensible defaults, but you can override them in your `opencode.json` if needed. User configuration takes precedence for specific fields if you merge them manually, but the plugin's `config` hook tries to preserve existing settings using the spread syntax.

Example override in `opencode.json`:

```json
{
  "provider": {
    "qwen": {
      "options": {
        "baseURL": "https://custom-proxy.example.com/v1"
      }
    }
  }
}
```
