## Model Selection

- **Haiku** — use `model: "haiku"` when spawning Explore subagents for read-only searches, file lookups, or any pure codebase exploration with no writes.
- **Sonnet** — use for all regular work: coding, planning, responding, analysis. This is the session default.
- **Opus** — before spawning any Opus-tier subagent or escalating reasoning complexity to Opus, ask the user first: _"This looks like it may benefit from Opus. Want me to use it?"_ Do not use Opus without explicit confirmation.

## Stack

- **Next.js 16.2.2** + **React 19.2.4** — App Router. This is a newer version than training data; always check `node_modules/next/dist/docs/` before writing Next.js-specific code.
- **Tailwind CSS v4** — PostCSS-based, no `tailwind.config.js`. Config lives in `globals.css`.
- **shadcn/ui** — components live in `src/components/ui/`. Add new ones via `npx shadcn add <component>`.
- **Supabase** (`@supabase/ssr`) — auth and database. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **@tanstack/react-table**, **recharts**, **@dnd-kit**, **zod**, **sonner**, **vaul**, **use-debounce** — already installed.
- Path alias: `@/` → `src/`
