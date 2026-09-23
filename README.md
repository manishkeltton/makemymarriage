# MakeMyMarriage

A modular-monolith wedding planning application with a public marketing homepage. Authentication and wedding management remain scaffold placeholders. Existing design documents in `docs/` are the architecture baseline.

## Local setup

1. Install/use the Node version in `.nvmrc` (Node 24 LTS).
2. Install pnpm 11.27.1: `npm install --global pnpm@11.27.1`.
3. Run `pnpm install --frozen-lockfile`.
4. Optionally copy `.env.example` to `.env.local` and supply development settings. The placeholder pages and production build do not need MongoDB credentials.
5. Run `pnpm dev` and open http://localhost:3000.

The repository pins pnpm in `package.json`. TypeScript 6.0.2 and ESLint 9.39.5 are retained for compatibility with Next.js's bundled lint plugins; the current newer major releases do not satisfy those plugins' peer ranges. `pnpm-workspace.yaml` is the authoritative pnpm configuration for exact versions, engine enforcement and explicit native dependency build permissions and does not introduce a monorepo. Use pnpm exclusively and commit `pnpm-lock.yaml`. Do not use production database credentials locally.

## Commands

| Command             | Purpose                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `pnpm dev`          | Development server                                                |
| `pnpm build`        | Production build                                                  |
| `pnpm start`        | Serve the production build                                        |
| `pnpm typecheck`    | TypeScript checking                                               |
| `pnpm lint`         | ESLint and import boundaries                                      |
| `pnpm test`         | Foundation unit tests                                             |
| `pnpm test:watch`   | Interactive unit tests                                            |
| `pnpm format:check` | Check formatting                                                  |
| `pnpm format`       | Format application/configuration files; excludes design documents |

Lint fails on warnings as well as errors. Run lint and type checking explicitly; do not rely on a production build to run lint.

## Route verification

- `/`: Stitch-based public homepage with responsive planning previews.
- `/?lang=hi`: Hindi homepage; the header switches between English and Hindi.
- `/login`: authentication route-group placeholder; no login behavior.
- `/app`: application route-group placeholder; intentionally contains no private information or authentication claim.
- `/w/example`: public-wedding route-group placeholder; no wedding lookup.

`src/app/api/v1/` reserves product REST routes. `src/app/api/internal/` reserves scheduler/internal routes. Both currently return 404 because no product or internal endpoints are implemented. The future dispatcher belongs at `/api/internal/jobs/email-dispatch`, outside `/api/v1`.

## Architecture conventions

Route Handler → Zod validation → authentication → authorization → application service → repository → Mongoose.

- `src/app`: routing, layouts, page composition and HTTP adapters only.
- `src/modules`: domain-owned schemas, services, repositories, models and feature components, added when the feature is implemented.
- `src/shared`: domain-independent configuration, HTTP, logging and persistence infrastructure.
- Server Components are the default. Interactive components use REST; Server Components call services directly, never HTTP back into this application.
- Routes/components may not import Mongoose, models, repositories, or the database utility. ESLint restricts conventional direct imports; it does not prove the safety of indirect imports or future module dependencies. Server infrastructure uses `server-only`.
- Shared code must not depend on modules. Cross-module calls use narrow service/query functions, never another module's repository/model. Avoid mixed server/client barrel exports.
- Authentication/access context must come from trusted server code and remain request-local. Services enforce resource policies even when called from Server Components. Layouts are not authorization boundaries.
- Every wedding-owned repository operation requires explicit `weddingId`; validate nested parent IDs, event scope and same-wedding references. Apply access filtering before pagination/counts/aggregation.
- Zod owns input validation, Mongoose owns persistence validation, services own business invariants, DTOs own public output. Infer types when possible; do not duplicate interfaces mechanically.
- Money uses integer paise; payments are separate documents; RSVP is embedded in households; no subtask hierarchy.

Planned ownership: `auth`, `users`, `weddings`, `team`, `permissions` (pure policies), `events`, `tasks`, `guests`, `invitations` (guest capability links), `vendors`, `expenses`, `media`, `documents`, `gallery`, `wedding-site`, `guestbook`, `emergency`, `notifications`, `activity`. Team invitations belong to `team`. Billing/platform administration are later milestones. Empty feature directories and fake services are deliberately absent.

