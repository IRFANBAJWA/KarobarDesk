# KarobarDesk — Frontend Context

Version: 1.2
Status: Living document — update as frontend evolves
Scope: React SPA only. Backend details live in KarobarDesk_Locked_Context_v5.5.md.
Path: E:\AIOPOS-Development\KarobarDesk\frontend

Changelog (1.1 → 1.2)
- Companies module complete: pages/Companies.tsx, modules/companies (api, types, 5 components).
- Sidebar nav item added: Companies (SA-gated).
- Locked export convention: components = default export; api.ts/types.ts = named exports.
- Locked drawer pattern: createPortal(…, document.body) + h-[100dvh] + min-h-0 scroll body + no-scrollbar.
- Locked page shell pattern: mx-auto max-w-[1400px] space-y-6 p-6; card around table lives in the page.
- Locked row action menu pattern: portaled, w-40, glass panel, MoreVertical icon.
- Backend resource namespace clarified: resources live under App\Http\Resources\Api\* (matches controller namespace).
- Route ordering rule documented: /companies/admin before /companies/{company}.
- Section 16 (Next Modules) updated — Items / Customers / Price Lists are next.
- Section 17 (Do Not) extended with export-mixing and h-screen-on-drawer.
- Section 22 (Known Pattern Failures) extended with 4 new failures observed during Phase 4.
- New sections 24–28 covering Companies module, locked patterns, and phase status.
- Section 15 (Current State) updated.

---

## 1. Purpose

[unchanged]

## 2. Stack

| Component | Version | Notes |
|---|---|---|
| Vite | 8.3.x | Dev server on 5173, proxies /api + /sanctum to 8080 |
| React | 19.2.8 | StrictMode ON |
| TypeScript | 6.0.2 | verbatimModuleSyntax true — use `import type` |
| React Router | 7.18.4 | react-router-dom, BrowserRouter |
| Tailwind CSS | 3.4.19 | HSL color vars in src/index.css |
| shadcn/ui | v4 (radix-nova) | button, card, input, label installed |
| lucide-react | 1.52.x | Icon library |
| axios | 1.20.x | Single client at src/api/client.ts (auth flow only) |
| next-themes | REMOVED | Replaced by custom ThemeProvider (see section 6) |

Note: modules use native fetch via `lib/apiFetch.ts`, not axios. Both work; apiFetch is required for CSRF on mutations.

