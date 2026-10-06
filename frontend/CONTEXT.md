# KarobarDesk — Frontend Context

Version: 1.0
Status: Living document — update as frontend evolves
Scope: React SPA only. Backend details live in KarobarDesk_Locked_Context_v5.3.md.
Path: E:\AIOPOS-Development\KarobarDesk\frontend

---

## 1. Purpose

This document is the single source of truth for frontend development of the KarobarDesk React SPA. It covers stack, folder structure, design system, auth, routing, state management, and the pattern for adding modules.

Read this before touching any frontend file. Do not read the backend context unless you need API contract details — everything frontend-relevant is here.

---

## 2. Stack

| Component | Version | Notes |
|---|---|---|
| Vite | 8.3.x | Dev server on 5173, proxies /api + /sanctum to 8080 |
| React | 19.2.8 | StrictMode ON |
| TypeScript | 6.0.2 | verbatimModuleSyntax: true — use import type |
| React Router | 7.18.4 | react-router-dom, BrowserRouter |
| Tailwind CSS | 3.4.19 | HSL color vars in src/index.css |
| shadcn/ui | v4 (radix-nova) | button, card, input, label installed |
| lucide-react | 1.52.x | Icon library |
| axios | 1.20.x | Single client at src/api/client.ts |
| next-themes | REMOVED | Replaced by custom ThemeProvider (see section 6) |

Node 24 LTS on Windows host. npm 11.x. No Node in Docker.

---

