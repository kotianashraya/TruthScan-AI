# Deployment

## Local development

```bash
npm install
npm run dev
```

The root npm scripts delegate to the `frontend` workspace. Vite listens on port
3000 and binds to all interfaces, preserving the original development command.

## Firebase

Firebase deployment artifacts live in `backend/`. The client Firebase project
configuration is intentionally unchanged in `frontend/src/firebase/index.ts`.
Do not deploy rules or configure Functions until the runtime Firebase project
and the backend Firebase configuration have been intentionally reconciled.
