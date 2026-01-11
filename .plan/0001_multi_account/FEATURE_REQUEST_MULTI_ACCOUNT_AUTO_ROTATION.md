
<solicitação>

#SOLICITAÇÃO ORIGINAL

Projeto [opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth) possui autenticação ao Gemini e ao Antigraity. Ele possui algumas caracteristicas interessantes. Primeiro, que ao logar no opencode e no modelo Google, ele solicita autenticação via oauth, ou seja, ao realizar o login via "opencode auth login" ele abre o browser para realização do login. Além disso ele faz a validação de cotas e assim que uma cota estoura é possivel mudar a conta, ou seja ele é multi conta, e tudo isso gerenciado pelo próprio plugin.

Desta forma eu gostaria de solicitar o seguinte para melhoria no projeto.

1 - que o plugin autorotassionasse o login
2 - que não fosse necessário realizar o login via qwen, mas que ao logar via opencode auth login chamasse o login
3 - que fosse possivel logar com mais de uma conta e isso fosse gerenciado pelo plugin
4 - que a rotassão de token fosse gerenciado pelo plugin.


Leia o projeto [opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth) e leio o projeto do plugin qwen para implementar a solciitação

# SOLICITAÇÃO REFINADA

# Feature Request: Multi-Account Auto-Rotation and Token Management for OpenCode Qwen Auth Plugin

## 📋 Executive Summary

