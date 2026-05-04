# Builder Prompt

Use pnpm for all package operations.

## Sub-Agent Model Routing

Use `oauth-router` as the provider for coding-agent sub-agents.

Follow `docs/Model_Routing_Strategy.md`:
- Architect: `oauth-router/gpt-5.5` for serious planning, `oauth-router/gpt-5.4` for straightforward planning; avoid mini.
- Coder: `oauth-router/gpt-5.4` by default, `oauth-router/gpt-5.5` for complex/risky/cross-file work, `oauth-router/gpt-5.4-mini` only for small explicit isolated edits.
- Designer: `oauth-router/gpt-5.4` by default, `oauth-router/gpt-5.5` for deep interaction/product design, mini only for trivial styling/copy tweaks.
- Reviewer: `oauth-router/gpt-5.5` for final/deep review, `oauth-router/gpt-5.4` for normal review, mini only for typo/format checks.

Before any sub-agent dispatch or model override, run and surface `pi --list-models`.
Escalate immediately if a task becomes vague, risky, cross-file, architecture-heavy, debugging-heavy, security-sensitive, or regression-sensitive.

- Install dependencies: `pnpm install`
- Run dev server: `pnpm dev`
- Prisma commands: `pnpm db:generate`, `pnpm db:push`, `pnpm exec prisma migrate dev`
- Verify before handoff: `python scripts/vibe-verify.py`

Secrets live in `.env.local` and must never be committed or printed in logs. If any Supabase service role key has been shared outside a secure channel, rotate it in Supabase before production use.

MUS priority order: FR-001 → FR-002 → FR-003 → FR-004 → FR-005 → FR-006.