## Infrastructure

Environment validation is lazy and server-only. `getAppEnv()` validates an HTTP(S) origin without credentials, a path, query or fragment, and normalizes its trailing slash. Localhost is a development/test fallback only; production must supply `APP_ORIGIN` when that configuration is used. `getLoggingEnv()` independently validates log level so logging does not depend on origin/database configuration; `getDatabaseEnv()` validates database settings only when persistence is used. Errors contain variable names, never values. There are no public environment variables.

`connectDatabase()` reuses the Mongoose connection and concurrent connection promise across hot reloads, resets failed attempts, and never connects at import time. Production indexes must be managed explicitly (`autoIndex: false`). No database call is made by scaffold routes. Future backend handlers must explicitly select the Node.js runtime.

HTTP helpers preserve the design document's success/error envelopes and empty 204 responses. `withRequest()` adds a validated/generated `X-Request-Id`, safe logging and conservative `no-store` headers. Use a literal route template, never a token-bearing request URL. It deliberately does not implement validation/auth/permissions for callers. `normalizeError()` maps a caught error once; the wrapper uses the same application code in its response and log. `errorResponse()` accepts this normalized `AppError`. Unknown errors are sanitized; only explicit `AppError` messages/details are public. When implementing handlers, map malformed JSON/invalid IDs and persistence errors to documented codes at their respective boundaries.

The logger reads validated configuration and emits allowlisted JSON fields. Unexpected failures include a fixed error category (for example `type` or `non-error`) plus request ID and route template. Raw exception names, messages, stacks and causes are never serialized. This deliberately limits diagnostics; add narrowly reviewed safe context at actual integration boundaries rather than dumping provider errors. Never put secrets into event names, route templates, IDs or explicit public errors. No external logging provider is installed.

English/Hindi homepage messages use next-intl with an explicit `lang` query parameter. The complete homepage subtree carries its language attribute; the root remains English for the other scaffold routes. User/site locale preferences belong to later features. No locale cookies or global provider stack is introduced. The homepage uses scoped CSS Modules and locally hosted Plus Jakarta Sans, with its license included. Builds require no font downloads.

The root `noindex` setting is a scaffold default, not the final SEO policy. Marketing and public-wedding indexing must be set deliberately before launch. Likewise, `no-store` currently protects all wrapped HTTP responses; public caching will require an explicit publication/visibility invalidation design. Do not cache authenticated or token-specific results across requests.

Homepage components live in `src/components/marketing/`; sample numerical fixtures live in `demo-data.ts`, and copy lives in the English/Hindi `Home` namespaces. Wedding data and social-proof statistics are explicitly labelled as illustrative. Replace or remove sample customer counts and ratings before public launch. Ceremony selection and mobile navigation are local UI interactions. All account calls to action currently lead to `/login`; signup is not implemented. Gallery, guestbook, livestream, pricing and out-of-scope logistics are deferred. The homepage is server-rendered on demand because it reads the language query parameter. Other feature pages still need localization. Placeholder workspace routes remain public because they contain no private data; they do not demonstrate authentication or tenant isolation.

## Tests and later infrastructure

Vitest tests cover environment redaction, REST envelopes, correlation IDs, logging redaction, boundary schemas and translation-key parity. The `server-only` marker is mocked only inside applicable tests so server utilities can run in Vitest's Node environment.

Add real MongoDB replica-set integration tests with the first persistence feature, HTTP/tenant-isolation tests with endpoints, and Playwright when browser journeys exist. Current tests do not claim database connectivity or authentication coverage.

`scripts/migrations/` and `scripts/seed/` reserve controlled database scripts. No migration framework, seed data or bootstrap account exists yet. With the first models, create required indexes explicitly before releasing their endpoints. Keep migrations repeatable where practical, version-controlled and staging-tested. Do not migrate, seed, drop indexes or create default accounts on application startup. Development seeds must use synthetic non-production data.

## Deferred decisions

Before dependent features: approve queued reset/invite-token delivery under the hash-only rule; permission edge cases and assignee lookup; last-Admin behavior; wedding date/timezone semantics; payment-total constraints; draft/published website behavior; guest-token rotation; media limits and deletion/retention. Hosting remains standard Node Next.js with no provider-specific dependencies. R2, Resend, scheduler and billing integrations are not implemented.
