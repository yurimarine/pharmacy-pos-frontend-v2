# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Multi-pharmacy point-of-sale system built with Next.js 16 App Router, Supabase, and Tailwind CSS v4. Covers inventory management, purchase orders, warehouse receipts, stock transfers, POS terminal with till sessions, and role-based access (admin / pharmacist / pharmacy_assistant).

@AGENTS.md
@docs/context.md
@docs/architecture.md
@docs/style-guide.md
@docs/pitfalls.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build (also runs TypeScript type checking)
npm run lint     # Run ESLint
npx shadcn add <component>   # Add a new shadcn/ui component to src/components/ui/
```

No test suite is configured yet. `npm run build` is the primary verification step.

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
