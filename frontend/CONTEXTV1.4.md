 KarobarDesk — Frontend Context

Version: 1.4
Status: Living document — update as frontend evolves
Scope: React SPA only. Backend details live in KarobarDesk_Locked_Context_v5.7.md.
Path: E:\AIOPOS-Development\KarobarDesk\frontend

Changelog (1.3 → 1.4)
- Phase 4b (Stock & Till Accounts) COMPLETE.
- **Stock Module:** Added Stock Balance table (Opening/In/Out/Closing) and Stock Ledger drawer with date filters.
- **Till Accounts:** Added page to map payment accounts to cashiers. Added "Create Account" modal for local accounts (Credit/Shipping).
- **User Drawer:** Added EditTillDialog to manage Till No, Price List, Return PIN, and Allow Rate toggles.
- **Sidebar:** Added Stock and Till Accounts routes.
- **Frontend Filtering:** Locked the pattern for frontend `useMemo` filtering for "Hide Zero Stock" on small datasets.
- **Relation Rendering:** Documented how to handle nested objects (e.g., `till.priceList.name`) to avoid "Objects are not valid as a React child" crashes.

---

## 1. Purpose
[unchanged]

## 2. Stack
[unchanged]

## 3. Folder Structure
```text
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
│ ├── client.ts
│ └── sync.ts
├── auth
├── theme
├── components
│ ├── ui
│ │ ├── button.tsx, card.tsx, input.tsx, label.tsx
│ │ └── Combobox.tsx
│ ├── badges
│ │ ├── ActiveStatusBadge.tsx
│ │ └── SyncStatusBadge.tsx
│ └── glass/GlassCard.tsx
├── routes
├── layouts
├── pages
│ ├── Login.tsx
│ ├── Dashboard.tsx
│ ├── Setup.tsx
│ ├── Users.tsx
│ ├── Companies.tsx
│ ├── Items.tsx
│ ├── PriceLists.tsx
│ ├── ItemPrices.tsx
│ ├── Customers.tsx
│ ├── Stock.tsx ← NEW in 1.4
│ └── TillAccounts.tsx ← NEW in 1.4
├── setup
├── modules
│ ├── users
│ │ ├── api.ts, types.ts
│ │ └── components (Modal, Select, Table, Filters, Drawers, Dialogs, Badges)
│ │ └── EditTillDialog.tsx ← NEW in 1.4
│ ├── companies
│ ├── items
│ ├── price-lists
│ ├── item-prices
│ ├── customers
│ ├── stock ← NEW in 1.4
│ │ ├── api.ts, types.ts
│ │ └── components (StockBalancesTable, StockFilters, StockLedgerDrawer)
│ └── accounts ← NEW in 1.4
│ ├── api.ts, types.ts
│ └── components (Modals)
├── types
└── lib
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
  { label: 'Customers', icon: Users,           path: 'customers' },
  { label: 'Stock', icon: Warehouse,           path: 'stock', roles: ['super_admin', 'admin', 'manager'] }, // NEW
  { label: 'Till Accounts', icon: CreditCard,  path: 'till-accounts', roles: ['super_admin', 'admin'] }, // NEW
];
9. State Management
[unchanged]

10. API Clients
Two clients, two purposes.

src/api/client.ts — axios instance (Auth & Setup)

src/lib/apiFetch.ts — fetch wrapper (All modules)
Rule: every mutation in every module uses apiFetch.

11. Routing
Paths: /login, /dashboard, /setup, /users, /companies, /items, /price-lists, /item-prices, /customers, /stock, /till-accounts.

12. Adding a New Module — Pattern
[unchanged]

13. Conventions
[unchanged]

14. Constraints
[unchanged]

15. Current State
Working:

Login, Sidebar, Dashboard (placeholder), Setup.

Users (CRUD, ERPNext link, Edit Till).

Companies (Read-only, toggle active).

Items (Paginated, backend filters, editable local fields).

Price Lists (Read-only).

Item Prices (Paginated, editable, "Find Unpriced Items" modal).

Customers (Paginated, editable operational fields).

Stock: Balance table with dates + Ledger drawer.

Till Accounts: Map accounts to cashiers, create custom local accounts.

Not built:

Real dashboard (KPIs, charts)

Sales / Parcels

16. Next Likely Modules
In order:

Sales (POS Checkout Middleware)

Sales UI (Viewer)

Parcels

Dashboard

17. Do Not
[unchanged, plus:]

Do not render nested objects directly in JSX (e.g., {till.priceList}). Use {till.priceList?.name} or check typeof === 'object'.

Do not filter large paginated datasets on the frontend. Pass filters to the backend.

Do not use h-screen. Use h-[100dvh].

18. Users Module (Phase 3) — Locked
[unchanged, plus:]

Drawer now includes EditTillDialog to update Till Number, Price List, Return PIN, Allow Rate, and Online status.

19. Sidebar (AppSidebar.tsx)
[See section 8 for updated NAV_ITEMS]

20. CSRF — apiFetch.ts
[unchanged]

21. Portaled Dropdowns
[unchanged]

22. Known Pattern Failures (Do Not Repeat)
[unchanged, plus:]

NEW: Rendering objects as React children. When the backend loads relations (e.g., priceList), the frontend must extract the .name property.

NEW: undefined variables in TSX. Always add fallback || "—" for nullable fields like address or return_pin.

23. Phase Status
[unchanged]

24. Companies Module (Phase 4) — Locked
[unchanged]

25. Locked Patterns (Post-Phase 4b, v1.4)
Export convention: Default for components, Named for API/types.

Drawer pattern: createPortal + h-[100dvh] + min-h-0 body.

Page shell: mx-auto max-w-[1400px] space-y-6 p-6.

Table pattern: Bare <table> inside overflow-x-auto.

Filters pattern: Wraps itself in card class.

Row action menu: Portaled w-40 glass panel.

Server-Side Pagination: ->paginate(50), frontend uses meta.

Combobox: Used for Items, Customers.

Local Filtering (NEW): For small toggles like "Hide Zero Stock", use useMemo on the frontend for instant feedback instead of hitting the API.

26. Backend Resource Namespace Rule
[unchanged]

27. Route Ordering Rule
[unchanged]

28. Phase Status (Detail)
[unchanged]

29. Items Module (Phase 4) — Locked
[unchanged]

30. Price Lists Module (Phase 4) — Locked
[unchanged]

31. Item Prices Module (Phase 4) — Locked
[unchanged]

32. Customers Module (Phase 4) — Locked
[unchanged]

33. Stock Module (Phase 4b) — Locked
Files: pages/Stock.tsx, modules/stock/*.
Backend: StockController (companies, balances, ledger).
Features:

Stock Balance: Opening, In, Out, Closing.

Filters: Company dropdown, Date Range (defaults to Today), Hide Zero toggle.

Stock Ledger: Drawer with date filters and opening/closing summaries.

34. Till Accounts Module (Phase 4b) — Locked
Files: pages/TillAccounts.tsx, modules/accounts/*.
Backend: TillAccountController (tills, show, update, store).
Features:

Select Cashier dropdown.

List of Company accounts with checkboxes.

"Create Account" modal for local accounts (Credit, Shipping).

Set default account.

End of frontend context.