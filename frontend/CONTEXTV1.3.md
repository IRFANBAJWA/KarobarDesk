# KarobarDesk — Frontend Context

Version: 1.3
Status: Living document — update as frontend evolves
Scope: React SPA only. Backend details live in KarobarDesk_Locked_Context_v5.6.md.
Path: E:\AIOPOS-Development\KarobarDesk\frontend

Changelog (1.2 → 1.3)
- Phase 4 Master Data Modules (Items, Price Lists, Item Prices, Customers) COMPLETE.
- **Pagination Locked:** All master data tables use server-side pagination (50/page).
- **Combobox Created:** Replaced basic Select for large lists (Items, Customers) with a searchable `Combobox.tsx`.
- **Unpriced Items Feature:** Added modal in Item Prices to find and add missing item prices.
- **Smart Sync Guard:** Backend sync ignores null values to protect local cashier edits.
- **API Query Strings:** Introduced `buildQueryString` helper to prevent `undefined` URL errors.
- Section 8 (Sidebar) updated with all new nav items.
- Section 15 (Current State) updated.
- Section 16 (Next Modules) updated — Sales is next.
- Section 17 (Do Not) extended with pagination and combobox rules.
- Section 22 (Known Pattern Failures) extended with route binding and pagination issues.
- Section 25 (Locked Patterns) updated with Pagination, Combobox, and Search.
- Sections 29-33 added (Items, Price Lists, Item Prices, Customers).
- Section 34 (Phase Status) updated.

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
```text
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
│ ├── ui
│ │ ├── button.tsx, card.tsx, input.tsx, label.tsx
│ │ └── Combobox.tsx ← NEW in 1.3 (searchable dropdown)
│ ├── badges
│ │ ├── ActiveStatusBadge.tsx ← Moved from modules in 1.3
│ │ └── SyncStatusBadge.tsx ← Moved from modules in 1.3
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
│ ├── Companies.tsx
│ ├── Items.tsx ← NEW in 1.3
│ ├── PriceLists.tsx ← NEW in 1.3
│ ├── ItemPrices.tsx ← NEW in 1.3
│ └── Customers.tsx ← NEW in 1.3
├── setup
│ ├── syncSteps.ts
│ ├── ConnectionCard.tsx
│ ├── SyncCard.tsx
│ └── ActivityPanel.tsx
├── modules
│ ├── users
│ │ ├── api.ts, types.ts
│ │ └── components (Modal, Select, Table, Filters, Drawers, Dialogs, Badges)
│ ├── companies
│ │ ├── api.ts, types.ts
│ │ └── components (Table, Filters, Drawer)
│ ├── items ← NEW in 1.3
│ │ ├── api.ts, types.ts
│ │ └── components (Table, Filters, Drawer, EditDialog)
│ ├── price-lists ← NEW in 1.3
│ │ ├── api.ts, types.ts
│ │ └── components (Table, Filters, Drawer)
│ ├── item-prices ← NEW in 1.3
│ │ ├── api.ts, types.ts
│ │ └── components (Table, Filters, Drawer, EditDialog, CreateDialog, UnpricedItemsDialog)
│ └── customers ← NEW in 1.3
│ ├── api.ts, types.ts
│ └── components (Table, Filters, Drawer, EditDialog)
├── types
│ ├── auth.ts
│ └── sync.ts
└── lib
├── utils.ts cn() — clsx + tailwind-merge
└── apiFetch.ts fetch wrapper — CSRF + credentials
4. Design System
[unchanged]

5. Auth Flow
[unchanged]

6. Theme Provider
[unchanged]

7. Setup Module
[unchanged]

8. App Shell (AppLayout + AppSidebar)
Topbar: h-14, glass, sticky top z-40. Left brand, Right ThemeToggle, user dropdown.

Sidebar (layouts/AppSidebar.tsx):

240px expanded / 64px collapsed

Hidden below md breakpoint

Collapse state persisted in localStorage.

NAV_ITEMS array — the single source of truth for nav

tsx
const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { label: 'Users',     icon: UsersRound,      path: 'users',      roles: ['super_admin'] },
  { label: 'Companies', icon: Building2,       path: 'companies',  roles: ['super_admin'] },
  { label: 'Items',     icon: Package,         path: 'items',      roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Price Lists', icon: Tags,          path: 'price-lists', roles: ['super_admin'] },
  { label: 'Item Prices', icon: DollarSign,    path: 'item-prices', roles: ['super_admin', 'admin'] },
  { label: 'Customers', icon: Users,           path: 'customers' }, // All roles can see
];
9. State Management
[unchanged]

10. API Clients
Two clients, two purposes.

src/api/client.ts — axios instance (Auth & Setup)
src/lib/apiFetch.ts — fetch wrapper (All modules)

Reads XSRF-TOKEN cookie, sends X-XSRF-TOKEN on POST/PUT/PATCH/DELETE.

Throws ApiError with .status and .errors for 422s.

Rule for new modules: use lib/apiFetch.ts.

11. Routing
All protected routes render inside AppLayout.
Paths: /login, /dashboard, /setup, /users, /companies, /items, /price-lists, /item-prices, /customers.

12. Adding a New Module — Pattern
modules/{feature}/types.ts

modules/{feature}/api.ts (Use buildQueryString for GETs)

modules/{feature}/components/ (Table, Filters, Drawer, Dialog)

pages/{Feature}.tsx

Route in App.tsx

Nav item in AppSidebar.tsx

13. Conventions
[unchanged]

14. Constraints
[unchanged]

15. Current State
Working:

Login, Sidebar, Dashboard (placeholder), Setup.

Users (CRUD, ERPNext link).

Companies (Read-only, toggle active).

Items (Paginated, backend filters, editable local fields for SA/Admin/Mgr).

Price Lists (Read-only).

Item Prices (Paginated, editable, "Find Unpriced Items" modal).

Customers (Paginated, editable operational fields for all users).

Not built:

Real dashboard (KPIs, charts)

Sales / Stock / Parcels / Shifts

Known limitations:

Dashboard is an empty placeholder

No global error boundary

16. Next Likely Modules
In order:

Sales — POS cart, Invoice list, returns.

Parcels — Courier booking, AWB slips.

Dashboard — Real KPIs from synced data.

17. Do Not
[unchanged, plus:]

Do not do client-side filtering on paginated data. Pass filters to the backend.

Do not use native <select> for lists > 20 items. Use Combobox.tsx.

Do not pass undefined to URLSearchParams. Use the buildQueryString loop.

Do not overwrite local user edits (cashier address fixes) with null from ERPNext during sync.

18. Users Module (Phase 3) — Locked
[unchanged]

19. Sidebar (AppSidebar.tsx)
[See section 8 for updated NAV_ITEMS]

20. CSRF — apiFetch.ts
[unchanged]

21. Portaled Dropdowns
[unchanged, plus:]

@/components/ui/Combobox.tsx is also portaled to document.body and used for large datasets.

22. Known Pattern Failures (Do Not Repeat)
[unchanged, plus:]

NEW: 404 on custom static routes. Registering /items/unpriced AFTER /items/{item} causes Laravel to bind "unpriced" as the {item} ID. Static routes MUST go above parameter routes.

NEW: Pagination Metadata mismatch. Backend paginated responses return { data: [], meta: { current_page, last_page, total } }. If the frontend expects just an array, it will break.

NEW: Vite HMR cache failure on exports. If you add a new export to api.ts but the browser says it's missing, stop the dev server (Ctrl+C), restart it, and hard-refresh.

23. Phase Status
[unchanged]

24. Companies Module (Phase 4) — Locked
[unchanged]

25. Locked Patterns (Post-Phase 4, v1.3)
Export convention — LOCKED
Every file under modules/*/components/ uses a DEFAULT export.
api.ts uses NAMED exports.
types.ts uses NAMED type exports.

Drawer pattern — LOCKED
Must use createPortal(content, document.body).
Must use h-[100dvh] max-h-[100dvh] on <aside>.
Must use flex flex-col with shrink-0 header, min-h-0 flex-1 overflow-y-auto no-scrollbar body, shrink-0 footer.

Page shell pattern — LOCKED
Wrapper: mx-auto max-w-[1400px] space-y-6 p-6.
Table card lives in the page, not the table component.

Table pattern — LOCKED
Bare <table> inside <div className="overflow-x-auto">.

Filters pattern — LOCKED
Wraps itself in the card class. Controls use h-9.

Row action menu pattern — LOCKED
Portaled, w-40, rounded-xl glass panel. Top/Left from rect.bottom + 6, rect.right - 160.

Server-Side Pagination — LOCKED

Backend: ->paginate(50) returning { data: [], meta: {} }.

Frontend: Page holds page state. Table renders data. Pagination bar renders from meta. Passing filters re-triggers the fetch.

Search/Api: Use buildQueryString to skip undefined values.

Combobox Pattern — LOCKED

@/components/ui/Combobox.tsx used for Items, Customers.

Accepts options as { value, label, sublabel? }[].

Select.tsx used for small fixed lists.

26. Backend Resource Namespace Rule
[unchanged]

27. Route Ordering Rule
[unchanged, plus:]

/items/unpriced, /items/picker before /items/{item}.

28. Phase Status (Detail)
[unchanged]

29. Items Module (Phase 4) — Locked
Files: pages/Items.tsx, modules/items/*.
Backend: ItemController (index, listAll, show, update, pickerAll, unpricedItems).
Features:

Paginated (50/page), backend filters (search, item_group, is_active, sync_status, hide_internal).

Raw Material hidden by default via toggle.

Editable local fields for SA/Admin/Manager (audited).

Uses Combobox for Item selection in other modules.

30. Price Lists Module (Phase 4) — Locked
Files: pages/PriceLists.tsx, modules/price-lists/*.
Backend: PriceListController (index, listAll, show).
Features: Read-only. Drawer has "View prices →" link to /item-prices?price_list={id}.

31. Item Prices Module (Phase 4) — Locked
Files: pages/ItemPrices.tsx, modules/item-prices/*.
Backend: ItemPriceController (index, listAll, show, store, update).
Features:

Paginated (50/page).

SA/Admin can edit/create.

Find Unpriced Items: Opens UnpricedItemsDialog which queries /api/items/unpriced. Allows adding prices with pre-filled defaults.

32. Customers Module (Phase 4) — Locked
Files: pages/Customers.tsx, modules/customers/*.
Backend: CustomerController (index, listAll, show, update).
Features:

Paginated (50/page).

Any authenticated user can edit phone, email, address, city, country, tax_number, is_active.

Financial/loyalty fields locked.

Smart Sync Guard ensures local address edits aren't overwritten by nulls from ERPNext.

End of frontend context.