# Builder Prompt

Use pnpm for all package operations.

- Install dependencies: `pnpm install`
- Run dev server: `pnpm dev`
- Prisma commands: `pnpm db:generate`, `pnpm db:push`, `pnpm exec prisma migrate dev`
- Verify before handoff: `python scripts/vibe-verify.py`

Secrets live in `.env.local` and must never be committed or printed in logs. If any Supabase service role key has been shared outside a secure channel, rotate it in Supabase before production use.

MUS priority order: FR-001 → FR-002 → FR-003 → FR-004 → FR-005 → FR-006.
