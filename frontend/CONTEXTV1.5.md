KarobarDesk — Frontend Context
Version: 1.5
Status: Living document — update as frontend evolves
Scope: React SPA only. Backend details live in KarobarDesk_Locked_Context_v5.8.md.
Path: E:\AIOPOS-Development\KarobarDesk\frontend

Changelog (1.4 → 1.5)
Consolidated all four prior frontend context versions (1.1, 1.2, 1.3, 1.4) into a single living document.

Phase 4b (Stock & Till Accounts) COMPLETE.

Stock Module: Balance table (Opening/In/Out/Closing) + Ledger drawer with date filters.

Till Accounts: Map payment accounts to cashiers + "Create Account" modal for local accounts.

User Drawer: EditTillDialog added.

Sidebar: Stock and Till Accounts routes added.

Local Filtering pattern locked (useMemo for small toggles).

Relation Rendering rule added.

Server-Side Pagination, Combobox, and Query String patterns locked.

Next module: Sales (POS Checkout Middleware).

1. Purpose
Living frontend context for the KarobarDesk React SPA. Covers stack, folder layout, locked patterns, per-module specs, known failures, phase status. Backend contract details live in KarobarDesk_Locked_Context_v5.8.md.

2. Stack
Component	Version	Notes
Vite	8.3.x	Dev server 5173, proxies /api + /sanctum → 8080
React	19.2.8	StrictMode ON
TypeScript	6.0.2	verbatimModuleSyntax: true — use import type
React Router	7.18.4	react-router-dom, BrowserRouter
Tailwind CSS	3.4.19	HSL color vars in src/index.css
shadcn/ui	v4 (radix-nova)	button, card, input, label
lucide-react	1.52.x	Icons
axios	1.20.x	src/api/client.ts (auth flow only)
next-themes	REMOVED	Replaced by custom ThemeProvider
Modules use native fetch via lib/apiFetch.ts. apiFetch is required for CSRF on mutations.

3. Folder Structure
text
frontend
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.app.json
├── package.json
└── src
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── api
    │   ├── client.ts        axios — auth flow
    │   └── sync.ts          ERPNext sync (Setup)
    ├── auth
    │   ├── AuthContext.tsx
    │   └── useAuth.ts
    ├── theme
    │   ├── ThemeProvider.tsx
    │   └── ThemeToggle.tsx
    ├── components
    │   ├── ui
    │   │   ├── button.tsx, card.tsx, input.tsx, label.tsx
    │   │   └── Combobox.tsx      ← searchable (large lists)
    │   ├── badges
    │   │   ├── ActiveStatusBadge.tsx
    │   │   └── SyncStatusBadge.tsx
    │   └── glass/GlassCard.tsx
    ├── routes
    │   └── ProtectedRoute.tsx
    ├── layouts
    │   ├── AppLayout.tsx
    │   └── AppSidebar.tsx
    ├── pages
    │   ├── Login.tsx
    │   ├── Dashboard.tsx
    │   ├── Setup.tsx
    │   ├── Users.tsx
    │   ├── Companies.tsx
    │   ├── Items.tsx
    │   ├── PriceLists.tsx
    │   ├── ItemPrices.tsx
    │   ├── Customers.tsx
    │   ├── Stock.tsx
    │   └── TillAccounts.tsx
    ├── setup
    │   ├── syncSteps.ts
    │   ├── ConnectionCard.tsx
    │   ├── SyncCard.tsx
    │   └── ActivityPanel.tsx
    ├── modules
    │   ├── users
    │   │   ├── api.ts, types.ts
    │   │   └── components (Modal, Select, Table, Filters, Dialogs, Drawer, Badges, EditTillDialog, LinkErpNextDialog, ErpNextBadge)
    │   ├── companies
    │   │   ├── api.ts, types.ts
    │   │   └── components (Table, Filters, Drawer)
    │   ├── items
    │   │   ├── api.ts, types.ts
    │   │   └── components (Table, Filters, Drawer, EditDialog)
    │   ├── price-lists
    │   │   ├── api.ts, types.ts
    │   │   └── components (Table, Filters, Drawer)
    │   ├── item-prices
    │   │   ├── api.ts, types.ts
    │   │   └── components (Table, Filters, Drawer, EditDialog, CreateDialog, UnpricedItemsDialog)
    │   ├── customers
    │   │   ├── api.ts, types.ts
    │   │   └── components (Table, Filters, Drawer, EditDialog)
    │   ├── stock
    │   │   ├── api.ts, types.ts
    │   │   └── components (StockBalancesTable, StockFilters, StockLedgerDrawer)
    │   └── accounts
    │       ├── api.ts, types.ts
    │       └── components (Modals)
    ├── types
    │   ├── auth.ts
    │   └── sync.ts
    └── lib
        ├── utils.ts          cn()
        └── apiFetch.ts       CSRF + credentials
