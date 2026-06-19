# AI Newsroom

The AI newsroom layer is provider-agnostic and stores the results of research, writing, and intelligence workflows in Prisma tables so the editorial team can review, audit, and reuse them.

## Components

- Research assistant sessions capture suggested sources, verification notes, contradiction flags, and credibility scoring.
- Writing assistance generates headline ideas, SEO titles, summaries, social copy, and language-aware rewrites.
- Content intelligence tracks duplicate stories, similarity signals, trending topics, and follow-up recommendations.

## Implementation

- `src/lib/ai.ts` contains the heuristic and provider-neutral logic.
- `/api/rest/ai/research`, `/api/rest/ai/writing`, and `/api/rest/ai/intelligence` expose the workflows to the UI.
- `src/app/(platform)/dashboard/ai/page.tsx` provides the newsroom-facing workbench.

## Operational notes

- The current implementation is intentionally lightweight so the provider layer can later swap to OpenAI, Anthropic, or internal models without changing the editorial UX.
- AI outputs should remain reviewable by editors and fact checkers before publication.
