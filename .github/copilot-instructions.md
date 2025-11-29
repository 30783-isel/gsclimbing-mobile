# GitHub Copilot / AI Agent Instructions for gsclimbing-mobile

This file gives focused, actionable guidance for AI coding agents working on this Expo React Native + TypeScript app.

1) Project type & entry
- Expo managed React Native app using `expo-router`. Entry is `App.tsx` and route layout lives under `app/` (see `app/_layout.tsx`, `app/index.tsx`).

2) High-level architecture
- UI: React Native + `react-native-paper` (MD3 theme in `src/constants/theme.ts`).
- Routing: `expo-router` folder-based routing. Auth routes are grouped in `(auth)`, main tabs in `(tabs)/admin` and `(tabs)/tech`.
- State: lightweight global state via `zustand` in `src/store/*` (notably `src/store/authStore.ts`).
- Networking: `axios` wrapper at `src/services/httpClient.ts` with request/response interceptors and Basic Auth support.
- API modules: `src/services/api/*.api.ts` (e.g. `auth.api.ts`) — use these for HTTP interactions.

3) Authentication flow (important, project-specific)
- Auth persistence uses `AsyncStorage` keys: `user`, `role`, `username`, `password`, `token`.
- `useAuth` hook (`src/hooks/useAuth.ts`) stores the `password` in `AsyncStorage` to enable Basic Auth for subsequent requests.
- `auth.api.ts` uses `API_CONFIG.baseLogUrl` endpoints (`basicauth`, `role`, `validate`) to authenticate and retrieve user roles.
- `httpClient` interceptor attaches a Basic `Authorization` header from `username`+`password` unless the request is to the `basicauth` endpoint. On 401 it clears auth data and logs.

4) Environment & local development gotchas
- The API base URLs are configured in `src/constants/api.ts`. It uses a hard-coded `SERVER_IP` (e.g. `192.168.1.100`) — change this to your machine IP (do NOT use `localhost`) so mobile devices/emulators on the network can reach the backend.
- Typical dev commands (from `package.json`):
  - `npm start` -> `expo start`
  - `npm run android` -> `expo start --android`
  - `npm run ios` -> `expo start --ios`
  - `npm run web` -> `expo start --web`
  - `npm run lint` -> `eslint .`
  - `npm run type-check` -> `tsc --noEmit`

5) Conventions & patterns to follow
- Services: Use `src/services/api/*.api.ts` to interact with backend; keep components free of raw axios usage.
- AsyncStorage keys are the source of truth for HTTP auth headers; never rely on ephemeral in-memory-only credentials for requests.
- Use `useAuthStore` (Zustand) for auth-related state and `useAuth` for login/logout flows and navigation.
- UI theming lives in `src/constants/theme.ts`. Use exported `theme`, `spacing`, `fontSize` and `colors` consistently.
- Translations: i18n is configured in `src/i18n/config.ts` with translations under `src/i18n/translations/`.

6) Debugging tips specific to this repo
- `httpClient` logs requests/responses when `__DEV__` is true — use that to trace network calls.
- When backend errors cause 401s, the httpClient clears auth storage; check `AsyncStorage` keys if auth state is inconsistent.
- If routing redirects unexpectedly, inspect `app/_layout.tsx` which initializes auth and redirects based on `useAuthStore()` `isAuthenticated` and `segments`.

7) Files to inspect for common tasks (quick links)
- Routing & boot: `app/_layout.tsx`, `app/index.tsx`
- Auth store/hook: `src/store/authStore.ts`, `src/hooks/useAuth.ts`
- HTTP client & API: `src/services/httpClient.ts`, `src/services/api/auth.api.ts`
- Constants: `src/constants/api.ts`, `src/constants/theme.ts`
- i18n: `src/i18n/config.ts`, `src/i18n/translations/*`

8) Safety & merge guidance for AI agents
- If changing network settings (e.g., `src/constants/api.ts`), do not commit your local machine IP to shared branches. Prefer `.env` or leave a placeholder and document how to configure it.
- Avoid modifying auth storage key names — they are referenced across store, http client and hooks.
- When adding new API endpoints, add an API module under `src/services/api/` and reuse the shared `httpClient` instance.

9) PR guidance for small changes
- Keep changes focused: update one feature/area per PR.
- Add short tests or a manual verification note in the PR description describing how to exercise the change via `expo start` and which navigation path to follow.

If anything here is unclear or you want more detail about a particular area (routing, auth, networking, or CI workflows), tell me which area to expand and I will iterate.
