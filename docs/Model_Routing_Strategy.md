# Coding Agent Sub-Agent Model Routing Strategy

## Provider

Use `oauth-router` for all sub-agent model dispatches.

Available preferred model IDs:

- `oauth-router/gpt-5.5`
- `oauth-router/gpt-5.4`
- `oauth-router/gpt-5.4-mini`

Before any sub-agent dispatch or model override, run and surface `pi --list-models` to confirm availability.

## Reasoning-Effort Rule

When this project says:

- **GPT-5.4**, it means **GPT-5.4 High**: `model: oauth-router/gpt-5.4`, `thinking: high`.
- **GPT-5.4 Mini**, it means **GPT-5.4 Mini High**: `model: oauth-router/gpt-5.4-mini`, `thinking: high`.
- **GPT-5.5** may be used at `low`, `medium`, or `high` depending on task difficulty.

## General Rule of Thumb

- Use **GPT-5.5 High** for uncertain, expensive, risky, security-sensitive, regression-sensitive, architecture-heavy, or high-judgment planning/review.
- Use **GPT-5.5 Medium** for serious but bounded planning, complex bounded implementation, non-trivial debugging, product/design judgment, or important moderate-risk review.
- Use **GPT-5.5 Low** when the plan is already clear but the task still benefits from senior-level context awareness and correctness.
- Use **GPT-5.4 High** for the default serious workhorse: normal-to-serious planning plus execution where the task is understandable and not deeply uncertain.
- Use **GPT-5.4 Mini High** for fast execution when the task is small, isolated, explicit, and already well specified.

## Model Tiers

### GPT-5.5 — Senior Brain

Use `oauth-router/gpt-5.5` when the task requires judgment:

- Complex reasoning and architecture decisions
- Database planning and API structure
- Security-sensitive logic
- Difficult debugging and regression detection
- Large refactors and cross-file changes
- Unclear requirements or missing context inference
- Final deep review

Effort routing:

| Effort | Use For |
| --- | --- |
| High | Major architecture, security-sensitive logic, hard debugging, regression hunting, cross-file refactors, vague tasks, final deep review |
| Medium | Serious planning, complex but bounded implementation, non-trivial debugging, design/product judgment, important bounded review |
| Low | Clear execution, targeted fixes, applying known patterns, straightforward implementation that still needs strong context awareness |

### GPT-5.4 High — Default Serious Workhorse

Use `oauth-router/gpt-5.4` with `thinking: high` for solid planning and execution:

- Normal coding and implementation
- Normal planning and straightforward architecture
- UI logic, component structure, and design-system implementation
- Routine debugging and review
- Moderate-sized changes with understandable codebase context
- Tasks that need plan-and-code in one pass but not senior-level uncertainty handling

### GPT-5.4 Mini High — Fast Junior Implementer

Use `oauth-router/gpt-5.4-mini` with `thinking: high` only for small, explicit, isolated tasks:

- Simple edits and boilerplate
- Formatting, docs cleanup, renaming
- Small components with precise instructions
- Simple tests
- Basic Tailwind/style tweaks
- Repetitive implementation
- Applying an already-written plan

Do **not** use GPT-5.4 Mini High for vague work, deep debugging, major refactors, architecture, hidden regression checks, security-sensitive changes, or anything requiring strong judgment/inference.

## Role Routing

### Architect

- Use **GPT-5.5 High** for system design, database planning, API structure, security-sensitive decisions, major refactors, unclear project direction, or anything affecting long-term maintainability.
- Use **GPT-5.5 Medium** for serious but bounded architecture planning.
- Use **GPT-5.4 High** for normal planning and straightforward architecture.
- Avoid **GPT-5.4 Mini High** for architecture.

### Coder

- Use **GPT-5.4 High** as the default coder.
- Use **GPT-5.5 High** when code is complex, risky, deeply connected across files, security-sensitive, or likely to cause regressions.
- Use **GPT-5.5 Medium** when implementation is complex but the plan is mostly clear.
- Use **GPT-5.5 Low** when the plan is very clear but the task still needs strong contextual awareness.
- Use **GPT-5.4 Mini High** only for small, explicit, isolated coding tasks.

### Designer

- Use **GPT-5.4 High** by default for UI/UX layout, component structure, design systems, and frontend logic.
- Use **GPT-5.5 Medium** or **GPT-5.5 High** when the design problem needs deep product thinking, complex interaction logic, UX tradeoffs, or accessibility judgment.
- Use **GPT-5.4 Mini High** for simple style changes, spacing, copy updates, basic Tailwind edits, and clearly defined UI tweaks.

### Reviewer

- Use **GPT-5.5 High** for serious/final review: regressions, edge cases, security issues, architecture violations, broken assumptions, and deep correctness checks.
- Use **GPT-5.5 Medium** for important review where the scope is bounded.
- Use **GPT-5.4 High** for normal review.
- Use **GPT-5.4 Mini High** only for basic formatting checks, typo checks, or obvious surface-level issues.

## Escalation Rule

Start with the cheapest capable model, then escalate immediately if the task becomes vague, risky, cross-file, architecture-heavy, debugging-heavy, security-sensitive, or regression-sensitive.

## Session Defaults

For the WalkGraph orchestration session:

- Design architects: `oauth-router/gpt-5.5` with `thinking: high` for serious planning; `thinking: medium` for bounded planning.
- Design/UI tasks: `oauth-router/gpt-5.4` with `thinking: high` by default.
- Build coders: `oauth-router/gpt-5.4` with `thinking: high` by default.
- Complex build/security/auth/routing/offline tasks: `oauth-router/gpt-5.5` with `thinking: medium` or `high` based on risk.
- Clear senior-context execution: `oauth-router/gpt-5.5` with `thinking: low`.
- Simple explicit edits: `oauth-router/gpt-5.4-mini` with `thinking: high`.
- Final/deep review: `oauth-router/gpt-5.5` with `thinking: high`.

## Mental Model

- **GPT-5.5** is the senior engineer/architect/reviewer. Adjust effort: low for clear execution, medium for serious bounded work, high for uncertainty, architecture, debugging, and review.
- **GPT-5.4 High** is the reliable mid-to-senior serious builder.
- **GPT-5.4 Mini High** is the fast junior implementer: excellent when the task is specific, dangerous when the task is vague.