4. Design System
Dark-first, glass cards (bg-white/5 backdrop-blur-xl border-white/10), violet→indigo gradient primary actions.

Radii: rounded-2xl cards, rounded-lg inputs, rounded-full pills.

Typography: Geist Variable, tracking-tight headings, tabular-nums numbers.

Icons: lucide-react. Collapse uses ChevronLeft/ChevronRight.

Tokens: text-muted-foreground, bg-background, border-white/10, bg-white/5, hover:bg-white/10, focus ring violet-500/40.

Controls: h-9 for filters/actions, h-8 w-8 for icon buttons.

Toast: fixed bottom-6 right-6 z-50 rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl.

5. Auth Flow
AuthContext calls GET /api/me on mount (401 → user = null).

Login: GET /sanctum/csrf-cookie → POST /api/login { client_type: 'spa' }.

Authenticated requests use apiFetch (sends X-XSRF-TOKEN).

Logout: POST /api/logout → clear context → /login.

ProtectedRoute redirects to /login if no user.

6. Theme Provider
Custom ThemeProvider (next-themes removed). Persists in localStorage.'karobardesk.theme'. Toggles dark class on <html>. Dark is default.

7. Setup Module
Reached via user dropdown (SA only). Not in sidebar.

pages/Setup.tsx: connection test card, 6 sync cards, activity panel.

api/sync.ts uses axios (auth flow), not apiFetch.

Sync token stored in React state (not persisted).

8. App Shell (AppLayout + AppSidebar)
Topbar: h-14, glass, sticky top z-40. Left brand. Right ThemeToggle + user dropdown (Setup & Sync for SA, Sign out).

Sidebar (layouts/AppSidebar.tsx): 240px expanded / 64px collapsed. Hidden below md. Collapse state in localStorage.'karobardesk.sidebar.collapsed'.

