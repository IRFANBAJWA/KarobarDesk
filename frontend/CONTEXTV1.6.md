KarobarDesk — Frontend Context
Version: 1.6
Status: Living document — update as frontend evolves
Scope: React SPA only. Backend details live in KarobarDesk_Locked_Context_v5.9.md.
Path: E:\AIOPOS-Development\KarobarDesk\frontend

Changelog (1.5 → 1.6)
Phase 5 (Operational Modules) COMPLETE.

Sales Module: Sales Table with Sync Status, ERPNext Ref. Drawer with Account Summaries and Error display.
Queue Monitor: Admin-only page to monitor Pending Jobs, Failed Jobs, and Stuck Invoices. One-click Retry.
Shifts Module: Table showing O/C (Open/Closed), Working Hours, and Account summaries. Filters by Date, Company, and User.
Day Closings Module: Auto-generated per cashier when shifts close. Drawer shows Cash Denominations, Expected vs Actual Cash.
Journal Entries (Expenses): Full double-entry (Dr/Cr) data entry modal. Auto-balancing validation. Pushes to ERPNext via Sync Job.
Thermal Receipts: Added print/view components for Shift Close and Day Close (80mm layout + WhatsApp Share).

1. Purpose
Living frontend context for the KarobarDesk React SPA. Covers stack, folder layout, locked patterns, per-module specs, known failures, phase status. Backend contract details live in KarobarDesk_Locked_Context_v5.9.md.

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
    │   ├── Login.tsx, Dashboard.tsx, Setup.tsx, Users.tsx, Companies.tsx
    │   ├── Items.tsx, PriceLists.tsx, ItemPrices.tsx, Customers.tsx
    │   ├── Stock.tsx, TillAccounts.tsx
    │   ├── Sales.tsx               ← Added (Phase 5)
    │   ├── Shifts.tsx              ← Added (Phase 5)
    │   ├── DayClosings.tsx         ← Added (Phase 5)
    │   ├── JournalEntries.tsx      ← Added (Phase 5)
    │   └── QueueMonitor.tsx        ← Added (Phase 5)
    ├── setup/
    ├── modules
    │   ├── users/, companies/, items/, price-lists/, item-prices/, customers/, stock/, accounts/
    │   ├── sales/                  ← Added
    │   ├── shifts/                 ← Added
    │   ├── day-closings/           ← Added
    │   ├── journal-entries/        ← Added
    │   └── queue/                  ← Added
    ├── types
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

Sidebar (layouts/AppSidebar.tsx): 240px expanded / 64px collapsed. Hidden below md. Collapse state in localStorage.'karobardesk.sidebar.collapsed'. Inner scroll enabled with `.custom-scrollbar`.

