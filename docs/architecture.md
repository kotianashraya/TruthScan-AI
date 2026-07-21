# Architecture

TruthScan AI is a React 19 single-page application built with Vite, TypeScript,
and Tailwind CSS v4. The existing landing experience remains a single `App.tsx`
composition; no routes were added because the current product has no route-level
pages.

## Boundaries

- `frontend/`: browser application and Firebase client initialization.
- `backend/`: Firebase deployment artifacts and future Functions domain modules.
- `ai/`: future prompts, datasets, models, and experiments.
- `docs/`: operational and architecture documentation.

## Frontend conventions

Existing UI components remain in `frontend/src/components`. New route-level
features can use `pages`, reusable logic can use `hooks` and `services`, and
domain data contracts belong in `models` or `types`.
