# Builder Prompt

Use pnpm for all package operations.

## Sub-Agent Model Routing

Use `oauth-router` as the provider for coding-agent sub-agents.

Follow `docs/Model_Routing_Strategy.md`:
- Whenever docs say GPT-5.4, use `oauth-router/gpt-5.4` with `thinking: high`.
- Whenever docs say GPT-5.4 Mini, use `oauth-router/gpt-5.4-mini` with `thinking: high`.
- GPT-5.5 may use `thinking: low`, `medium`, or `high` based on risk.
- Architect: GPT-5.5 High for serious/unclear/security architecture, GPT-5.5 Medium for bounded complex planning, GPT-5.4 High for normal planning; avoid mini.
- Coder: GPT-5.4 High by default, GPT-5.5 High for complex/risky/cross-file/security work, GPT-5.5 Medium for complex bounded implementation, GPT-5.5 Low for clear execution needing senior context, GPT-5.4 Mini High only for small explicit isolated edits.
- Designer: GPT-5.4 High by default, GPT-5.5 Medium/High for product-heavy or interaction-heavy design, GPT-5.4 Mini High for small styling/copy tweaks.
- Reviewer: GPT-5.5 High for final/deep review, GPT-5.5 Medium for important bounded review, GPT-5.4 High for normal review, GPT-5.4 Mini High only for typo/format checks.

Before any sub-agent dispatch or model override, run and surface `pi --list-models`.
Escalate immediately if a task becomes vague, risky, cross-file, architecture-heavy, debugging-heavy, security-sensitive, or regression-sensitive.

- Install dependencies: `pnpm install`
- Run dev server: `pnpm dev`
- Prisma commands: `pnpm db:generate`, `pnpm db:push`, `pnpm exec prisma migrate dev`
- Verify before handoff: `python scripts/vibe-verify.py`

Secrets live in `.env.local` and must never be committed or printed in logs. If any Supabase service role key has been shared outside a secure channel, rotate it in Supabase before production use.

MUS priority order: FR-001 → FR-002 → FR-003 → FR-004 → FR-005 → FR-006.
