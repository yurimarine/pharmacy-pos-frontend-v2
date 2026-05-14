# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
```

No test suite is configured yet.

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