tsx
const NAV_ITEMS = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Users',        icon: UsersRound,      path: '/users',        roles: ['super_admin'] },
  { label: 'Companies',    icon: Building2,       path: '/companies',    roles: ['super_admin'] },
  { label: 'Items',        icon: Package,         path: '/items',        roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Price Lists',  icon: Tags,            path: '/price-lists',  roles: ['super_admin'] },
  { label: 'Item Prices',  icon: DollarSign,      path: '/item-prices',  roles: ['super_admin', 'admin'] },
  { label: 'Sales',        icon: Receipt,         path: '/sales',        roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Customers',    icon: Users,           path: '/customers' },
  { label: 'Stock',        icon: Warehouse,       path: '/stock',        roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Till Accounts',icon: CreditCard,      path: '/till-accounts',roles: ['super_admin', 'admin'] },
  { label: 'Queue Monitor',icon: Activity,        path: '/queue-monitor',roles: ['super_admin'] },
  { label: 'Shifts',       icon: Clock,           path: '/shifts',       roles: ['super_admin', 'admin', 'manager'] },
  { label: 'Day Closings', icon: CalendarDays,    path: '/day-closings' },
  { label: 'Expenses',     icon: FileText,        path: '/journal-entries' },
];

9. State Management
React Context for auth only. Local component state for module data. No global state library. Refetch after mutations (no optimistic UI) — except Companies toggle-active (splices returned row).

10. API Clients
src/api/client.ts — axios instance (Auth & Setup).
src/lib/apiFetch.ts — fetch wrapper (all modules). Reads XSRF-TOKEN, sends X-XSRF-TOKEN on unsafe methods. credentials: 'include'. Throws ApiError with .status, .errors.
Rule: new modules use lib/apiFetch.ts. No new axios calls.

11. Routing
Path	Element	Guard
/login	Login	Public
/ → /dashboard	ProtectedRoute
/dashboard	Dashboard	ProtectedRoute
/setup	Setup	ProtectedRoute + SA
/users	Users	ProtectedRoute
/companies	Companies	ProtectedRoute + SA
/items	Items	ProtectedRoute
/price-lists	PriceLists	ProtectedRoute
/item-prices	ItemPrices	ProtectedRoute
/customers	Customers	ProtectedRoute
/stock	Stock	ProtectedRoute
/till-accounts	TillAccounts	ProtectedRoute + SA/Admin
/sales	Sales	ProtectedRoute
/queue-monitor	QueueMonitor	ProtectedRoute + SA
/shifts	Shifts	ProtectedRoute
/day-closings	DayClosings	ProtectedRoute
/journal-entries	JournalEntries	ProtectedRoute
* → /	—

12. Adding a New Module — Pattern
types.ts — named type exports.
api.ts — named functions using lib/apiFetch.
components/ — default exports (Table, Filters, Drawer, Dialogs, Badges).
pages/{Feature}.tsx — default export.
Route in App.tsx.
Nav item in NAV_ITEMS (AppSidebar.tsx).

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

25. Locked Patterns (Post-Phase 5, v1.6)
Export Convention — LOCKED
(No changes, still components=default, api/types=named)

Drawer Pattern — LOCKED
createPortal + h-[100dvh] + min-h-0 body + shrink-0 header/footer.

Page Shell Pattern — LOCKED
Standard mx-auto max-w-[1400px] space-y-6 p-6. Card rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl.

Table Pattern — LOCKED
Bare <table> in overflow-x-auto. Skeleton loading 4-5 rows.

Filters Pattern — LOCKED
Card-wrapped flex-wrap with search and selects.

Row Action Menu Pattern — LOCKED
Portaled w-40 panel with MoreVertical icon.

Combobox Pattern — LOCKED
Used for all searchable dropdowns. Must render dropdown via createPortal to body to avoid table clipping.

Thermal Print Pattern — LOCKED
Added hidden .print-area class. Used in Shift and Day Close receipts. @media print hides UI and shows 80mm width.

Double-Entry Form Pattern — LOCKED
JournalEntryModal uses string states for debit/credit, filters empty lines, validates Total Dr == Total Cr, and prevents duplicate accounts on the same entry.

35. Phase 5 Modules — Locked
Sales Module
Files: pages/Sales.tsx, modules/sales/*.
Features: Table shows Sync Status, ERPNext Ref. Drawer shows Net by Till Account, Sync Error, and Retry button.
Backend: SalesController@index, @show. Retry dispatched via apiFetch to /api/sales/{id}/retry-sync.

Queue Monitor
Files: pages/QueueMonitor.tsx, modules/queue/*.
Features: 3 tables (Pending Jobs, Failed Jobs, Stuck Invoices). Polls every 10s. Retry button calls Artisan queue:retry.

Shifts Module
Files: pages/Shifts.tsx, modules/shifts/*.
Features: Filters by Date, Status, Company, User. Calculates Working Hours via JS (start/end time). Table shows O/C (Open/Closed) pills. Drawer shows Account Summary (payments grouped by account).

Day Closings
Files: pages/DayClosings.tsx, modules/day-closings/*.
Features: Read-only list of auto-generated closings (1 per cashier). Filter by Date. Drawer shows Financials + Aggregated Denominations (from closed shifts).

Journal Entries (Expenses)
Files: pages/JournalEntries.tsx, modules/journal-entries/*.
Features: List with Date/Company filter. "Record Expense" modal supports multi-line Dr/Cr entries. Validates Total Dr == Total Cr. Dispatches SyncJournalEntryToErpNextJob on save.