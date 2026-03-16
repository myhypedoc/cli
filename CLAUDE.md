# Hype Doc CLI

TypeScript CLI for logging and tracking wins from the terminal.

## Tooling

- **Runtime**: Node.js 24 (managed via mise)
- **Package manager**: pnpm
- **Language**: TypeScript 5.9+ (`erasableSyntaxOnly`)
- **Testing**: Vitest
- **Linting**: oxlint
- **Formatting**: oxfmt
- **Pre-commit**: husky + lint-staged (runs oxlint + oxfmt on staged .ts files)

## Commands

```sh
mise run setup     # pnpm install
mise run dev       # tsc --watch
mise run build     # tsc
mise run test      # vitest run
mise run lint      # oxlint
mise run fmt       # oxfmt
```

## Architecture

```
src/
  index.ts              Entry point, Commander setup, shebang
  commands/
    auth.ts             Login (OAuth via browser), token, status, logout
    log.ts              Log a new win
    wins.ts             List/show/edit/delete wins
    spaces.ts           List/create/delete spaces
    tags.ts             List/rename/delete tags
  lib/
    api-client.ts       HTTP client using native fetch, error classes
    config.ts           ~/.hypedoc/config.json read/write, env var overrides
    formatters.ts       Terminal output formatting with chalk
```

## Distribution

- **npm**: `@hypedoc/cli` package with `bin.hype`
- **Binary**: Node.js SEA via `scripts/build-binary.ts`, built in CI
- **Homebrew**: `Formula/hype.rb` tap formula

## Conventions

- ES modules throughout (`"type": "module"`)
- `.js` extensions in imports (Node.js module resolution)
- Native `fetch()` for HTTP (no axios/node-fetch)
- Config stored at `~/.hypedoc/config.json` with env var overrides (`HYPEDOC_TOKEN`, `HYPEDOC_API_URL`)

## Writing Style

- Never use emdashes. Use commas, periods, colons, or semicolons instead.
- Keep copy concise and direct.

## Bugs or Issues

When I report a bug or issue, don't start by trying to fix it. Instead, start by writing a test that reproduces the bug. Then, have subagents try to fix the bug and prove it with a passing test.