**Objective**: Enhance the `opencode-qwen-auth-plugin` to implement advanced multi-account OAuth management with automatic rotation and token lifecycle handling, inspired by the robust architecture of the [`opencode-antigravity-auth`](https://github.com/NoeFabris/opencode-antigravity-auth) plugin.

**Current State**: The plugin reads credentials from a single source (`~/.qwen/oauth_creds.json`) with basic token expiry checking but lacks multi-account support, automatic rotation on rate limits, and sophisticated token management.

**Desired State**: A production-ready authentication system with:

- Multi-account OAuth support
- Automatic account rotation on rate limits
- Proactive token refresh management
- Simplified authentication flow (single `opencode auth login` command)
- Intelligent quota monitoring and account selection

---

## 🎯 Business Context & Motivation

### Problem Statement

Users of Qwen Coder CLI face several limitations:

1. **Single Account Limitation**: Current implementation only supports one Qwen account, limiting daily quota to 2,000 requests
2. **Manual Token Management**: Users must manually run `qwen login` when tokens expire
3. **Quota Exhaustion**: No automatic failover when daily rate limits are reached
4. **Fragmented Authentication**: Users must authenticate separately for Qwen CLI and OpenCode
5. **No Resilience**: Service interruptions when the single account hits rate limits

### Expected Benefits

- **Increased Throughput**: Combined quotas from multiple accounts (e.g., 3 accounts = 6,000 requests/day, maximum 10 accounts = 20,000 requests/day)
- **Higher Availability**: Automatic failover prevents service interruptions
- **Better User Experience**: Single authentication flow, no manual token management
- **Production Readiness**: Resilient to rate limits and token expiration scenarios
- **Controlled Resource Usage**: 10-account limit ensures optimal performance and security

---

## 🔍 Reference Architecture Analysis

### Study: `opencode-antigravity-auth` Plugin

The target reference implementation ([GitHub](https://github.com/NoeFabris/opencode-antigravity-auth)) demonstrates:

#### 1. **Multi-Account Management**

```typescript
// Accounts stored in ~/.config/opencode/antigravity-accounts.json
// Format:
{
  "accounts": [
    { "email": "user1@gmail.com", "refresh_token": "..." },
    { "email": "user2@gmail.com", "refresh_token": "..." }
  ]
}
```

#### 2. **Intelligent Selection Strategy**

- **Sticky Selection**: Reuses same account until rate-limited (preserves API caching)
- **Per-Model Rate Limit Tracking**: Separate limits for different model families
- **Smart Retry Threshold**: Short delays (≤5s) retry on same account
- **Exponential Backoff**: Increasing delays for consecutive rate limits

#### 3. **Dual Quota Pools** (Gemini-specific, adaptable concept)

- Automatic fallback between quota sources before switching accounts
- Maximizes quota utilization per account

#### 4. **Proactive Token Refresh**

```json
{
  "proactive_token_refresh": true,
  "proactive_refresh_buffer_seconds": 1800,  // Refresh 30min before expiry
  "proactive_refresh_check_interval_seconds": 300
}
```

#### 5. **OAuth Flow Integration**

- Unified command: `opencode auth login`
- Browser-based OAuth with callback handling
- Automatic token exchange and storage

---

## 📐 Detailed Feature Requirements

### Feature 1: Multi-Account OAuth Management

#### 1.1 Account Storage Structure

**File**: `~/.config/opencode/qwen-accounts.json`

**Constraint**: Maximum 10 accounts per installation for performance and security reasons.

```json
{
  "version": "1.0",
  "max_accounts": 10,
  "accounts": [
    {
      "id": "1",
      "email": "user1@example.com",
      "access_token": "ya29...",
      "refresh_token": "1//...",
      "resource_url": "https://qwen.ai/api",
      "expiry_date": 1704067200000,
      "created_at": 1704063000000,
      "last_used_at": 1704066000000,
      "total_requests": 1523,
      "rate_limit_resets_at": null
    },
    {
      "id": "2",
      "email": "user2@example.com",
      "access_token": "ya29...",
      "refresh_token": "1//...",
      "resource_url": "https://qwen.ai/api",
      "expiry_date": 1704070800000,
      "created_at": 1704063000000,
      "last_used_at": 1704064000000,
      "total_requests": 478,
      "rate_limit_resets_at": 1704081600000
    }
  ],
  "current_account_id": "1"
}
```

#### 1.2 Account Selection Strategy

Implement configurable selection strategies in `~/.config/opencode/qwen.json`:

```json
{
  "$schema": "https://example.com/qwen-config.schema.json",
  "account_selection_strategy": "sticky",
  "max_rate_limit_wait_seconds": 300,
  "switch_on_first_rate_limit": true,
  "retry_same_account_threshold_seconds": 5,
  "exponential_backoff_base_ms": 1000,
  "exponential_backoff_max_ms": 32000
}
```

**Strategies**:

- `sticky`: Keep same account until rate-limited (default)
- `round-robin`: Rotate through accounts sequentially
- `least-used`: Select account with lowest request count
- `hybrid`: Sticky with periodic rotation

#### 1.3 Implementation Specifications

**New Module**: `src/qwen/account-manager.ts`

```typescript
interface AccountManager {
  /**
   * Maximum number of accounts allowed
   */
  readonly MAX_ACCOUNTS: 10;
  
  /**
   * Load all saved accounts from disk
   */
  loadAccounts(): Promise<QwenAccount[]>;
  
  /**
   * Add new account after OAuth flow
   * @throws Error if MAX_ACCOUNTS limit is reached
   */
  addAccount(credentials: QwenCredentials): Promise<void>;
  
  /**
   * Get currently active account
   */
  getCurrentAccount(): Promise<QwenAccount | null>;
  
  /**
   * Select next available account based on strategy
   */
  selectNextAccount(currentAccount: QwenAccount | null, reason: 'rate_limit' | 'token_expired' | 'error'): Promise<QwenAccount | null>;
  
  /**
   * Mark account as rate-limited with reset time
   */
  markAccountRateLimited(accountId: string, resetTime: number): Promise<void>;
  
  /**
   * Update account usage statistics
   */
  updateAccountStats(accountId: string, stats: Partial<AccountStats>): Promise<void>;
  
  /**
   * Remove invalid/revoked account
   */
  removeAccount(accountId: string): Promise<void>;
  
  /**
   * Check if account limit has been reached
   */
  hasReachedAccountLimit(): Promise<boolean>;
}
```

**Account State Model**:

```typescript
interface QwenAccount {
  id: string;
  email: string;
  access_token: string;
  refresh_token: string;
  resource_url: string;
  expiry_date: number;
  created_at: number;
  last_used_at: number;
  total_requests: number;
  rate_limit_resets_at: number | null;
  is_primary: boolean;
}

interface AccountStats {
  total_requests: number;
  last_used_at: number;
  rate_limit_resets_at: number | null;
}
```

---

### Feature 2: Automatic Token Rotation Logic

#### 2.1 Rotation Triggers

Implement automatic rotation on:

1. **Rate Limit Detection** (HTTP 429)

   ```typescript
   if (response.status === 429) {
     const retryAfter = response.headers.get('Retry-After');
     const resetTime = retryAfter 
       ? Date.now() + parseInt(retryAfter) * 1000
       : Date.now() + 3600000; // Default 1 hour
     
     await accountManager.markAccountRateLimited(currentAccount.id, resetTime);
     
     if (retryAfter && parseInt(retryAfter) <= config.retry_same_account_threshold_seconds) {
       // Short delay - retry same account
       await sleep(parseInt(retryAfter) * 1000);
       return retryRequest(currentAccount);
     } else {
       // Long delay - switch account
       const nextAccount = await accountManager.selectNextAccount(currentAccount, 'rate_limit');
       return retryRequest(nextAccount);
     }
   }
   ```

2. **Token Expiration**

   ```typescript
   if (account.expiry_date && Date.now() > account.expiry_date) {
     // Attempt refresh first
     const refreshed = await tokenManager.refreshToken(account);
     if (refreshed) {
       return refreshed;
     } else {
       // Refresh failed - mark invalid and switch
       await accountManager.removeAccount(account.id);
       return await accountManager.selectNextAccount(account, 'token_expired');
     }
   }
   ```

3. **Invalid Grant Errors** (Token revoked)

   ```typescript
   if (error.code === 'invalid_grant') {
     console.warn(`Account ${account.email} token revoked, removing from pool`);
     await accountManager.removeAccount(account.id);
     return await accountManager.selectNextAccount(account, 'error');
   }
   ```

#### 2.2 Rotation Algorithm

```typescript
async function selectNextAccount(
  currentAccount: QwenAccount | null, 
  reason: RotationReason
): Promise<QwenAccount | null> {
  const config = await loadConfig();
  const accounts = await loadAccounts();
  
  // Filter out rate-limited accounts
  const availableAccounts = accounts.filter(acc => 
    !acc.rate_limit_resets_at || 
    acc.rate_limit_resets_at < Date.now()
  );
  
  if (availableAccounts.length === 0) {
    // All accounts rate-limited
    const nextReset = Math.min(...accounts.map(a => a.rate_limit_resets_at || Infinity));
    const waitTime = nextReset - Date.now();
    
    if (waitTime <= config.max_rate_limit_wait_seconds * 1000) {
      console.log(`All accounts limited. Waiting ${waitTime}ms for reset...`);
      await sleep(waitTime);
      return selectNextAccount(currentAccount, reason);
    } else {
      throw new Error('All accounts exhausted and reset time exceeds max wait threshold');
    }
  }
  
  // Apply selection strategy
  switch (config.account_selection_strategy) {
    case 'sticky':
      // Return current if still available, else first available
      return availableAccounts.find(a => a.id === currentAccount?.id) || availableAccounts[0];
    
    case 'round-robin':
      const currentIndex = availableAccounts.findIndex(a => a.id === currentAccount?.id);
      return availableAccounts[(currentIndex + 1) % availableAccounts.length];
    
    case 'least-used':
      return availableAccounts.reduce((min, acc) => 
        acc.total_requests < min.total_requests ? acc : min
      );
    
    default:
      return availableAccounts[0];
  }
}
```

---

### Feature 3: Proactive Token Refresh

#### 3.1 Background Refresh Service

**New Module**: `src/qwen/token-refresh-service.ts`

```typescript
class TokenRefreshService {
  private refreshInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start background token refresh checking
   */
  start(): void {
    const config = await loadConfig();
    
    if (!config.proactive_token_refresh) {
      return;
    }
    
    this.refreshInterval = setInterval(
      () => this.checkAndRefreshTokens(),
      config.proactive_refresh_check_interval_seconds * 1000
    );
  }
  
  /**
   * Check all accounts and refresh tokens nearing expiry
   */
  private async checkAndRefreshTokens(): Promise<void> {
    const config = await loadConfig();
    const accounts = await accountManager.loadAccounts();
    const bufferMs = config.proactive_refresh_buffer_seconds * 1000;
    
    for (const account of accounts) {
      const timeUntilExpiry = account.expiry_date - Date.now();
      
      if (timeUntilExpiry > 0 && timeUntilExpiry <= bufferMs) {
        console.log(`Proactively refreshing token for ${account.email} (expires in ${timeUntilExpiry}ms)`);
        
        try {
          const refreshed = await this.refreshToken(account);
          if (refreshed) {
            await accountManager.updateAccount(account.id, {
              access_token: refreshed.access_token,
              expiry_date: refreshed.expiry_date
            });
            console.log(`Token refreshed for ${account.email}`);
          }
        } catch (error) {
          console.error(`Failed to refresh token for ${account.email}:`, error);
        }
      }
    }
  }
  
  /**
   * Refresh token using OAuth refresh flow
   */
  private async refreshToken(account: QwenAccount): Promise<QwenCredentials | null> {
    try {
      const response = await fetch('https://qwen.ai/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
          client_id: process.env.QWEN_CLIENT_ID
        })
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || account.refresh_token,
        expiry_date: Date.now() + data.expires_in * 1000,
        token_type: data.token_type,
        resource_url: account.resource_url
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }
  
  /**
   * Stop background refresh service
   */
  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
```

#### 3.2 Configuration Options

```json
{
  "proactive_token_refresh": true,
  "proactive_refresh_buffer_seconds": 1800,
  "proactive_refresh_check_interval_seconds": 300,
  "token_refresh_retry_attempts": 3,
  "token_refresh_retry_delay_ms": 2000
}
```

---

### Feature 4: Unified OAuth Flow (`opencode auth login`)

#### 4.1 Remove Dependency on External `qwen login`

**Current Behavior**:

- Users run `qwen login` → Browser OAuth → Save to `~/.qwen/oauth_creds.json`
- Users add plugin to OpenCode → Select "Load from Qwen CLI"

**New Behavior**:

- Users run `opencode auth login` → Plugin handles OAuth directly → Save to `~/.config/opencode/qwen-accounts.json`

#### 4.2 OAuth Implementation

**Update**: `src/plugin.ts`

```typescript
methods: [
  {
    label: "Qwen OAuth (Multi-Account)",
    type: "oauth",
    authorize: async () => {
      const existingAccounts = await accountManager.loadAccounts();
      
      if (existingAccounts.length > 0) {
        // Prompt: Add or Fresh Start
        console.log(`${existingAccounts.length} account(s) saved (max: ${accountManager.MAX_ACCOUNTS}):`);
        existingAccounts.forEach((acc, idx) => {
          console.log(`${idx + 1}. ${acc.email}`);
        });
        
        // Check if limit reached
        if (existingAccounts.length >= accountManager.MAX_ACCOUNTS) {
          console.log(`⚠️  Maximum account limit (${accountManager.MAX_ACCOUNTS}) reached. Please remove an account or start fresh.`);
          const choice = await prompt('(r)emove account or (f)resh start? [r/f]: ');
          
          if (choice === 'f') {
            await accountManager.clearAllAccounts();
          } else if (choice === 'r') {
            const removeIdx = await prompt('Enter account number to remove: ');
            await accountManager.removeAccount(existingAccounts[parseInt(removeIdx) - 1].id);
          } else {
            return { type: "failed", error: "Account limit reached. Operation cancelled." };
          }
        } else {
          const choice = await prompt('(a)dd new account(s) or (f)resh start? [a/f]: ');
          
          if (choice === 'f') {
            await accountManager.clearAllAccounts();
          }
        }
      }
      
      // Initiate OAuth flow
      const oauthState = crypto.randomUUID();
      const authUrl = `https://qwen.ai/oauth/authorize?` +
        `client_id=${QWEN_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=api&` +
        `state=${oauthState}`;
      
      return {
        url: authUrl,
        instructions: "Authorize with your Qwen account in the browser",
        method: "browser",
        callback: async (code: string, state: string) => {
          if (state !== oauthState) {
            return { type: "failed", error: "Invalid OAuth state" };
          }
          
          // Exchange code for tokens
          const tokens = await exchangeOAuthCode(code);
          
          if (!tokens) {
            return { type: "failed", error: "Failed to exchange OAuth code" };
          }
          
          // Fetch user email
          const userInfo = await fetchUserInfo(tokens.access_token);
          
          // Save account
          await accountManager.addAccount({
            email: userInfo.email,
            ...tokens
          });
          
          return {
            type: "success",
            access: tokens.access_token,
            refresh: tokens.refresh_token,
            expires: tokens.expiry_date,
            resource_url: tokens.resource_url
          };
        }
      };
    }
  }
]
```

#### 4.3 OAuth Helper Functions

```typescript
async function exchangeOAuthCode(code: string): Promise<QwenCredentials | null> {
  const response = await fetch('https://qwen.ai/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: QWEN_CLIENT_ID,
      client_secret: QWEN_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI
    })
  });
  
  if (!response.ok) return null;
  
  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    expiry_date: Date.now() + data.expires_in * 1000,
    resource_url: 'https://qwen.ai/api'
  };
}