## 3. Folder Structure
frontend/
index.html SPA shell, inline theme script in head
vite.config.ts Vite + proxy config
tailwind.config.js Tailwind v3 config
tsconfig.app.json Strict TS, @/* alias, noUnusedLocals
package.json
src/
main.tsx Providers: Theme -> BrowserRouter -> Auth
App.tsx Route table
index.css Tailwind directives + HSL vars
api/
client.ts axios instance + CSRF + 401 interceptor
sync.ts ERPNext sync endpoints
auth/
AuthContext.tsx user, roles, permissions, activeCompany, isSuperAdmin
useAuth.ts typed hook, throws outside provider
theme/
ThemeProvider.tsx custom, no next-themes
ThemeToggle.tsx sun/moon button
components/
ui/ shadcn primitives: button, card, input, label
glass/
GlassCard.tsx variant primitive: default | solid | subtle
routes/
ProtectedRoute.tsx loading spinner -> redirect -> Outlet
layouts/
AppLayout.tsx topbar + user dropdown + Outlet
pages/
Login.tsx
Dashboard.tsx empty-state placeholder
Setup.tsx ERPNext sync page
setup/
syncSteps.ts 6-step metadata (icon, label, desc)
ConnectionCard.tsx username + password + test button
SyncCard.tsx clickable card per step
ActivityPanel.tsx recent sync log list
types/
auth.ts User, Role, Permission, Company, MeResponse
sync.ts SyncStep, SyncResult, ErpNextCredentials
lib/
utils.ts cn() — clsx + tailwind-merge

text

---

## 4. Design System — Dark Glassmorphism + Bento + Minimal SaaS

Reference aesthetic: Linear, Vercel, Arc, Raycast.

### Theme

- **Dark-first.** Light mode exists but is secondary.
- `ThemeProvider` sets class `dark` or `light` on `<html>`.
- Inline script in `index.html` applies class before React mounts — no flash.
- Stored in `localStorage.karobardesk-theme`.

### Glass vs. Solid

- **Glass** (backdrop-blur, translucent) — topbar, sidebar, login card, KPI cards, modals, setup connection card
- **Solid** (opaque, border) — tables, forms, detail views

### GlassCard primitive

```tsx
<GlassCard>                     // default — bg-white/5 backdrop-blur-xl border-white/10
<GlassCard variant="solid">     // bg-card border-border
<GlassCard variant="subtle">    // bg-white/[0.03] backdrop-blur-md border-white/5
<GlassCard className="p-5">     // padding override
Colors
Background: bg-background (near-black in dark mode)

Foreground: text-foreground

Muted text: text-muted-foreground

Primary accent: violet-600 -> indigo-600 gradient

Success: text-emerald-400, bg-emerald-500/10

Error: text-red-400, bg-red-500/5

Warning: text-amber-300, bg-amber-500/10

Corner radius
Cards: rounded-2xl

Inputs/buttons: rounded-lg (default shadcn)

Pills/badges: rounded-full

Icons in gradient squares: rounded-xl

Typography
Font: @fontsource-variable/geist

Headings: font-semibold tracking-tight

Numbers: tabular-nums

Muted labels: text-xs text-muted-foreground

Footer notes: text-xs text-muted-foreground/60

Spacing rhythm
Card padding: p-5 (compact) or p-6 (default) or p-8 (hero)

Section gaps: space-y-6

Grid gaps: gap-4

Page padding: p-6

Max content width: max-w-[1600px] (app), max-w-[1200px] (setup)

Interactions
Hover lift on cards: hover:-translate-y-0.5 transition

Hover bg on glass: hover:bg-white/10

Focus ring: focus-visible:ring-violet-500/50

Loading: lucide Loader2 with animate-spin

Disabled: disabled:opacity-50 disabled:cursor-not-allowed

Background glow (login, splash pages)
Two radial gradients — one violet, one cyan — behind the card:

tsx
<div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-3xl" />
<div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
5. Auth Flow
On mount
AuthProvider -> GET /api/me

200 -> set user, roles, permissions, activeCompany, isSuperAdmin

401 -> user = null (not an error — expected when logged out)

Login
GET /sanctum/csrf-cookie (separate axios instance, not through /api base)

POST /api/login { username, password, client_type: 'spa' }

Response: { user, companies, roles }

Immediately call GET /api/me again to hydrate permissions + active_company + is_super_admin

navigate('/')

Logout
POST /api/logout -> clear context -> redirect to /login

401 interceptor
Any /api/* 401 EXCEPT /me on mount and /login -> dispatch window.dispatchEvent('auth:unauthorized')

AuthContext listens -> clears user -> ProtectedRoute redirects

Cookie handling
Axios withCredentials: true

Request interceptor reads XSRF-TOKEN cookie -> sets X-XSRF-TOKEN header

Routing guard
ProtectedRoute: loading -> spinner; !user -> /login; else <Outlet />

If already authenticated and hit /login -> redirect to /

If unknown route -> /

/setup route is rendered inside ProtectedRoute + AppLayout, but check isSuperAdmin at the page level

Roles
isSuperAdmin = roles.some(r => r.is_super_admin) OR from /api/me user object

Super Admin sees "Setup & Sync" in user menu

Non-super-admin cannot access /setup (redirect in component)

6. Theme Provider (custom, no next-themes)
File: src/theme/ThemeProvider.tsx

React Context with theme: 'dark' | 'light'

setTheme(t) and toggleTheme() methods

Persists to localStorage.karobardesk-theme

Applies class to document.documentElement

Default: dark

useTheme() hook exported from same file.

ThemeToggle.tsx uses useTheme(), shows Sun when dark, Moon when light.

Inline script in index.html reads localStorage and applies class before React mounts to prevent FOUC.

7. Setup Module (ERPNext Sync)
Route
/setup — Super Admin only. Rendered inside AppLayout.

Reachable from
Topbar user dropdown -> "Setup & Sync" (visible only if isSuperAdmin)

Direct URL /setup (guarded by isSuperAdmin check in component)

Layout
Page header — "Setup & Sync" + subtext

ConnectionCard — username + password + "Test connection" button

Master Data section — grid of 6 SyncCards (disabled until connection tested)

ActivityPanel — last 20 sync rows

"Continue to dashboard" button (always enabled)

The 6 sync cards
Step	Label	Icon	Depends on
companies	Companies	Building2	—
accounts	Accounts	Wallet	companies
price_lists	Price Lists	DollarSign	—
items	Items	Package	—
item_prices	Item Prices	Tags	price_lists, items
customers	Customers	Users	—
Card states
Idle — "Click to sync", hover lift

Syncing — violet ring, "Syncing...", spinner

Success — green check, "+N new · Xms"

Failed — red, error message clipped to 60 chars

Flow
User enters ERPNext username + password

Clicks "Test connection" -> POST /api/sync/test

On success: cards become clickable

User clicks a card -> POST /api/sync/{step} with credentials

Card updates, counts refresh (GET /api/sync/status), activity refreshes (GET /api/sync/activity)

Credentials live in React state only — never localStorage, sessionStorage, or backend persistence

Navigating away resets state (component unmounts)

8. App Shell (AppLayout)
Topbar
Height h-14

Glass — bg-white/5 backdrop-blur-xl border-b border-white/10

Sticky top, z-40

Left: Store icon in violet gradient square + "KarobarDesk" wordmark

Right: ThemeToggle, user dropdown

User dropdown
Click avatar -> menu opens:

Header: name, @username · email

Role badges (rounded pills)

Divider

Company context line: "Super Admin · all companies" or "Active · CompanyName" or "No active company"

Setup & Sync — only if isSuperAdmin

Sign out — red text

No sidebar yet
Sidebar appears when we have 3 or more navigable pages. Currently only / and /setup.

9. State Management
Concern	Tool
Auth (user, roles, perms)	React Context
Theme	React Context
Server data (lists, details)	Direct axios calls for now
Future: server data caching	TanStack Query — install when first list module lands
Form state	React useState for simple forms
Future: complex forms	React Hook Form + Zod
No Redux. No Zustand. No MobX. Context + hooks are enough for now.

10. API Client
File: src/api/client.ts

Two axios instances:

api — baseURL /api, withCredentials, CSRF header, 401 interceptor

sanctum — baseURL /, for /sanctum/csrf-cookie

Helper getCsrfCookie() — calls sanctum instance

Helper extractErrorMessage(error) — turns Axios error into human string

Response types
Every API function is typed with a Promise<T> return. Types live in src/types/*.ts.

Error handling
Try/catch in components

Show error state in UI (red box, AlertCircle icon)

401 automatically clears auth and redirects

11. Routing
Path	Element	Guard
/login	Login	Public; redirects to / if already logged in
/	Dashboard (empty placeholder)	ProtectedRoute
/setup	Setup	ProtectedRoute + isSuperAdmin check inside component
*	Redirect to /	—
All protected routes render inside <AppLayout> (topbar + Outlet).

12. Adding a New Module — Pattern
Every module follows the same steps.

Frontend
src/types/{module}.ts — TS interfaces for API responses

src/api/{module}.ts — axios functions, typed

src/pages/{Module}/Index.tsx — list view

src/pages/{Module}/Detail.tsx — optional detail page

src/pages/{Module}/components/*.tsx — module-scoped pieces (cards, dialogs)

Route added in App.tsx under ProtectedRoute + AppLayout

Nav item added — either in topbar dropdown or (once sidebar exists) in sidebar config

Loading, empty, error states all handled

Naming
Pages: Index.tsx for list, Detail.tsx for single

Module-scoped components: src/pages/{Module}/components/

Shared components: src/components/

Card style: use GlassCard, variant="solid" for tables

Table pattern (once shadcn/table installed)
Header row: border-b border-white/5 text-xs text-muted-foreground

Body rows: hover hover:bg-white/5

Empty state: centered message + icon

Loading: skeleton rows or spinner

Form pattern
Every field has a <Label> with htmlFor

Inputs have explicit id and name

Errors: red text below field

Submit button: disabled while submitting, shows spinner

Cancel button: ghost variant

13. Conventions
Imports
Use @/ alias for all src/ imports

Type imports: import type { X } from '...' (verbatimModuleSyntax)

Order: React -> external libs -> @/ modules -> relative

Components
Function components only, no classes

export default for pages

export function for named components

No React.FC<...> — type props directly

Files
One component per file

File name matches component name (PascalCase for components, camelCase for utilities)

No barrel index.ts files unless there's a clear reason

CSS
Tailwind utility classes only

No inline styles except for dynamic computed values

No CSS modules

Custom utilities in index.css only when truly needed

Constants
Module-level const X: Record<K, V> = { ... } for fixed maps

Avoid magic strings in JSX — pull to a named constant

Error messages
User-facing: clear, actionable ("Invalid credentials.", "Cannot reach server.")

Prefix with context when needed: "ERPNext login failed: ..."

14. Constraints
No Node in Docker. Vite dev server is a separate process on Windows.

No SSR. Pure client-side SPA.

No data libraries (TanStack Query) until first list endpoint lands — keep it simple.

No form libraries (RHF, Zod) until first complex create/edit form lands.

No state libraries (Redux, Zustand). Context only.

No CSS-in-JS. Tailwind only.

No component libraries beyond shadcn/ui.

No PWA, no service worker.

No i18n. English only for now. Pakistan-relevant strings (Rs, PKR, Asia/Karachi) are hardcoded.

15. Current State
Working
Login -> Sanctum SPA session -> ProtectedRoute -> AppLayout -> Dashboard (empty)

Setup page: ERPNext connection test + 6 sync cards + activity panel

Theme toggle (dark/light, persistent)

Sign out

Setup menu item in topbar (Super Admin only)

Not built
Sidebar

Real dashboard (KPIs, charts)

User management

Companies list

Items / Customers / Price Lists views

Sales / Stock / Parcels / Shifts

Notifications

Search

Command palette

Mobile responsive polish

Known limitations
Dashboard is an empty placeholder

No route for 404 — unknown URLs redirect to /

Sidebar absent — only two routes exist

No global error boundary

16. Next Likely Modules
In order of dependency:

Users — create/edit, assign company + role, sync per-user ERPNext data

Dashboard — real KPIs from synced data

Companies — read-only list + active-company switcher

Items / Customers / Price Lists — read-only lists

Sales / Stock / Parcels / Shifts — operational

Each follows the section 12 pattern. Backend for each lands alongside.

17. Do Not
Do not read the backend context unless you need to verify an API shape.

Do not install libraries without asking.

Do not use any — use unknown + narrowing.

Do not use enums — use as const objects or union types (erasableSyntaxOnly).

Do not add React. prefixed types — import from react.

Do not write CSS files — Tailwind only.

Do not persist credentials to storage.

Do not use localStorage for anything but theme.

Do not add global CSS resets beyond what index.css already has.

End of frontend context.