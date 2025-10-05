# Agent Guidelines

## Commands

- **Build**: `pnpm run build` (runs `remix vite:build`)
- **Lint**: `pnpm run lint` (app + convex + prettier) or `pnpm run lint:fix` to auto-fix
- **Typecheck**: `pnpm typecheck`
- **Test all**: `pnpm test` (runs vitest)
- **Test single file**: `pnpm test <path>` (e.g., `pnpm test convex/messages.test.ts`)
- **Dev**: `pnpm run dev` (in one terminal) + `npx convex dev` (in another)

## Code Style

- **Imports**: Use `~/` for app paths, `@convex/` for convex paths. Prefer `import type` for types (enforced by eslint)
- **Formatting**: Prettier with 120 char width, single quotes (except convex files use double quotes)
- **Types**: Use strict TypeScript, no unused vars (prefix with `_` if needed), `verbatimModuleSyntax: true`
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Errors**: Throw `ConvexError` for Convex functions, standard `Error` elsewhere
- **Env vars**: Use `globalThis.process.env` not `process.env` (eslint enforced)
- **Semis**: Required (enforced by eslint)

## Convex-Specific (see .cursor/rules/convex_rules.mdc for full details)

- Always use new function syntax with args/returns validators (e.g., `query({ args: {...}, returns: v.null(), handler: async (ctx, args) => {...} })`)
- Use `internalQuery/Mutation/Action` for private functions, `query/mutation/action` for public
- Use `v.null()` when returning null, `v.int64()` for bigints, `v.id(tableName)` for IDs
- Import validators from `convex/values`, functions from `./_generated/server`, api from `./_generated/api`
- Define schema in `convex/schema.ts` with proper indexes (name pattern: `by_field1_and_field2`)
