# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured yet.

## Stack

- **Next.js 16.2.2** + **React 19.2.4** — App Router. This is a newer version than training data; always check `node_modules/next/dist/docs/` before writing Next.js-specific code.
- **Tailwind CSS v4** — PostCSS-based, no `tailwind.config.js`. Config lives in `globals.css`.
- **shadcn/ui** — components live in `src/components/ui/`. Add new ones via `npx shadcn add <component>`.
- **Supabase** (`@supabase/ssr`) — auth and database. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **@tanstack/react-table**, **recharts**, **@dnd-kit**, **zod**, **sonner**, **vaul** — already installed.
- Path alias: `@/` → `src/`

## Architecture

### Route structure

```
src/app/
  layout.tsx              # Root layout: fonts, TooltipProvider
  page.tsx                # Root redirect (likely → /admin/dashboard or /auth/login)
  auth/login/page.tsx     # Public login page
  admin/
    layout.tsx            # Admin shell: SidebarProvider + AppSidebar + SiteHeader
    dashboard/page.tsx
    inventory/page.tsx
    products/page.tsx
```

### Auth flow

`src/lib/supabase/middleware.ts` → `updateSession()` runs on every request. It calls `supabase.auth.getClaims()` and redirects unauthenticated users to `/auth/login`. Any route under `/admin` is protected by this middleware. The middleware must always return the `supabaseResponse` object unchanged to keep cookies in sync.

Three Supabase client factories:
- `src/lib/supabase/client.ts` — browser (Client Components)
- `src/lib/supabase/server.ts` — RSC / Server Actions
- `src/lib/supabase/middleware.ts` — middleware only; never reuse a single instance across requests (Fluid compute)

### Admin layout composition

`AppSidebar` (`src/components/app-sidebar.tsx`) composes four nav sections:
- `NavMain` — primary links (Dashboard, Inventory, Products, …)
- `NavDocuments` — document shortcuts
- `NavSecondary` — Settings, Help, Search (pinned to bottom)
- `NavUser` — user avatar/menu in the footer

The sidebar width and header height are set as CSS custom properties on `SidebarProvider`:
- `--sidebar-width: calc(var(--spacing) * 72)`
- `--header-height: calc(var(--spacing) * 12)`

### SidebarMenuButton `render` prop

In this version of shadcn's sidebar, use `render={<Link href="..." />}` (not `asChild`) to wrap menu buttons with Next.js `<Link>`.
