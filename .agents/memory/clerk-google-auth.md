---
name: Clerk Google Auth
description: How Google authentication is wired into the StitchTrack app — manager SSO via Clerk, chef email/password unchanged.
---

## What was added

Clerk (Replit-managed) provides Google OAuth for the manager role. Each Google account maps to exactly one workspace, enforced by a `clerk_user_id` column on the `workspaces` table.

**Why:** The user wanted isolated company data per Google account instead of shared email/password workspaces.

**How to apply:** Any backend route that needs manager-only access should use the `requireClerkAuth` middleware in `routes/workspace.ts`. Chef routes stay unchanged (join-code + email/password).

## Architecture

- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk FAPI proxy (production-only)
- `artifacts/api-server/src/app.ts` — mounts `clerkProxyMiddleware` + `clerkMiddleware`
- `artifacts/api-server/src/routes/workspace.ts` — two new routes: `GET /workspace/my` and `POST /workspace/setup-google`, both protected by `requireClerkAuth`
- `artifacts/api-server/src/index.ts` — migration adds `clerk_user_id` column + index on `workspaces`
- `artifacts/chef-track/app/_layout.tsx` — wraps app in `<ClerkProvider>` + `<ClerkLoaded>`; `ClerkTokenSync` component wires `getToken()` into `setAuthTokenGetter`
- `artifacts/chef-track/lib/api.ts` — `setAuthTokenGetter` sets an async getter; every `request()` call attaches `Authorization: Bearer <token>` when getter is set
- `artifacts/chef-track/app/login.tsx` — manager tab shows Google SSO button (`useSSO` + `startSSOFlow`); chef tab unchanged
- `artifacts/chef-track/app/setup.tsx` — post-Google setup asks for workshop name only (no password); pre-fills manager name from `useUser()`
- `artifacts/chef-track/contexts/AppContext.tsx` — `loginWithGoogle()` calls `GET /workspace/my`; `setupBossGoogle()` calls `POST /workspace/setup-google`

## Login flow (manager)

1. `/login` → tap "Continue with Google" → Clerk OAuth browser
2. On return: `setActive({ session })` → `ClerkTokenSync` wires token
3. `loginWithGoogle()` → `GET /api/workspace/my` (Bearer token) → found: store joinCode → `/boss`; 404: → `/setup`
4. `/setup` → enter workshop name → `setupBossGoogle()` → `POST /api/workspace/setup-google` → store joinCode → `/subscription` → `/boss`

## Dev script

`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY` prepended to `dev` script in `package.json`. Build script passes `EXPO_PUBLIC_CLERK_PROXY_URL` for production.
