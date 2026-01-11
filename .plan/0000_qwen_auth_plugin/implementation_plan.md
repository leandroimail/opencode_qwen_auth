# Implementation Plan: opencode-qwen-auth

## Phase 1: Setup & Scaffolding
- [x] **Task 1.1**: Initialize Project.
    -   *Description*: Copy contents of \`reference_gemini_auth\` to the project root (excluding \`.git\`). Initialize a new git repository.
- [x] **Task 1.2**: Rename & Configure.
    -   *Description*: Update \`package.json\` name to \`opencode-qwen-auth\`. Update author/description. Run \`bun install\` (or npm/yarn) to ensure dependencies work.

## Phase 2: Core Logic Adaptation
- [x] **Task 2.1**: Refactor Directory Structure.
    -   *Description*: Rename \`src/gemini\` to \`src/qwen\`. Update import paths in \`index.ts\` and other files.
- [x] **Task 2.2**: Implement Credential Reader.
    -   *Description*: Modify \`src/qwen/oauth.ts\` (or create \`credentials.ts\`) to read from \`~/.qwen/oauth_creds.json\`. Define the interface matching the Qwen JSON structure.
- [x] **Task 2.3**: Implement Token Refresh Logic.
    -   *Description*: Add logic to check \`expiry_date\`. Implement a \`refreshToken\` function. *Research required*: Determine the Qwen refresh endpoint. If unknown, implement a "fail and notify" fallback.

## Phase 3: Plugin Integration
- [x] **Task 3.1**: Update Provider Registration.
    -   *Description*: In \`index.ts\`, register the provider as "Qwen". Ensure it hooks into OpenCode correctly.
- [x] **Task 3.2**: Clean up Gemini artifacts.
    -   *Description*: Remove Google-specific logic (GCP project ID checks, specific Google scopes) that isn't relevant to Qwen.

## Phase 4: Verification
- [x] **Task 4.1**: Verification Script.
    -   *Description*: Create a script \`scripts/verify-auth.ts\` that attempts to load the credentials and print the token (masked) to verify the logic without running OpenCode.
- [x] **Task 4.2**: User Instructions.
    -   *Description*: Document how to link the plugin to OpenCode and how to handle login/refresh.

## Phase 5: Provider & Model Registration (New)
- [x] **Task 5.1**: Research Provider Registration.
    -   *Description*: Determine how to register LLM providers programmatically in OpenCode plugins.
- [x] **Task 5.2**: Implement Config Hook.
    -   *Description*: Implement the `config` hook in `src/plugin.ts` to register the `qwen` provider with `@ai-sdk/openai-compatible`.
- [x] **Task 5.3**: Register Models.
    -   *Description*: Add `coder-model`, `vision-model`, `qwen-plus`, etc., to the configuration object.
- [x] **Task 5.4**: Documentation Update.
    -   *Description*: Create `docs/INTEGRATION.md` and update `README.md` with new features.
