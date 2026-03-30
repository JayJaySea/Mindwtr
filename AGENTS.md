# AGENTS.md

Repository guidance for coding agents working in Mindwtr.

## Project shape

- Monorepo managed with Bun workspaces.
- `apps/desktop`: Tauri + React + Vite desktop app.
- `apps/mobile`: Expo + React Native mobile app.
- `packages/core`: shared store, sync, storage, and domain logic.
- `apps/mcp-server`: local MCP server for the SQLite database.

## Working rules

- Run commands from the repository root unless a task clearly targets one workspace.
- Prefer focused changes over broad rewrites.
- Preserve existing user changes; do not revert unrelated work.
- Keep commits scoped and use Conventional Commit prefixes when possible.
- Favor `rg`/`rg --files` for search.

## Common commands

```bash
bun install
bun desktop:dev
bun desktop:web
bun run --filter mindwtr lint
bun run --filter mindwtr test
bun run --filter @mindwtr/core test
bun mobile:start
bun run --filter mobile test
```

## Code style

- TypeScript first.
- Match file-local formatting conventions.
  - `packages/core` and desktop code usually use 4 spaces.
  - Mobile code usually uses 2 spaces.
- Prefer functional React components and hooks.
- Keep imports grouped logically: external, workspace/internal, then relative.
- Add comments only when the logic is not obvious from the code itself.

## Testing expectations

- Run the smallest relevant test/lint commands while iterating.
- Add or update regression tests when fixing bugs in shared logic, sync, or store behavior.
- For UI changes that are hard to automate, document what was validated manually.

## Safety

- Treat sync, storage, and deletion flows as high-risk paths.
- Do not introduce silent data loss or hidden fallback behavior.
- Sanitize sensitive values in logs and user-facing error strings.
