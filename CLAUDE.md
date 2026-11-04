# CLAUDE.md — LocalNotesMobile

Root: `LocalNotesMobile/`. All Expo / React Native work belongs here.

## Stack

- **Expo** ~54, **expo-router** ~6, **React** 19 / **RN** 0.81
- **NativeWind** v4 + Tailwind 3
- **Zustand**, **TanStack Query**, **axios**
- **expo-secure-store** (tokens) / AsyncStorage (prefs)
- **i18next**, **react-native-maps** (Mapbox token for geocoding only)

Alias `@/` → project root. Compose classes with `cn()` (`utils/cn.ts` = `twMerge`). Prefer `npx expo install <pkg>` for Expo-compatible versions.

**Do not invent** tooling that is not installed: FlashList, Jest/Vitest, Sentry/`expo-error-reporter`, `expo-updates`.

**No payment processing in this app.** Mobile must never call a Stripe SDK, `/checkout`, or any other payment/charge endpoint directly — that would expose the app to Apple/Google in-app-purchase commission requirements. Paid features (e.g. publishing a business "Offer") must hand off to `LocalNotes-Frontend` via `Linking.openURL` (using `getWebAppUrl()` from `http/environment.config.ts`) to complete the purchase. See `hooks/useOpenCreateOfferOnWeb.ts` for the pattern.

---

## Project layout

| Area | Location |
|------|----------|
| Routes | `app/` — `(auth)/` (public), `(app)/(tabs)/`, `(app)/(stack)/` |
| Screen bodies | `components/PageComponents/<Feature>/` |
| Shared UI | `components/ui/` |
| Hooks / stores | `hooks/`, `stores/` |
| REST API | `http/` (`*-api/*.service(s).ts`) |
| Device / i18n / push | `services/` |
| Locales | `locales/` (e.g. `en.ts`) |
| Utils / constants / types | `utils/`, `constants/`, `types/` |

**New screen:** add a thin route under `app/`; implement the body in `components/PageComponents/<Feature>/`.

---

## Routing

- **Root:** `app/_layout.tsx` (fonts, QueryClient, theme/locale); `app/index.tsx` splash → `bootstrapSession()` → `/sign-in` | `/personality` | `/home`.
- **`(auth)/`:** public auth screens (sign-in, sign-up, OTP…). Thin files re-export PageComponents.
- **`(app)/`:** auth gate — `!isAuthenticated` or `isSessionLocked` → `/sign-in`. Children: `(tabs)/` and `(stack)/`.
- **Section chrome:** `SectionShellPager` + `GuardedFooter` + `constants/swipeNavigation.ts` / `useSectionRouteStore`. Expo Tabs keep URL/deep-link sync; they are not the primary swipe UI.
- Use Expo Router only (`router.push`, `<Link href="...">`); typed params with `useLocalSearchParams`.

---

## API and auth

- **Base URL:** `getApiBaseUrl()` in `http/environment.config.ts` — `Constants.expoConfig.extra.apiUrl`, normalized to end with `/api`. Mapbox: `EXPO_PUBLIC_MAPBOX_TOKEN`. `apiUrl` is often hardcoded in `app.config.ts` for device LAN; changing it usually needs a **native rebuild**.
- **HTTP:** `http/index.ts` — `AppHttpService` (Bearer + 401 refresh queue) and `PublicHttpService`. Refresh: `POST …/accounts/token/refresh` with `{ refresh_token }`; failure → `clearAuth` + `router.replace('/sign-in')`.
- **Feature APIs:** extend `http/<domain>-api/*.service(s).ts`. Hooks call these via TanStack Query — never raw axios in screens.
- **`services/`:** device/orchestration only — `authBootstrap`, `socialAuth`, `biometricAuth`, `i18n`, `pushNotifications`. Do **not** extend legacy `services/authService.ts` for new work; use `http/auth-api/auth.service.ts`.
- **Session:** `useAuthStore` (tokens in SecureStore) + optional biometric `lockSession` (lock ≠ logout). Personality gate: `utils/personality.ts`.

---

## Architecture

- **Server/async state** → TanStack Query only — do not duplicate fetched data in Zustand.
- **Zustand** → UI prefs, form drafts, search chrome/filters, section swipe state.
- Extract business logic into hooks or services — keep route files thin.

---

## Styling (NativeWind)

- Prefer **`className`** for static styles. Reserve `style` / `StyleSheet` for values NativeWind cannot express (animated values, `absoluteFillObject`, hairline borders).
- Semantic tokens in `tailwind.config.js` (`page`, `soft`, `ink`, `brand`, …) — not ad-hoc magic colors.
- Theme: `useThemeStore` → AsyncStorage `app_theme`; `app/_layout.tsx` calls `loadTheme()` then NativeWind `setColorScheme`. Use `dark:` variants; never branch on `theme` to swap `className` strings. Reuse `ThemeToggle`.
- Compose classes with `cn()`. Use `cursor-pointer` on interactive controls where applicable.

---

## Multi-language (i18n)

- Init: `services/i18n.ts` (device locale via `expo-localization`, fallback `en`).
- State: `useLocaleStore` (AsyncStorage `app_locale`); `setLocale` updates state, `i18n.changeLanguage`, and persists.
- Strings in `locales/en.ts` (namespaces: `common`, `auth`, `settings`, …). Always `useTranslation()` → `t('…')` — never hardcode user-visible copy.
- New locale: mirror `en.ts` and register in `services/i18n.ts`.

---

## Maps / search

- Map UI: `react-native-maps` (e.g. `SearchMap.tsx`). Geocoding: Mapbox via `LocationInput` / `mapboxToken` — not map tiles.
- Search hooks read `useSearchStore.committedQuery` + `useEffectiveSearchLocation()` (typing updates `query` until commit).

---

## TypeScript and components

- Strict TypeScript — no `any`, no `@ts-ignore` without a justifying comment.
- Prop types: `interface` for components; export shared types from `types/` when reused.
- One functional component per file; PascalCase files (`NoteCard.tsx`).
- Hooks: `use*` prefix; never call conditionally.
- Stores: `useXxxStore`. Constants: `SCREAMING_SNAKE_CASE`.

---

## Security and config

- Tokens/keys → `expo-secure-store`, not AsyncStorage.
- Env-aware config via `expo-constants` / `app.config.ts` — avoid raw `process.env` in components.
- Never commit `.env` secrets.

---

## Commands

From `LocalNotesMobile/`:

- `npm run start` | `dev` | `ios` | `android` | `web`
- Dev variants: `ios:dev`, `android:dev`, `ios:run:dev` (`APP_VARIANT=development`)

Builds: EAS Build — not deprecated `expo build`. Use `npx expo` (not `expo-cli`).

---

## Cross-repo

Backend REST under `LocalNotes-backend` `api/...`. Align payloads with `http/*-api/`. Mobile uses SecureStore tokens (not the web cookie refresh flow). Multi-package changes: root `CLAUDE.md` + `localnotes-cross-repo` skill.