tsx
const NAV_ITEMS = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: 'dashboard' },
  { label: 'Users',        icon: UsersRound,      path: 'users',        roles: ['super_admin'] },
  { label: 'Companies',    icon: Building2,       path: 'companies',    roles: ['super_admin'] },
  { label: 'Items',        icon: Package,         path: 'items',        roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Price Lists',  icon: Tags,            path: 'price-lists',  roles: ['super_admin'] },
  { label: 'Item Prices',  icon: DollarSign,      path: 'item-prices',  roles: ['super_admin', 'admin'] },
  { label: 'Customers',    icon: Users,           path: 'customers' },
  { label: 'Stock',        icon: Warehouse,       path: 'stock',        roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Till Accounts',icon: CreditCard,      path: 'till-accounts',roles: ['super_admin', 'admin'] },
];
Role names use underscores. Setup & Sync stays in user dropdown.

AppLayout:

tsx
<div className="flex min-h-screen bg-background">
  <AppSidebar />
  <div className="flex min-w-0 flex-1 flex-col">
    <header>...</header>
    <main className="min-w-0 flex-1"><Outlet /></main>
  </div>
</div>
9. State Management
React Context for auth only.

Local component state for module data.

No global state library.

Refetch after mutations (no optimistic UI) — except Companies toggle-active (splices returned row).

10. API Clients
src/api/client.ts — axios instance (Auth & Setup). Handles CSRF automatically. 401 interceptor dispatches auth:unauthorized.

src/lib/apiFetch.ts — fetch wrapper (all modules). Reads XSRF-TOKEN, sends X-XSRF-TOKEN on unsafe methods. credentials: 'include'. Throws ApiError with .status, .errors.

Rule: new modules use lib/apiFetch.ts. No new axios calls.

11. Routing
Path	Element	Guard
/login	Login	Public; redirect if logged in
/	→ /dashboard	ProtectedRoute
/dashboard	Dashboard	ProtectedRoute
/setup	Setup	ProtectedRoute + SA
/users	Users	ProtectedRoute
/companies	Companies	ProtectedRoute + SA nav
/items	Items	ProtectedRoute
/price-lists	PriceLists	ProtectedRoute
/item-prices	ItemPrices	ProtectedRoute
/customers	Customers	ProtectedRoute
/stock	Stock	ProtectedRoute
/till-accounts	TillAccounts	ProtectedRoute + SA/Admin nav
*	→ /	—
All protected routes render inside AppLayout.

12. Adding a New Module — Pattern
src/modules/{feature}/types.ts — named type exports.

src/modules/{feature}/api.ts — named functions using lib/apiFetch. Use buildQueryString for GETs.

src/modules/{feature}/components/ — default exports (Table, Filters, Drawer, Dialogs, Badges).

src/pages/{Feature}.tsx — default export.

Route in App.tsx.

Nav item in NAV_ITEMS (AppSidebar.tsx).

Loading, empty, error states.

13. Conventions
TypeScript strict, verbatimModuleSyntax — import type for types.

Components: default export. api.ts/types.ts: named exports.

Every mutation via lib/apiFetch.ts.

Every drawer: createPortal(…, document.body) + h-[100dvh].

Every table: bare <table> inside overflow-x-auto.

Card lives in the page, not the table component.

Filters wrap themselves in the card class.

Row menus: portaled, w-40, glass panel.

useMemo for small client-side toggles.

Backend pagination for large datasets (50/page).

14. Constraints
No Node on cPanel. React built locally; dist/ uploaded.

Single subdomain, single origin. No CORS.

No Blade views for dashboard. API-only.

No Inertia. No SSR.

No h-screen on drawers — use h-[100dvh].

No native <select> — use Select.tsx or Combobox.tsx.

No overflow-hidden on cards containing portaled menus.

15. Current State (v1.5)
Working: Login, Sidebar, Dashboard (placeholder), Setup. Users (CRUD, ERPNext link, Edit Till). Companies (read-only, toggle active). Items (paginated, editable). Price Lists (read-only). Item Prices (paginated, "Find Unpriced"). Customers (paginated, editable operational fields). Stock (Balance + Ledger). Till Accounts (map + create). Theme toggle, Sign out.

Not built: Real Dashboard, Sales (POS + UI), Parcels, Shifts, Notifications, Mobile polish.

Known limitations: Dashboard placeholder, no global error boundary, window.confirm for destructive actions, no per-company re-sync.

16. Next Likely Modules
Sales (POS Checkout Middleware) — POST /api/pos/login, POST /api/pos/sales, POST /api/pos/returns, PATCH /api/pos/customers/{id}.

Sales UI (Viewer) — list, filters, drawer. Read-only.

Parcels — Courier booking + tracking.

Dashboard — Real KPIs.

17. Do Not
No native <select> — use Select.tsx (small) or Combobox.tsx (large).

No overflow-hidden on cards containing action menus.

No direct User.erpnext_user reads — use User.erpnext.{user, linked, last_tested_at, last_error}.

No mutations without lib/apiFetch.

No mixing named and default exports in the same component file.

No h-screen on drawers — use h-[100dvh] max-h-[100dvh].

No inline drawers — always createPortal(…, document.body).

No card wrapper inside table component — card lives in page.

No duplicate route registration.

No client-side filtering on paginated data — pass filters to backend.

No undefined in URLSearchParams — use buildQueryString loop.

No overwriting local edits with ERPNext nulls (Smart Sync Guard handles server-side).

No rendering nested objects directly ({till.priceList}) — use .name or || "—".

No frontend filtering on large paginated datasets.

18. Users Module (Phase 3) — Locked
Files: pages/Users.tsx; modules/users/api.ts (listUsers, getUser, createUser, updateUser, deactivateUser, activateUser, listRoles, listCompanies, linkErpNext, unlinkErpNext); modules/users/types.ts; modules/users/components/* (Table, Filters, Modals, Drawer, Badges, Select, EditTillDialog, LinkErpNextDialog).

Create user: Modal (name, username, email, password, primary company, company access pills, roles pills, is_active). No ERPNext fields. POST /api/users → 201.

Link to ERPNext: Drawer → "Link to ERPNext" → LinkErpNextDialog (erpnext_user + erpnext_password) → POST /api/users/{id}/erpnext/link. Backend logs in, fetches till, upserts, returns user. On failure: inline error, nothing saved.

Unlink: Drawer → Unlink (when linked) → window.confirm → DELETE /api/users/{id}/erpnext/unlink. Drawer refreshes.

Edit Till (v1.4): Drawer → "Edit Till" → EditTillDialog. Fields: Till No, Price List (Combobox), Shop Name, Address, Phone, Return PIN, Allow Rate, Is Online. Warehouse locked. PUT /api/till-accounts/{till}. Drawer refreshes.

Super Admin protection: SA row shows "Protected" pill, no row menu. Backend 403s update/deactivate/link/unlink for SA. SA role cannot be assigned via API.

Drawer state: user prop mirrored to local current state. onUserUpdated callback refreshes parent list.

19. Sidebar (AppSidebar.tsx)
Full spec in Section 8. To add nav items: import icon, add one entry to NAV_ITEMS with { label, icon, path, roles? }. Role names use underscores. roles omitted = visible to all.

20. CSRF — apiFetch.ts
Location: src/lib/apiFetch.ts. Exports: apiFetch<T>(path, options): Promise<T>, ApiError (with .status, .errors, .message).

Behavior: credentials: 'include', Accept: application/json, Content-Type: application/json when body present. On unsafe methods: ensures XSRF-TOKEN cookie (fetches /sanctum/csrf-cookie if missing), reads cookie, sends X-XSRF-TOKEN header.

Why: Sanctum SPA mode requires CSRF header on every unsafe method. Without it: "CSRF token mismatch".

Rule: every mutation in every module uses apiFetch. Never raw fetch.

21. Portaled Dropdowns
Components using createPortal:

modules/users/components/Select.tsx

RowActionMenu in UsersTable.tsx

RowMenu in CompaniesTable.tsx, ItemsTable.tsx, ItemPricesTable.tsx, CustomersTable.tsx

CompanyDetailDrawer.tsx, UserDetailDrawer.tsx (whole drawer)

@/components/ui/Combobox.tsx

Pattern: getBoundingClientRect() → createPortal(panel, document.body) → position: fixed, top/left from coords → z-[100] → close on outside click, Escape, scroll.

Why: parent cards have overflow-x-auto or rounded corners that clip absolute dropdowns. Portal bypasses clipping.

Rule: any dropdown near a table/card edge uses portal, not absolute positioning.

22. Known Pattern Failures (Do Not Repeat)
Native <select> with dark theme → OS-default white/blue. Use Select.tsx/Combobox.tsx.

overflow-hidden on table card clips dropdowns.

axios vs apiFetch — standardized on apiFetch.

Direct user.erpnext_user reads — use user.erpnext.

Vite proxy missing /sanctum → CSRF prefetch silently fails.

Passing role names instead of IDs to sync() — backend resolves names → IDs; frontend sends names.

Named vs default export mismatch — components default, api.ts/types.ts named. Mixing causes "does not provide an export named X".

h-screen on drawer cuts footer — use h-[100dvh].

Inline drawer — ancestor transform/filter/backdrop-blur breaks position: fixed. Use portal.

Missing min-h-0 on flex-1 body — footer pushed off-screen.

Duplicate route registration — last wins silently.

/companies/{company} before /companies/admin — "admin" bound as {company}, 404. Static before parameter.

Resource namespace mismatch — App\Http\Resources\Api\CompanyResource must live at app/Http/Resources/Api/CompanyResource.php.

404 on static routes — /items/unpriced registered AFTER /items/{item} binds "unpriced" as ID. Static above parameter.

Pagination mismatch — backend returns { data: [], meta: { current_page, last_page, total } }. Frontend expecting an array breaks.

Vite HMR cache on exports — new export missing? Stop dev server, restart, hard-refresh.

Rendering objects as children — {till.priceList} → "Objects are not valid as a React child". Use .name or || "—".

Undefined in TSX — nullable fields need || "—" fallback.

23. Phase Status
Phase	Status
Phase 1 — Master Data Sync	COMPLETE
Phase 2 — Webhook-Driven Updates	DEFERRED
Phase 3 — Users Module	COMPLETE
Phase 4 — Master Data UI	COMPLETE
Phase 4b — Stock & Till Accounts	COMPLETE
Phase 5 — Operational modules	NEXT
— Sales (POS Checkout Middleware)	NEXT
— Sales UI (Viewer)	PENDING
— Parcels	PENDING
— Dashboard	PENDING
Immediate next: Sales (POS Checkout Middleware) — see Section 16 and Section 34.

24. Companies Module (Phase 4) — Locked
Files: pages/Companies.tsx; modules/companies/api.ts (listCompanies, getCompany, toggleCompanyActive); modules/companies/types.ts; modules/companies/components/* (Table, Filters, Drawer).

Backend routes:

text
GET    /api/companies                          → picker (active only)
GET    /api/companies/admin                    → listAll (all + counts)
GET    /api/companies/{company}                → show (single + counts)
PATCH  /api/companies/{company}/toggle-active  → toggleActive
Company shape:

ts
{
  id, name, code, erpnext_company,
  is_active, sync_status, last_synced_at, erpnext_modified_at,
  users_count, accounts_count, till_operations_count,
  created_at, updated_at
}
Columns: Name / ERPNext company / Code / Users / Sync status / Last synced / Active / Actions.

Row actions: View details → CompanyDetailDrawer. Deactivate / Activate → PATCH .../toggle-active. No Re-sync (deferred).

Filters (client-side): Search (name, code, erpnext_company), Active (all/active/inactive), Sync (all/synced/pending/processing/retrying/failed). Reset button when filtered. Count: "N of M" or "M total".

Drawer: Portaled, h-[100dvh]. Header: name + erpnext_company + X. Body: Status/Identity/Linked records/Sync/Record sections. Footer: Refresh + Deactivate/Activate. Escape + backdrop close.

Sidebar: { label: 'Companies', icon: Building2, path: 'companies', roles: ['super_admin'] }

Deferred: Re-sync, Create, Delete, ERPNext link/unlink (N/A).

25. Locked Patterns (Post-Phase 4b, v1.5)
Export Convention — LOCKED
Every file under modules/*/components/ → default export.

api.ts → named exports.

types.ts → named type exports.

Component file may export named siblings (constants, types) alongside default:

tsx
export const DEFAULT_X_FILTERS: XFilterState = {...};
export interface XFilterState {...}
export default function XFilters(...) {}
Import rules:

tsx
import MyComponent from "./MyComponent";                              // component
import { listX, getX } from "../api";                                 // function
import type { X } from "../types";                                    // type
import MyComponent, { CONST, type FilterState } from "./MyComponent"; // mixed siblings
Why locked: mixing named + default for the same component caused three runtime errors during Phase 4.

Drawer Pattern — LOCKED
Every detail drawer MUST:

Render via createPortal(content, document.body) — never inline.

Use h-[100dvh] max-h-[100dvh] on <aside> — NOT h-screen.

Structure: flex flex-col + shrink-0 header + min-h-0 flex-1 overflow-y-auto no-scrollbar body + shrink-0 footer.

Backdrop: fixed inset-0 z-40 bg-black/60 backdrop-blur-sm.

Panel: fixed right-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl.

Support Escape + backdrop click close.

Footer buttons always visible.

no-scrollbar CSS in src/index.css:

css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
Why locked: missing min-h-0 or h-[100dvh] cuts the footer. Portal sidesteps ancestor transform/filter/backdrop-blur.

Page Shell Pattern — LOCKED
tsx
<div className="mx-auto max-w-[1400px] space-y-6 p-6">
  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Title</h1>
      <p className="text-sm text-muted-foreground">Subtitle.</p>
    </div>
    <Button variant="ghost" ...>...</Button>
  </div>

  <Filters ... />

  {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>}

  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
    <Table ... />
  </div>

  {/* Drawer + Toast */}
</div>
Title: text-xl font-semibold tracking-tight. Subtitle: text-sm text-muted-foreground. Card: rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl. Toast: fixed bottom-6 right-6 z-50 rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl.

Table Pattern — LOCKED
Table component renders ONLY <table> inside <div className="overflow-x-auto">. No card wrapper.

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
    </tr>
  </tbody>
</table>
Loading: 4 skeleton rows (h-14 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]). Empty: centered py-16, "No X found" + "Try adjusting your filters."