## 3. Folder Structure
frontend
├── index.html
├── vite.config.ts (proxy /api + /sanctum → http://localhost:8080)
├── tailwind.config.js
├── tsconfig.app.json
├── package.json
└── src
├── main.tsx
├── App.tsx
├── index.css
├── api
│ ├── client.ts axios instance — auth flow
│ └── sync.ts ERPNext sync endpoints (Setup module)
├── auth
│ ├── AuthContext.tsx
│ └── useAuth.ts
├── theme
│ ├── ThemeProvider.tsx
│ └── ThemeToggle.tsx
├── components
│ ├── ui shadcn (button, card, input, label)
│ └── glass/GlassCard.tsx
├── routes
│ └── ProtectedRoute.tsx
├── layouts
│ ├── AppLayout.tsx topbar + user dropdown + Outlet
│ └── AppSidebar.tsx collapsible sidebar, MENU header, role-aware
├── pages
│ ├── Login.tsx
│ ├── Dashboard.tsx empty placeholder
│ ├── Setup.tsx
│ ├── Users.tsx
│ └── Companies.tsx ← NEW in 1.2
├── setup
│ ├── syncSteps.ts
│ ├── ConnectionCard.tsx
│ ├── SyncCard.tsx
│ └── ActivityPanel.tsx
├── modules
│ ├── users
│ │ ├── api.ts
│ │ ├── types.ts
│ │ └── components
│ │ ├── Modal.tsx
│ │ ├── Select.tsx ← shared (used by all modules)
│ │ ├── UsersTable.tsx
│ │ ├── UsersFilters.tsx
│ │ ├── CreateUserDialog.tsx
│ │ ├── EditUserDialog.tsx
│ │ ├── UserDetailDrawer.tsx
│ │ ├── LinkErpNextDialog.tsx
│ │ ├── ErpNextBadge.tsx
│ │ ├── UserStatusBadge.tsx
│ │ └── UserRolesBadges.tsx
│ └── companies ← NEW in 1.2
│ ├── api.ts
│ ├── types.ts
│ └── components
│ ├── CompaniesTable.tsx
│ ├── CompaniesFilters.tsx
│ ├── CompanyDetailDrawer.tsx
│ ├── SyncStatusBadge.tsx
│ └── ActiveStatusBadge.tsx
├── types
│ ├── auth.ts
│ └── sync.ts
└── lib
├── utils.ts cn() — clsx + tailwind-merge
└── apiFetch.ts fetch wrapper — CSRF + credentials

text

## 4. Design System

[unchanged]

## 5. Auth Flow

[unchanged]

Additional: Companies module does not interact with auth. Login/me/logout shape unchanged.

## 6. Theme Provider

[unchanged]

## 7. Setup Module

[unchanged]

## 8. App Shell (AppLayout + AppSidebar)

Topbar (unchanged from 1.1)
- h-14, glass, sticky top z-40
- Left brand (Store icon + wordmark) — hidden on md+ when sidebar is visible
- Right ThemeToggle, user dropdown

Sidebar (layouts/AppSidebar.tsx)
- 240px expanded / 64px collapsed
- Hidden below md breakpoint
- Collapse state persisted in localStorage.'karobardesk.sidebar.collapsed'
- Structure:
  - Header collapse toggle (ChevronLeft/ChevronRight)
  - MENU label (hidden when collapsed)
  - Nav items (icon + label, active state = violet gradient pill)
- NAV_ITEMS array — the single source of truth for nav
  ```tsx
  const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
    { label: 'Users',     icon: Users,           path: 'users',     roles: ['super_admin'] },
    { label: 'Companies', icon: Building2,       path: 'companies', roles: ['super_admin'] },
  ];
Role filtering: item.roles array; empty/undefined = visible to all. Compare against useAuth().roles.map(r => r.name).

Role names use underscores: super_admin, admin, manager, cashier, sales_person.

Icons: PanelLeftClose/PanelLeftOpen replaced with ChevronLeft/ChevronRight (version safety).

Fixed width via inline class (w-16 or w-60), not Tailwind transitions on width.

To add a new nav item: add one entry to NAV_ITEMS. Done.

Setup & Sync remains in the user dropdown — not in the sidebar. Do not move it.

AppLayout layout

tsx
<div className="flex min-h-screen bg-background">
  <AppSidebar />
  <div className="flex min-w-0 flex-1 flex-col">
    <header>...</header>          ← topbar unchanged
    <main className="min-w-0 flex-1"><Outlet /></main>
  </div>
</div>
9. State Management
[unchanged]

10. API Clients
Two clients, two purposes.

src/api/client.ts — axios instance

Used by auth flow, Setup module (sync endpoints)

Handles CSRF + X-XSRF-TOKEN header automatically

401 interceptor dispatches 'auth:unauthorized' event

src/lib/apiFetch.ts — fetch wrapper

Used by every module (Users, Companies, and all future modules)

Reads XSRF-TOKEN cookie, sends X-XSRF-TOKEN on POST/PUT/PATCH/DELETE

Sends credentials 'include' always

Throws ApiError with .status and .errors for 422s

Rule for new modules: use lib/apiFetch.ts. Do not add axios calls for new work.

11. Routing
Path	Element	Guard
/login	Login	Public; redirects to / if already logged in
/	→ redirect to /dashboard	ProtectedRoute
/dashboard	Dashboard	ProtectedRoute
/setup	Setup	ProtectedRoute + isSuperAdmin check inside component
/users	Users	ProtectedRoute + SA-only action buttons (page renders for all)
/companies	Companies	ProtectedRoute + SA-only (nav gated; backend 403s non-SA)
*	→ redirect to /	—
All protected routes render inside AppLayout, which includes AppSidebar.

12. Adding a New Module — Pattern
Frontend:

src/modules/{feature}/types.ts — TS interfaces

src/modules/{feature}/api.ts — functions using lib/apiFetch

src/modules/{feature}/components/ — reusable pieces (table, filters, drawer, badges)

src/pages/{Feature}.tsx — page component, imports from modules/{feature}

Route added in App.tsx

Nav item added to NAV_ITEMS in AppSidebar.tsx

Loading, empty, error states handled

Naming:

Module folder: lowercase plural (modules/users, modules/companies)

Page file: PascalCase, matches route (pages/Users.tsx)

Components: PascalCase, one per file, default export

Component conventions — see section 25 (Locked Patterns).

13. Conventions
[unchanged]

14. Constraints
[unchanged]

15. Current State
Working:

Login → Sanctum session → AppLayout with sidebar

Sidebar with collapse toggle, role-aware items (Dashboard, Users, Companies)

Dashboard (placeholder)

Setup page — ERPNext connection test + 6 sync cards + activity panel

Users page — list, search, filter, create, edit, view drawer, deactivate/activate

Users drawer — Link/Re-link/Unlink ERPNext, till operation card, accounts pills

Companies page — list, search, filters (active + sync), view drawer, toggle active

Companies drawer — identity, counts, sync meta, record IDs, refresh, toggle

Theme toggle

Sign out

Not built:

Real dashboard (KPIs, charts)

Items / Customers / Price Lists views

Sales / Stock / Parcels / Shifts

Notifications, search, command palette

Mobile responsive polish for sidebar (drawer mode)

Known limitations:

Dashboard is an empty placeholder

No global error boundary

Native window.confirm used for destructive actions (unlink)

No pagination UI polish beyond Previous/Next buttons

Re-sync row action not present on Companies (deferred — no per-company sync backend)

16. Next Likely Modules
In order:

Items — read-only list + detail drawer

Customers — read-only list + detail drawer

Price Lists — read-only list + detail drawer

Dashboard — real KPIs from synced data + recent activity

Sales / Stock / Parcels / Shifts — operational

Each follows section 12.

17. Do Not
[unchanged, plus:]

Do not use native <select> — use modules/users/components/Select.tsx (portaled dropdown).

Do not use overflow-hidden on table cards that contain action menus — the menus are portaled to body.

Do not read User.erpnext_user / erpnext_token / erpnext_last_* directly — use User.erpnext.{user, linked, last_tested_at, last_error}.

Do not call mutations without going through lib/apiFetch.

Do not mix named and default exports in the same component file. Components are default exports; api.ts and types.ts are named exports. Mixing produces "does not provide an export named X" / "does not provide an export named 'default'" runtime errors.

Do not use h-screen on a drawer. Use h-[100dvh] max-h-[100dvh]. 100vh includes browser chrome and cuts the footer off.

Do not render a drawer inline in the page tree. Always createPortal(content, document.body).

Do not put the card wrapper inside the table component. The card lives in the page.

Do not register the same route path twice. /companies appears once, in the SA group.

18. Users Module (Phase 3) — Locked
Files:

pages/Users.tsx — page shell (list + filters + dialogs + drawer + toast)

modules/users/api.ts — listUsers, getUser, createUser, updateUser, deactivateUser, activateUser, listRoles, listCompanies, linkErpNext, unlinkErpNext

modules/users/types.ts — User, Role, Company, TillOperation, TillOperationAccount, ErpNextLink, PaginatedUsers, CreateUserPayload, UpdateUserPayload, LinkErpNextPayload, ListUsersParams

modules/users/components/* — table, filters, modals, drawer, badges, Select, Modal

Create user flow (local-first):

Modal has fields: name, username, email, password, primary company (Select), company access (multi pills), roles (multi pills), is_active

NO ERPNext fields in create

POST /api/users → 201, user created locally

Row appears in table

Link to ERPNext flow:

Drawer → "Link to ERPNext" button → LinkErpNextDialog

Dialog: erpnext_user + erpnext_password → POST /api/users/{id}/erpnext/link

Backend logs in, fetches till, upserts locally, returns updated user

Drawer refreshes with till card + accounts

On failure: error shown inline in dialog, nothing saved

Unlink flow:

Drawer → Unlink button (when linked) → window.confirm → DELETE /api/users/{id}/erpnext/unlink

Drawer refreshes, shows "Not linked"

Super Admin protection:

SA row shows "Protected" pill in the Actions column (no row menu)

Backend returns 403 for update/deactivate/link/unlink on SA

SA role cannot be assigned via the API

Drawer state:

Accepts user prop, mirrors to local current state

onUserUpdated callback fires after link/unlink to refresh the parent list

Nested components (LinkErpNextDialog, ErpNextBadge, UserRolesBadges) read from current

19. Sidebar (AppSidebar.tsx)
Full spec in section 8.

To add nav items:

Import the lucide icon at the top

Add one entry to NAV_ITEMS: { label, icon, path, roles }

roles is optional; missing = visible to everyone

To gate by role:

Use roles: ['super_admin'] — matches backend role names (underscores)

Multiple roles: ['super_admin', 'admin', 'manager']

Current nav items (v1.2):

tsx
{ label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
{ label: 'Users',     icon: Users,           path: 'users',     roles: ['super_admin'] },
{ label: 'Companies', icon: Building2,       path: 'companies', roles: ['super_admin'] },
20. CSRF — apiFetch.ts
Location: src/lib/apiFetch.ts

Exports:

apiFetch<T>(path, options): Promise<T> — main entry

ApiError class with .status, .errors, .message

Behavior:

Always sets credentials: 'include'

Sets Accept: application/json

Sets Content-Type: application/json when body present

On POST/PUT/PATCH/DELETE:

Ensures XSRF-TOKEN cookie exists (fetches /sanctum/csrf-cookie if missing)

Reads XSRF-TOKEN from document.cookie

Sends X-XSRF-TOKEN header

Why:

Laravel Sanctum SPA mode requires CSRF header on every unsafe method

Plain fetch does not do this automatically

Without it, every POST returns "CSRF token mismatch"

Rule: every mutation in every module uses apiFetch. Never raw fetch.

21. Portaled Dropdowns
Components that use createPortal to escape parent overflow:

modules/users/components/Select.tsx — for all custom dropdowns

RowActionMenu inside UsersTable.tsx

RowMenu inside CompaniesTable.tsx

CompanyDetailDrawer.tsx (whole drawer, not just the menu)

Pattern:

Compute screen coordinates with element.getBoundingClientRect()

Render the panel via createPortal(panel, document.body)

position: fixed, top/left from computed coords

z-[100] — above everything else

Close on outside click, Escape, or scroll (optional reposition)

Why: parent tables/cards have overflow-x-auto or rounded corners that clip absolute dropdowns. Portaling to body bypasses all clipping.

Rule: any dropdown that might appear near the edge of a table/card uses portal, not absolute positioning.

22. Known Pattern Failures (Do Not Repeat)
Native <select> with dark theme options render with OS-default white/blue. Always use Select.tsx.

overflow-hidden on the table card clips absolute dropdowns. Removed.

axios vs apiFetch for Users module: we standardized on apiFetch. Keep it that way.

Direct reads of user.erpnext_user — user.erpnext is the correct accessor.

Vite proxy missing /sanctum → CSRF prefetch silently fails → mismatch on POST.

Passing role names to sync() instead of IDs — backend resolves names → IDs. Frontend sends names.

NEW: Named vs default export mismatch. Components must be default exports; api.ts and types.ts are named. Mixing causes Vite "does not provide an export named X" / "does not provide an export named 'default'" errors. During Phase 4 this happened three times before the convention was locked.

NEW: h-screen on a drawer cuts the footer. Use h-[100dvh] max-h-[100dvh].

NEW: Drawer rendered inline in the page tree. If any ancestor has transform, filter, or backdrop-blur, position: fixed becomes relative to that ancestor and the drawer misaligns. Always createPortal(…, document.body).

NEW: Missing min-h-0 on a flex-1 scroll body. Without it, flex won't shrink the body and the footer is pushed off-screen.

NEW: Duplicate route registration. A path registered in two groups → the last one wins silently, breaking the other group's expectations. Register once.

NEW: /companies/{company} registered before /companies/admin. Laravel binds "admin" as the {company} param and returns 404. Static segments must come before parameter segments.

NEW: Resource namespace/path mismatch. App\Http\Resources\Api\CompanyResource must live at app/Http/Resources/Api/CompanyResource.php. If the file is at the top level of Resources/ and the controller imports the Api\ variant, autoload fails with "Class not found".

23. Phase Status
Phase 1 — Master Data Sync: COMPLETE (backend + Setup page)

Phase 3 — Users Module: COMPLETE (list, CRUD, ERPNext link/unlink)

Phase 4 — Companies Module: COMPLETE

Phase 2 — Webhooks: DEFERRED

Phase 4 — Dashboard, Items UI, Customers UI, Price Lists UI: NEXT

Phase 5 — Parcels, Sales, Stock, Shifts: PENDING

Immediate next: Items / Customers / Price Lists read-only lists (see section 16).

24. Companies Module (Phase 4) — Locked
Files:

pages/Companies.tsx — page shell (list + filters + drawer + toast)

modules/companies/api.ts — listCompanies, getCompany, toggleCompanyActive

modules/companies/types.ts — Company, ListCompaniesResponse, ToggleActiveResponse, SyncStatus

modules/companies/components/* — table, filters, drawer, two badges

Backend contract (see Locked Context v5.5 §48 for full detail):

text
GET    /api/companies                          → picker (active only)
GET    /api/companies/admin                    → listAll (all + counts)
GET    /api/companies/{company}                → show (single + counts)
PATCH  /api/companies/{company}/toggle-active  → toggleActive
Company shape (from CompanyResource):

ts
{
  id: number;
  name: string;
  code: string;
  erpnext_company: string | null;
  is_active: boolean;
  sync_status: 'pending' | 'processing' | 'synced' | 'failed' | 'retrying' | string | null;
  last_synced_at: string | null;      // ISO 8601
  erpnext_modified_at: string | null; // ISO 8601
  users_count: number;
  accounts_count: number;
  till_operations_count: number;
  created_at: string | null;
  updated_at: string | null;
}
Columns: Name / ERPNext company / Code / Users / Sync status / Last synced / Active / Actions.

Row actions (row menu, portaled):

View details → opens CompanyDetailDrawer

Deactivate / Activate → PATCH /api/companies/{id}/toggle-active

No Re-sync (deferred — no per-company sync backend)

Filters (client-side):

Search: matches name, code, erpnext_company (case-insensitive)

Active: all / active / inactive (Select)

Sync: all / synced / pending / processing / retrying / failed (Select)

Reset button appears only when any filter is active

Count label: "N of M" when filtered, "M total" otherwise

Drawer (CompanyDetailDrawer):

Portaled to body, h-[100dvh] max-h-[100dvh]

Header: name + erpnext_company + close X (shrink-0)

Body: Status / Identity / Linked records / Sync / Record sections (min-h-0 flex-1 overflow-y-auto no-scrollbar)

Footer: Refresh button (GET /api/companies/{id}) + Deactivate/Activate (shrink-0)

Escape + backdrop click close

Sidebar entry:

tsx
{ label: 'Companies', icon: Building2, path: 'companies', roles: ['super_admin'] }
Deferred features (not bugs):

Re-sync row action — awaiting per-company backend

Create company — companies come from ERPNext only

Delete company — never from KarobarDesk

ERPNext link/unlink for companies — N/A; companies come from ERPNext

25. Locked Patterns (Post-Companies, v1.2)
Export convention — LOCKED
Every file under modules/*/components/ uses a DEFAULT export:

tsx
export default function MyComponent(...) {}
api.ts uses NAMED exports: export async function listX(...), export async function getX(...).

types.ts uses NAMED type exports: export interface X {}, export type Y = ....

A component file may export named siblings (constants, types) alongside the default component export:

tsx
export const DEFAULT_X_FILTERS: XFilterState = {...};
export interface XFilterState {...}
export default function XFilters(...) {}
Import rules:

tsx
import MyComponent from "./MyComponent";                     // component — no braces
import { listX, getX } from "../api";                        // function — braces
import type { X } from "../types";                           // type — braces + type keyword
import MyComponent, { CONST, type FilterState } from "./MyComponent";  // default + named siblings
Why locked: mixing named and default exports for the same component caused three separate runtime errors during Phase 4. Every file must be unambiguously one or the other.

Drawer pattern — LOCKED
Every detail drawer in every module MUST:

Render via createPortal(content, document.body) — never inline.

Use h-[100dvh] max-h-[100dvh] on the <aside> — NOT h-screen. 100vh includes browser chrome and cuts the footer off.

Structure the <aside> as flex flex-col with:

<header className="shrink-0 ..."> — title + close button

<div className="min-h-0 flex-1 overflow-y-auto no-scrollbar ..."> — scrollable body

<footer className="shrink-0 ..."> — action buttons

Backdrop: fixed inset-0 z-40 bg-black/60 backdrop-blur-sm

Panel: fixed right-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl

Support Escape close and backdrop click close.

Footer buttons always visible — never pushed off.

no-scrollbar CSS (in src/index.css):

css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
Why locked: min-h-0 on the scroll body and h-[100dvh] on the aside are both mandatory. Missing either one produces a cut-off footer. The portal sidesteps any ancestor transform / filter / backdrop-blur that would break position: fixed.

Page shell pattern — LOCKED
tsx
<div className="mx-auto max-w-[1400px] space-y-6 p-6">
  {/* Header — title + subtitle left, primary action right */}
  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Title</h1>
      <p className="text-sm text-muted-foreground">Subtitle.</p>
    </div>
    <Button variant="ghost" ...>...</Button>
  </div>

  {/* Filters — component wraps itself in the card class */}
  <Filters ... />

  {/* Error banner (conditional) */}
  {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>}

  {/* Table card — card lives HERE, not in the table component */}
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
    <Table ... />
  </div>

  {/* Drawer + Toast */}
</div>
Title: text-xl font-semibold tracking-tight

Subtitle: text-sm text-muted-foreground

Primary action: shadcn <Button> (violet gradient) or <Button variant="ghost">

Card: rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl

Toast: fixed bottom-6 right-6 z-50 rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl

Table pattern — LOCKED
Table component renders ONLY the <table> inside <div className="overflow-x-auto">. No card wrapper.

tsx
<table className="w-full border-collapse text-sm">
  <thead>
    <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
      <th className="px-6 py-3 font-medium">Name</th>
      ...
      <th className="px-6 py-3 text-right font-medium">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-white/5 transition hover:bg-white/[0.02]">
      <td className="px-6 py-4">...</td>
      <td className="px-6 py-4 text-right">...</td>
    </tr>
  </tbody>
</table>
Loading state: 4 skeleton rows: h-14 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]

Empty state: centered py-16, "No X found" + "Try adjusting your filters."

Filters pattern — LOCKED
Filters component wraps itself in the card class:

tsx
<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
  <div className="flex flex-wrap items-center gap-3">
    {/* Search input (h-9, pl-9 for icon) */}
    {/* Selects (h-9, via Select.tsx) */}
    {/* Reset button (h-9, only when filtered) */}
    {/* Count label (ml-auto) */}
  </div>
</div>
Search input: h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20

Reset button: inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground

All controls share h-9 height.

Dropdowns always via Select.tsx — never native <select>.

Row action menu pattern — LOCKED
tsx
<button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground">
  <MoreVertical className="h-4 w-4" />
</button>
Panel (via createPortal):

tsx
<div className="z-[100] w-40 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-xl">
  <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
    <Eye className="h-3.5 w-3.5" /> View details
  </button>
  ...
</div>
Position: top: rect.bottom + 6, left: rect.right - 160

Icon: MoreVertical (not MoreHorizontal)

Destructive item color: text-amber-400 hover:text-amber-300 (deactivate) or text-emerald-400 hover:text-emerald-300 (activate)

Close on outside click, Escape

26. Backend Resource Namespace Rule
Resources live under the namespace of the controller that consumes them:

Controller namespace	Resource namespace	Example
App\Http\Controllers\Api\*	App\Http\Resources\Api\*	Api\CompanyResource
App\Http\Controllers\Users\*	App\Http\Resources\Users\*	Users\UserListResource
The resource file path must match the namespace. App\Http\Resources\Api\CompanyResource → app/Http/Resources/Api/CompanyResource.php.

Do NOT place CompanyResource at app/Http/Resources/CompanyResource.php if the controller imports App\Http\Resources\Api\CompanyResource — autoload fails with "Class not found".

27. Route Ordering Rule
When registering routes at the same depth:

Static segments come BEFORE parameter segments.

/companies/admin before /companies/{company} — otherwise "admin" is bound as {company} and 404s.

/sync/login before /sync/{step} — same reasoning.

A route path is registered exactly ONCE in routes/api.php. No duplicate registrations across groups.

28. Phase Status (Detail)
Phase 1 — Master Data Sync: COMPLETE

Backend: SyncController, ErpNextClient, Setup module endpoints

Frontend: pages/Setup.tsx, setup/ folder (6 sync cards, connection test, activity panel)

Phase 3 — Users Module: COMPLETE

Backend: UserController CRUD + link/unlink, ErpNextUserService, User::$appends = ['erpnext']

Frontend: pages/Users.tsx, modules/users (10 components)

Phase 4 — Companies Module: COMPLETE (v1.2)

Backend: CompanyController (listAll, show, toggleActive), CompanyResource, 4 routes

Frontend: pages/Companies.tsx, modules/companies (5 components)

Phase 2 — Webhooks: DEFERRED

Phase 4 — Dashboard, Items UI, Customers UI, Price Lists UI: NEXT

Phase 5 — Parcels, Sales, Stock, Shifts: PENDING

Next module: Items (read-only list) — see section 16.

End of frontend context.