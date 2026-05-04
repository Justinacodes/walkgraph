# Coding Agent Sub-Agent Model Routing Strategy

## Provider

Use `oauth-router` for all sub-agent model dispatches.

Available preferred model IDs:

- `oauth-router/gpt-5.5`
- `oauth-router/gpt-5.4`
- `oauth-router/gpt-5.4-mini`

Before any sub-agent dispatch or model override, run and surface `pi --list-models` to confirm availability.

## Model Tiers

### GPT-5.5 — Senior Brain
Use `oauth-router/gpt-5.5` for tasks requiring judgment:

- Complex reasoning and architecture decisions
- Database planning and API structure
- Difficult debugging and regression detection
- Security review and authorization logic
- Large refactors and cross-file changes
- Ambiguous tasks where missing context must be inferred

### GPT-5.4 — Default Workhorse
Use `oauth-router/gpt-5.4` for solid execution:

- Normal coding and implementation
- Planning and UI logic
- Routine debugging and review
- General feature execution
- Component structure and frontend logic

### GPT-5.4 Mini — Fast Junior Implementer
Use `oauth-router/gpt-5.4-mini` only for small, explicit, isolated tasks:

- Simple edits and boilerplate
- Formatting, docs cleanup, renaming
- Small components with precise instructions
- Basic Tailwind/style tweaks
- Repetitive implementation

Do **not** use GPT-5.4 Mini for vague work, deep debugging, major refactors, architecture, hidden regression checks, or anything requiring strong judgment.

## Role Routing

| Role | Default | Escalate To | Mini Allowed For |
| --- | --- | --- | --- |
| Architect | `oauth-router/gpt-5.5` for serious planning; `oauth-router/gpt-5.4` for straightforward planning | `oauth-router/gpt-5.5` | Avoid mini |
| Coder | `oauth-router/gpt-5.4` | `oauth-router/gpt-5.5` for complex/risky/cross-file work | Small, explicit, isolated coding tasks |
| Designer | `oauth-router/gpt-5.4` | `oauth-router/gpt-5.5` for deep product/interaction design | Simple style, spacing, copy, basic Tailwind tweaks |
| Reviewer | `oauth-router/gpt-5.5` for final/deep review; `oauth-router/gpt-5.4` for normal review | `oauth-router/gpt-5.5` | Basic formatting/typo/surface checks only |

## Escalation Rule

Start with the cheapest capable model, then escalate immediately if the task becomes vague, risky, cross-file, architecture-heavy, debugging-heavy, security-sensitive, or regression-sensitive.

## Session Defaults

For the WalkGraph orchestration session:

- Design architects: `oauth-router/gpt-5.5`
- Design/UI tasks: `oauth-router/gpt-5.4`
- Build coders: `oauth-router/gpt-5.4` by default
- Complex build/security/auth tasks: `oauth-router/gpt-5.5`
- Final/deep review: `oauth-router/gpt-5.5`