Filters Pattern — LOCKED
Wraps itself in card class:

tsx
<div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
  <div className="flex flex-wrap items-center gap-3">
    {/* Search (h-9, pl-9 for icon) */}
    {/* Selects (h-9) */}
    {/* Reset (h-9, only when filtered) */}
    {/* Count (ml-auto) */}
  </div>
</div>
Search input: h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20.

Reset: inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground.

All controls share h-9.

Row Action Menu Pattern — LOCKED
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
</div>
Position: top: rect.bottom + 6, left: rect.right - 160. Icon: MoreVertical (not MoreHorizontal). Destructive: text-amber-400 (deactivate), text-emerald-400 (activate). Close on outside click, Escape.

Server-Side Pagination — LOCKED
Backend: ->paginate(50) returning { data: [], meta: { current_page, last_page, total } }.

Frontend: page holds page state + filter params. Table renders data. Pagination bar renders from meta. Filter change re-triggers fetch.

Use buildQueryString to skip undefined/null.

Combobox Pattern — LOCKED
@/components/ui/Combobox.tsx for large datasets (Items, Customers).

Accepts options: { value, label, sublabel? }[].

Select.tsx for small fixed lists.

Local Filtering — LOCKED
For small toggles like "Hide Zero Stock", use useMemo on the frontend for instant feedback. Do NOT hit the API for these.

