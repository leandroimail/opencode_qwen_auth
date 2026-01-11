# Integration Guide: OpenCode & Qwen

This document explains how the **OpenCode Qwen Auth Plugin** works in tandem with OpenCode's configuration to provide a complete experience (Authentication + Model Selection).

## Architecture

OpenCode separates **Authentication** (handled by plugins) from **Model Provision** (handled by configuration).

1.  **Auth Plugin (`opencode-qwen-auth`)**:
    -   Registers an Auth Provider with ID `qwen`.
    -   Reads the access token from `~/.qwen/oauth_creds.json`.
    -   Intercepts requests to the `qwen` provider and injects the `Authorization: Bearer <token>` header.

2.  **Provider Configuration (`opencode.json`)**:
    -   Defines the `qwen` provider for the UI.
    -   Specifies the API Endpoint (`baseURL`).
    -   Lists the available Models.
    -   Uses the `@ai-sdk/openai-compatible` adapter to communicate with the API.

## Complete Setup

### 1. Install the Plugin
Ensure the plugin is added to your `~/.config/opencode/config.json`:

```json
"plugin": ["file:///path/to/opencode_qwen_auth"]
```

### 2. Configure the Provider
Add the provider definition. The key `qwen` MUST match the provider ID used by the plugin to ensure authentication is injected correctly.

```json
"provider": {
  "qwen": {
    "npm": "@ai-sdk/openai-compatible",
    "name": "Qwen",
    "options": {
      // The OpenAI-compatible endpoint for Qwen
      "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1" 
    },
    "models": {
      // Define the models you want to use
      "qwen-2.5-coder-32b-instruct": {
        "name": "Qwen 2.5 Coder 32B",
        "limit": {
          "context": 128000,
          "output": 8192
        }
      },
      "qwen-plus": {
        "name": "Qwen Plus"
      }
    }
  }
}
```

### 3. Verification
1.  Restart OpenCode.
2.  Go to **Settings > Auth** and ensure "Qwen (CLI Auth)" is connected.
3.  Open the Model Picker (`Cmd+K` or click the model name).
4.  You should see the "Qwen" section with the models you configured.

## Why isn't this automatic?
Currently, OpenCode plugins do not support dynamically registering LLM Providers or Models via the API. This must be done declaratively in the configuration file. The plugin bridges the gap by providing the dynamic authentication token that the static configuration cannot handle securely.