async function fetchUserInfo(accessToken: string): Promise<{ email: string }> {
  const response = await fetch('https://qwen.ai/api/user', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  return await response.json();
}
```

---

## 🛠️ Implementation Plan

### Phase 1: Foundation (Week 1)

1. **Create Account Manager Module**
   - [ ] Implement `account-manager.ts` with CRUD operations
   - [ ] Add account persistence (`qwen-accounts.json`)
   - [ ] Write unit tests for account selection strategies

2. **Configuration System**
   - [ ] Create JSON schema for `qwen.json` config file
   - [ ] Implement config loading with defaults
   - [ ] Add environment variable overrides

### Phase 2: Token Management (Week 2)

1. **Token Refresh Service**
   - [ ] Implement proactive refresh logic
   - [ ] Add background refresh scheduler
   - [ ] Handle refresh failures gracefully

2. **Rotation Logic**
   - [ ] Detect rate limit responses
   - [ ] Implement account switching logic
   - [ ] Add exponential backoff

### Phase 3: OAuth Integration (Week 3)

1. **Unified OAuth Flow**
   - [ ] Implement browser-based OAuth
   - [ ] Add OAuth callback server
   - [ ] Handle multi-account prompts

2. **Migration Path**
   - [ ] Support legacy `~/.qwen/oauth_creds.json` import
   - [ ] Provide migration script
   - [ ] Add deprecation warnings

### Phase 4: Testing & Documentation (Week 4)

1. **Testing**
   - [ ] Unit tests for all modules
   - [ ] Integration tests with mock OAuth server
   - [ ] Load testing with multiple accounts

2. **Documentation**
   - [ ] Update README with new features
   - [ ] Add configuration guide
   - [ ] Create troubleshooting section

---

## 🧪 Acceptance Criteria

### ✅ Multi-Account Support

- [ ] Plugin can store and manage multiple Qwen accounts (maximum 10)
- [ ] Accounts persisted in `~/.config/opencode/qwen-accounts.json`
- [ ] Users can add accounts via `opencode auth login` without losing existing ones
- [ ] Clear error message when attempting to add an 11th account
- [ ] Option to remove existing accounts when limit is reached

### ✅ Automatic Rotation

- [ ] Plugin automatically switches accounts when rate-limited (HTTP 429)
- [ ] Short rate limits (≤5s) are retried on same account
- [ ] Long rate limits trigger account switch
- [ ] All accounts exhausted shows helpful error with next reset time

### ✅ Proactive Token Refresh

- [ ] Tokens are refreshed 30 minutes before expiry (configurable)
- [ ] Background refresh runs every 5 minutes (configurable)
- [ ] Failed refreshes log warnings but don't crash

### ✅ Unified OAuth Flow

- [ ] `opencode auth login` opens browser for Qwen OAuth
- [ ] No need to run separate `qwen login` command
- [ ] Account email displayed in account list

### ✅ Configuration

- [ ] Config file `~/.config/opencode/qwen.json` supported
- [ ] All settings have sensible defaults
- [ ] Environment variables can override config

### ✅ Error Handling

- [ ] Invalid/revoked tokens automatically removed from pool
- [ ] Clear error messages when all accounts exhausted
- [ ] Graceful degradation (single account works like before)

### ✅ Backward Compatibility

- [ ] Existing users with `~/.qwen/oauth_creds.json` can migrate seamlessly
- [ ] Plugin suggests running migration on first load with old credentials

---

## 📚 Technical References

### Study Materials

1. **Primary Reference**: [opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth)
   - Review: Multi-account management architecture
   - Review: OAuth flow implementation
   - Review: Rate limit detection and rotation logic
   - Review: Token refresh strategies

2. **Qwen Code Documentation**:
   - [Authentication Guide](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/auth/)
   - OAuth endpoints and scopes
   - Rate limit specifications (2000 req/day, 60 req/min)

3. **OpenCode SDK**:
   - [Provider Auth v2 Discussion](https://github.com/sst/opencode/issues/5748)
   - Plugin API documentation
   - OAuth callback handling

### Key Files to Reference

From `opencode-antigravity-auth`:

```
src/
  account/
    manager.ts            # Account selection and rotation
    storage.ts            # Account persistence
  auth/
    oauth.ts              # OAuth flow implementation
    token-refresh.ts      # Proactive token refresh
  config/
    schema.json           # Configuration schema
    loader.ts             # Config loading logic
```

---

## 🔒 Security Considerations

1. **Token Storage**
   - Store refresh tokens encrypted at rest
   - Use OS keychain if available (macOS Keychain, Windows Credential Manager)
   - Set restrictive file permissions (600) on `qwen-accounts.json`

2. **OAuth Security**
   - Validate OAuth state parameter to prevent CSRF
   - Use PKCE (Proof Key for Code Exchange) if supported by Qwen
   - Implement OAuth callback timeout (5 minutes)

3. **Token Transmission**
   - Never log access/refresh tokens
   - Use HTTPS for all OAuth/API requests
   - Clear tokens from memory after use

4. **Account Limits**
   - Enforce maximum of 10 accounts per installation
   - Prevents excessive token storage and memory usage
   - Reduces attack surface for credential theft

---

## 🐛 Edge Cases to Handle

1. **All Accounts Rate-Limited**
   - Display countdown to next reset
   - Offer option to wait or cancel

2. **Account Revocation Mid-Request**
   - Detect `invalid_grant` errors
   - Auto-remove revoked account
   - Retry with next available account

3. **Network Interruptions**
   - Retry token refresh with exponential backoff
   - Cache last-known-good tokens

4. **Concurrent OpenCode Instances**
   - Use file locking for account state writes
   - Refresh account state before each rotation

5. **Clock Skew**
   - Use server `expires_in` values, not absolute timestamps
   - Add 60s buffer to expiry checks

---

## 📊 Success Metrics

1. **Availability**: 99.5% uptime for multi-account users (measured by successful request rate)
2. **Token Freshness**: <1% of requests fail due to expired tokens
3. **User Experience**: Zero manual `qwen login` invocations after setup
4. **Throughput**: 3x quota increase with 3 accounts (linear scaling)

---

## 🗂️ Deliverables

1. **Code**
   - Updated `src/plugin.ts` with multi-account support
   - New `src/qwen/account-manager.ts` module
   - New `src/qwen/token-refresh-service.ts` module
   - Configuration schema `assets/qwen-config.schema.json`

2. **Documentation**
   - Updated `README.md` with multi-account setup guide
   - Configuration reference (`docs/configuration.md`)
   - Migration guide (`docs/migration.md`)
   - Troubleshooting guide (`docs/troubleshooting.md`)

3. **Tests**
   - Unit tests (80%+ coverage)
   - Integration tests with mock OAuth
   - Manual test scenarios checklist

4. **Tooling**
   - Migration script: `scripts/migrate-from-cli.ts`
   - Account manager CLI: `scripts/manage-accounts.ts`
   - Verification script: `scripts/verify-multi-auth.ts`

---

## 🤝 Open Questions

1. **OAuth Client Credentials**: Does Qwen provide OAuth client ID/secret for third-party apps, or do we need to request them?
2. **Rate Limit Headers**: What headers does Qwen return on 429? (`Retry-After`, `X-RateLimit-Reset`, etc.)
3. **Token Refresh Endpoint**: Confirm the exact endpoint and payload format for refresh token grants
4. **User Info Endpoint**: Confirm endpoint to fetch user email after OAuth (needed for account display)

---

## 📅 Timeline Estimate

- **Phase 1 (Foundation)**: 5 days
- **Phase 2 (Token Management)**: 5 days
- **Phase 3 (OAuth Integration)**: 5 days
- **Phase 4 (Testing & Docs)**: 5 days

**Total**: ~4 weeks (20 working days)

---

**Document Version**: 1.0  
**Created**: 2026-01-11  
**Author**: Development Team  
**Stakeholders**: OpenCode Plugin Users, Qwen CLI Users

</solicitação>



<contexto>

# Contexto


Projeto - https://github.com/jenslys/opencode-gemini-auth
Projeto - https://github.com/QwenLM/Qwen3-Coder
Projeto Github - https://github.com/NoeFabris/opencode-antigravity-auth
Documento de autenticação do Qwen Coder: /Users/leandro.ferreira/.qwen/oauth_creds.json 


---

</solicitação>



<planejamento>

# Planjemanento

    <entendimento planejamento>

    ## Indicação de entendimento do planejamento

    Atualize ou gere um planejamento conforme solicitação abaixo.

    Revise todo o planejamento e as tasks, bem como o Plano de Implementação. 
    Leve em consideraçao o que já foi realizado, caso já exista algo realizado em planejamento anterior.

    Forme o planejamento detalhado, profundo.

    Divida em etapas claras e sequenciais: Crie um plano detalhado com sub-etapas, incluindo dependências, ferramentas necessárias (ex: bibliotecas Python) e critérios de sucesso. Pense em otimizações e testes iniciais.

    Siga cada etapa com precisão: Pense em como Implementar passo a passo, usando raciocínio em cadeia. Para código, inclua comentários, gerencie erros e garanta compatibilidade. Itere se necessário. 

    Avalie se esta é a melhor solução: Planeje a verificaçao de erros, otimização performance, testes com exemplos e proponha melhorias. Confirme robustez e eficiência.

---
    </entendimento planejamento>


    <instruções de implementação>

    ## Instruções de Implementação do planejamento

    Mantenha em uma pasta @./.plan/[XXXX]_[nome_dado_a_soliciação] (onde XXXX são numerios iniciando em 0000) (verifique na pasta @./.plan o ultimo numero gerado e continue desse ponto), o estado atual da implementação(current_state.md), que deve ser sempre append com o novo estado, mantenha também um log detalhado da execução (implementation_log.md), gere também inicialmente de desenho do entendimento da solicitação e do entendimento do projeto como todo, bem como esboçando resumidamente o design de solução proposto (design.md)

    Ao executar cada task, atualize as tasks, o estado atual e o log de implantação. Atualise os arquivos em @./.plan/[XXXX]_[nome_dado_a_soliciação]principalmente o log com tudo que foi realizado (como a data hora da realização), caso houver erros, documentando, as coisas que foram decidias.
    Antes de executar cada task, valide se tem no contexto a lista de tasks, o estado atual, o log de implantaçao e plano detalhado do que deve ser executado.


    ### IMPORTANTE

    1 - copia dos arquivos de plano e task ao final da execução
    Ao final da execução e fechamento de toda as tarefas, copie para pasta @./.plan/[XXXX]_[nome_dado_a_soliciação]  os arquivos implementation_plan.md, task.md e .plan/walkthrough.md do caminho base do Antigravity para a pasta de @./.plan/[XXXX]_[nome_dado_a_soliciação]  (certifique-se que o arquivo de task e walkhrough estão atualizado com as últimas alterações, refretindo o estado atual do projeto)

    2 - solicitação de autorização para execução
    Solicite revisão do plano de implementação e da lista de tasks antes de execução e implementação. Solicite revisão do usuário humano e autorização para continuar a implementação

---
    <instruções de implementação>

</planejamento>



<IMPORTANTE>

# ATENÇÃO AS INSTRUÇÕES ABAIXO:

## Siga TODAS as intruções de planejamento de entendimento planejamento
## siga TODAS as instruções de implamentação principalmente as seguintes instruções:
    ### 1 - copia dos arquivos de plano e task ao final da execução
    Ao final da execução e fechamento de toda as tarefas, copie para pasta @./.plan/<nome_dado_a_soliciação> os arquivos implementation_plan.md, task.md e .plan/walkthrough.md do caminho base do Antigravity para a pasta de @./.plan/<nome_dado_a_soliciação> (certifique-se que o arquivo de task e walkhrough estão atualizado com as últimas alterações, refretindo o estado atual do projeto)

    ### 2 - solicitação de autorização para execução
    Solicite revisão do plano de implementação e da lista de tasks antes de execução e implementação. Solicite revisão do usuário humano e autorização para continuar a implementação
</IMPORTANTE>