Relation Rendering — LOCKED
Nested objects (e.g., till.priceList) must be accessed via .name or fallback || "—":

tsx
{till.priceList?.name ?? "—"}
26. Backend Resource Namespace Rule
Resources live under the namespace of the consuming controller:

Controller namespace	Resource namespace	Example
App\Http\Controllers\Api\*	App\Http\Resources\Api\*	Api\CompanyResource
App\Http\Controllers\Users\*	App\Http\Resources\Users\*	Users\UserListResource
Path must match namespace: App\Http\Resources\Api\CompanyResource → app/Http/Resources/Api/CompanyResource.php. Mismatch → "Class not found".

27. Route Ordering Rule
Static segments BEFORE parameter segments.

/companies/admin before /companies/{company} — else "admin" bound as {company}, 404.

/sync/login before /sync/{step}.

/items/unpriced, /items/picker before /items/{item}.

Route path registered exactly ONCE.

28. Phase Status (Detail)
Phase	Detail
Phase 1 — Master Data Sync	Backend SyncController, ErpNextClient. Frontend pages/Setup.tsx, setup/.
Phase 3 — Users Module	Backend UserController, ErpNextUserService, User::$appends = ['erpnext']. Frontend pages/Users.tsx, modules/users/.
Phase 4 — Master Data UI	Backend controllers + resources for Companies, Items, Price Lists, Item Prices, Customers. Frontend pages + modules for each.
Phase 4b — Stock & Till Accounts	Backend StockController, TillAccountController, AccountController@store. Frontend pages/Stock.tsx, pages/TillAccounts.tsx.
Phase 2 — Webhooks	DEFERRED.
Phase 5 — Operational	NEXT: Sales. PENDING: Sales UI, Parcels, Dashboard.
29. Items Module (Phase 4) — Locked
Files: pages/Items.tsx, modules/items/* (api, types, Table, Filters, Drawer, EditDialog).

Backend: ItemController (index, listAll, show, update, pickerAll, unpricedItems). ItemResource with 7 counts. UpdateItemRequest (13 editable fields).

Features:

Paginated (50/page), backend filters (search, item_group, is_active, sync_status, hide_internal).

Raw Material hidden by default via hide_internal toggle.

Editable local fields for SA/Admin/Manager (item_update audit).

Uses Combobox for item selection in other modules.

30. Price Lists Module (Phase 4) — Locked
Files: pages/PriceLists.tsx, modules/price-lists/*.

Backend: PriceListController (index, listAll, show). PriceListResource with item_prices_count, till_operations_count.

Features: Read-only list (small dataset, no pagination). Drawer has "View prices →" link to /item-prices?price_list={id}.

31. Item Prices Module (Phase 4) — Locked
Files: pages/ItemPrices.tsx, modules/item-prices/* (api, types, Table, Filters, Drawer, EditDialog, CreateDialog, UnpricedItemsDialog).

Backend: ItemPriceController (index, listAll, show, store, update). Duplicate check on (price_list_id, item_id) → 422.

Features:

Paginated (50/page). SA/Admin can edit/create.

Find Unpriced Items: UnpricedItemsDialog queries /api/items/unpriced, allows adding prices with pre-filled defaults.

Audits: item_price_create, item_price_update.

32. Customers Module (Phase 4) — Locked
Files: pages/Customers.tsx, modules/customers/* (api, types, Table, Filters, Drawer, EditDialog).

Backend: CustomerController (index, listAll, show, update). UpdateCustomerRequest accepts operational fields only (phone, email, address, city, country, tax_number, is_active).

Features:

Paginated (50/page).

Any authenticated user can edit operational fields (courier slip needs).

Financial/loyalty fields read-only.

Smart Sync Guard: ERPNext nulls never overwrite local phone/address.

Audit: customer_update.

Sidebar visible to all roles.

33. Stock Module (Phase 4b) — Locked
Files: pages/Stock.tsx, modules/stock/* (api, types, StockBalancesTable, StockFilters, StockLedgerDrawer).

Backend: StockController (companies, balances, ledger). ErpNextSyncService@syncItemStocks fetches from ERPNext Bin (Finished Goods only, active companies only).

Features:

Stock Balance: Opening, In, Out, Closing columns. Company dropdown, Date Range (defaults Today), Hide Zero toggle (client-side via useMemo).

Stock Ledger: Drawer with date filters and opening/closing summaries. Reads stock_ledgers.

StockLedger tracks every movement (Sales, Returns, Adjustments).

34. Till Accounts Module (Phase 4b) — Locked
Files: pages/TillAccounts.tsx, modules/accounts/* (api, types, Modals).

Backend: TillAccountController (tills, show, update, store). AccountController@store creates local accounts. TillOperationAccount pivot with is_default boolean cast.

Features:

Select Cashier dropdown.

List of company accounts with checkboxes.

"Create Account" modal for local accounts (Credit, Shipping).

Set default account.

Edit Till dialog integrated into Users drawer.

Sidebar: { label: 'Till Accounts', icon: CreditCard, path: 'till-accounts', roles: ['super_admin', 'admin'] }

35. POS Middleware Integration (Phase 5 — Upcoming)
Not yet built on the frontend. Backend endpoints are locked (see KarobarDesk_Locked_Context_v5.8.md §55):

POST /api/pos/login — IBPOS bearer token auth.

POST /api/pos/sales — checkout with stock guard (lockForUpdate on item_stocks).

POST /api/pos/returns — restock items.

PATCH /api/pos/customers/{id} — cashier address changes.

When building the Sales UI Viewer (read-only, phase 5 second step), it will follow the standard module pattern (Section 12) and locked patterns (Section 25).

36. Cross-References
Backend context (v5.8):

Section 40 — All Decisions Locked, Current State

Section 41 — Auth API Reference

Section 43 — ERPNext User Linking Rules

Section 44 — Frontend Module Conventions (backend-side)

Section 45 — Phase Status

Section 46 — ERPNext Verified Facts

Section 47 — Error Handling Standards

Section 48 — Companies Module (backend)

Section 49 — Items Module (backend)

Section 50 — Price Lists Module (backend)

Section 51 — Item Prices Module (backend)

Section 52 — Customers Module (backend)

Section 53 — Stock Module (backend)

Section 54 — Till Accounts Module (backend)

Section 55 — POS Middleware Architecture

