# Documentation

From logging in to running in Codex and Claude Code — about five minutes.

## Getting started

### Step 1: Log in

Click **Log in** in the top-right of the home page to reach the console.

### Step 2: Create an API key

Once logged in, go to **Console → API Keys** and click **Create key**.

- Give the key a name you'll recognise later, such as `laptop-codex` or `server-claude`
- Pick a group. Groups differ in upstream providers and rate multipliers — compare them in **Model Plaza**
- The key is shown **in full exactly once**. Copy it immediately; after you close the dialog only the first few characters remain, and a lost key can only be replaced by creating a new one

Keys look like a long string starting with `sk-`. **Treat one as you would your account password**: never commit it to Git, paste it into a chat, or push it to a public repository.

### Step 3: Note your endpoint

```
{{baseUrl}}
```

Every client below points at this address. The two clients want it in different shapes:

| Client | Address to use |
| --- | --- |
| Codex CLI | `{{baseUrl}}/v1` — **with `/v1`** |
| Claude Code | `{{baseUrl}}` — **without `/v1`** |

Getting these the wrong way round produces a 404. It is by far the most common mistake.

---

## Codex CLI

Edit `~/.codex/config.toml` (`%USERPROFILE%\.codex\config.toml` on Windows).

Pick **one** of the two options below. They differ only in where the key is stored.

### Option 1: Key in an environment variable (recommended)

The config file holds only the variable's *name*; the key itself stays in your environment. That means the config file is safe to back up, sync, or even commit to a dotfiles repository.

`~/.codex/config.toml`:

```toml
model_provider = "{{providerKey}}"

[model_providers.{{providerKey}}]
name = "{{brand}}"
base_url = "{{baseUrl}}/v1"
wire_api = "responses"
# This is the NAME of an environment variable, not the key itself
env_key = "{{envKey}}"
requires_openai_auth = false
```

Then set that variable in your shell:

```bash
# macOS / Linux
export {{envKey}}="sk-your-key"
```

```powershell
# Windows PowerShell
$env:{{envKey}}="sk-your-key"
```

```
:: Windows Command Prompt
set {{envKey}}=sk-your-key
```

These apply to the current terminal only. To make them permanent, add them to `~/.zshrc` or `~/.bashrc`, or use **System Properties → Environment Variables** on Windows.

### Option 2: Key written directly into the config file

Simpler, at the cost of leaving **the key in plain text on disk**. Keep that in mind when backing up or syncing the file.

`~/.codex/config.toml`:

```toml
model_provider = "{{providerKey}}"

[model_providers.{{providerKey}}]
name = "{{brand}}"
base_url = "{{baseUrl}}/v1"
wire_api = "responses"

[model_providers.{{providerKey}}.http_headers]
Authorization = "Bearer sk-your-key"
```

> Don't combine the two. With both `env_key` and `http_headers.Authorization` present, which one wins depends on your Codex version — a reliable way to end up wondering why an edit had no effect.

### Verify

```bash
codex "In one sentence, which model are you?"
```

A reply means you're connected.

---

## Claude Code

Again, pick one of two options.

Note that the address here is **without `/v1`** — Claude Code appends the rest of the path itself.

### Option 1: Environment variables

```bash
# macOS / Linux
export ANTHROPIC_BASE_URL="{{baseUrl}}"
export ANTHROPIC_AUTH_TOKEN="sk-your-key"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

```powershell
# Windows PowerShell
$env:ANTHROPIC_BASE_URL="{{baseUrl}}"
$env:ANTHROPIC_AUTH_TOKEN="sk-your-key"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

```
:: Windows Command Prompt
set ANTHROPIC_BASE_URL={{baseUrl}}
set ANTHROPIC_AUTH_TOKEN=sk-your-key
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` turns off telemetry and background requests unrelated to this service, avoiding incidental calls.

### Option 2: Configuration file

Edit `~/.claude/settings.json` (`%USERPROFILE%\.claude\settings.json` on Windows), creating it if it doesn't exist:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "env": {
    "ANTHROPIC_BASE_URL": "{{baseUrl}}",
    "ANTHROPIC_AUTH_TOKEN": "sk-your-key",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

As above, the key is stored in plain text here.

> Environment variables take precedence over `settings.json`. If an edit to the file seems to have no effect, check whether a stale `ANTHROPIC_BASE_URL` is still set in your shell.

### Verify

```bash
claude "In one sentence, which model are you?"
```

---

## Troubleshooting

### 401 / Unauthorized

- The key was copied incompletely, or picked up stray whitespace — copy it again in full
- The key was deleted or disabled; check **Console → API Keys**
- Your balance or quota is exhausted
- Using option 1 for Codex: the variable isn't set. Run `echo ${{envKey}}` to check. **A new terminal window needs it set again.**

### 404 / Not Found

Nine times out of ten the `/v1` suffix is on the wrong one:

- Codex `base_url` **needs** `/v1`
- Claude Code `ANTHROPIC_BASE_URL` **must not** have `/v1`

### Model not found

The model name isn't available in your group. Check **Model Plaza** for the exact names that group serves — they must match character for character.

### Changes have no effect

- Environment variable changes only apply to **newly opened** terminals
- Check you haven't used both configuration options at once (`env_key` *and* `http_headers`)
- Confirm you edited `~/.codex/config.toml` and not a same-named file elsewhere

### Checking usage for a key

**Key lookup** in the footer takes a key and reports its usage without logging in. Once logged in, **Console → Usage** has the full breakdown.
