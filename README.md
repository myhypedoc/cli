# @hypedoc/cli

CLI for [Hype Doc](https://myhypedoc.com): log and track your wins from the terminal.

## Installation

```sh
# Run directly (no install needed)
npx @hypedoc/cli

# Install globally via npm
npm install -g @hypedoc/cli

# Homebrew
brew install myhypedoc/tap/hype

# Binary download
# See GitHub Releases for platform-specific binaries
```

Requires Node.js 24+ (for npm/npx).

## Quick Start

```sh
# 1. Authenticate (opens browser)
hype auth login

# 2. Log your first win
hype log "Shipped the new dashboard"

# 3. View your wins
hype wins
```

## Authentication

```sh
# Interactive login via browser (OAuth)
hype auth login

# Direct token entry (for CI/scripts)
hype auth token <your-api-token>

# Check auth status
hype auth status

# Log out
hype auth logout
```

Credentials are stored in `~/.hypedoc/config.json`.

## Commands

### Log a win

Run `hype log` with no arguments for an interactive experience, or pass options directly:

```sh
# Interactive mode (walks you through space, tags, and date)
hype log

# Direct mode
hype log "Shipped the new dashboard" --space work --tags impact,product
hype log "Gave a talk at the team offsite" --date 2026-02-15
```

| Flag | Description |
|------|-------------|
| `--space`, `-s` | Space name (e.g. "work", "personal") |
| `--tags`, `-t` | Comma-separated tags |
| `--date`, `-d` | Date (YYYY-MM-DD), defaults to today |

### Wins

```sh
# List wins
hype wins
hype wins --space work --last 7d
hype wins --tag impact --last 30d
hype wins --limit 5

# Show a specific win
hype wins show <id>

# Edit a win
hype wins edit <id> --body "Updated text" --tags newtag

# Delete a win
hype wins delete <id>
```

| Flag | Description |
|------|-------------|
| `--space`, `-s` | Filter by space name |
| `--tag`, `-t` | Filter by tag |
| `--last`, `-l` | Time window (e.g. `7d`, `2w`, `1m`) |
| `--limit`, `-n` | Max results (default: 20) |

Win IDs are shown as short prefixes in `hype wins` output. You can use the prefix or the full UUID.

### Spaces

```sh
# List spaces
hype spaces

# Create a space
hype spaces create "work" --emoji "💼"

# Rename a space (optionally change emoji)
hype spaces rename "work" "career" --emoji "🚀"

# Delete a space
hype spaces delete "old-space"
```

### Tags

```sh
# List tags
hype tags

# Rename a tag
hype tags rename "old-name" "new-name"

# Delete a tag (wins are kept, only the tag is removed)
hype tags delete "unused-tag"
```

## Configuration

Config file: `~/.hypedoc/config.json`

Environment variable overrides:

| Variable | Description |
|----------|-------------|
| `HYPEDOC_TOKEN` | API token (overrides config file) |
| `HYPEDOC_API_URL` | API base URL (overrides config file) |

## Error Handling

The CLI provides clear error messages for common scenarios:

- **401**: Authentication failed, run `hype auth login`
- **402**: Free plan win limit reached, upgrade at https://app.myhypedoc.com/billing
- **429**: Rate limited, wait and retry

## Development

```sh
mise run setup     # pnpm install
mise run dev       # tsc --watch
mise run build     # tsc
mise run test      # vitest run
mise run lint      # oxlint
mise run fmt       # oxfmt
```
