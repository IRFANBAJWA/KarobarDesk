KarobarDesk — Frontend Context
Version: 1.7
Status: Living document — update as frontend evolves
Scope: React SPA & Dashboard only. Backend details live in KarobarDesk_Locked_Context_v5.9.md.
Path: E:\AIOPOS-Development\KarobarDesk\frontend

Changelog (1.6 → 1.7)
- Dashboard UI/UX Redesign COMPLETE: Implemented premium dark glassmorphism with ambient background glows, floating sticky sidebar, and deep glass panels (Stripe/Linear style).
- Dashboard API Integration COMPLETE: Wired real database queries to the Super Admin dashboard. Implemented Date Range filters (Today, Yesterday, Last 7 Days, This Month, Last Month) and Company filters.
- Role-Aware Dashboard: Super Admin layout fully implemented. Manager and Cashier layouts stubbed and ready for implementation (We are starting these from scratch).
- KPI Cards: Upgraded to "Tinted Glass" style with deep gradients, hover glow, and color-coded icons. 
- Top Header: Redesigned to match premium SaaS aesthetics with the Search bar, Notification bell, and vibrant Orange primary actions.
- Sidebar: Sticky, independently scrollable with a fade-out gradient at the bottom, active glowing pills, and a custom dark scrollbar.
- Shifts & Day Closings: Completed Auto Day Closing logic. POS syncs the shift close, backend calculates and saves the Day Closing record.
- Journal Entries (Expenses): Completed multi-line Double-Entry form (Dr/Cr) with auto-balancing validation. Wired to ERPNext Sync Job.

1. Design System (LOCKED — Premium Glass)
- Dark-first deep obsidian background (`bg-[#070709]`).
- Ambient glows: Fixed, blurred orbs in the background (`bg-violet-600/10`, `bg-blue-600/10`) so the glass panels have something to blur.
- Glass Cards: `bg-white/[0.02]` or `bg-[#18181b]`, `border-white/[0.08]`, `backdrop-blur-2xl` or `3xl`.
- Top Edge Highlight: Every card must have `<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />` to simulate light reflecting off the glass edge.
- Primary Accent: Vibrant Orange (`bg-[#f97316]` / `hover:bg-[#ea580c]`) for primary actions (matches reference screenshots).
- KPI Cards: Soft tinted gradients (e.g., `from-orange-500/[0.06]`), hover lift (`hover:-translate-y-1`), colored glow on hover.
- Typography: Geist Variable, tracking-tight headings, tabular-nums for all numbers.
- Sidebar: Sticky (`sticky top-0 h-screen`), heavy blur (`bg-[#09090b]/80 backdrop-blur-2xl`), custom-scrollbar, bottom fade gradient.

2. App Layout (AppLayout.tsx)
- The root is `h-screen overflow-hidden` so the sidebar and header stay fixed.
- Header: `sticky top-0 z-40 border-b border-white/[0.07] bg-[#09090b]/75 shadow-sm backdrop-blur-2xl`. Contains mobile hamburger, Search, ThemeToggle, and User Dropdown.
- Main Content: `flex-1 overflow-y-auto custom-scrollbar`. This is the ONLY area that scrolls. The sidebar and header do not move.
- User Dropdown: Deep glass, user info, role badges (violet pills), company context, Setup link (SA only), and Sign Out.

3. App Sidebar (AppSidebar.tsx)
- Inner scroll: `<nav className="custom-scrollbar flex-1 overflow-y-auto min-h-0 pb-16">`
- Fade effect: `<div className="absolute bottom-0 h-16 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />`
- Active State: Glowing violet gradient (`from-violet-600/30 to-transparent`), violet icon drop-shadow.
- Mobile: Slide-out drawer with backdrop, closing on Escape or backdrop click.

4. Dashboard Architecture (SuperAdminLayout.tsx)
- The UI is driven by the `DashboardController` API.
- Layout:
  - Top Bar: Search, Notification, Orange "Create Sale" button.
  - Filters: Company Dropdown and Date Range Dropdown (custom styled).
  - KPI Cards (5): Today's Sales, Invoices, Companies, Active Cashiers, Open Shifts.
  - Charts Row: SalesAnalyticsChart (Area chart, 3 companies) and SystemHealthWidget (Live jobs/invoices).
  - Table: Company Performance (Sales, Invoices, Open Shifts, Status, View action).

5. Backend Dashboard API (DashboardController.php)
- Accepts `?date_range=today&company_id=all`.
- Logic:
  - Establishes date boundaries based on `Asia/Karachi`.
  - If "Today" or "Yesterday", groups chart data by Hour (e.g., 09:00, 10:00).
  - If "Last 7 Days", "This Month", "Last Month", groups by Day.
  - Calculates comparison trends (Today vs Yesterday).
  - Live Data (Open Shifts, Pending Jobs) bypasses the date filter (always shows current live state).
  - Returns JSON shaped exactly for `SuperAdminLayout.tsx`.

6. Frontend Dashboard Types & API
- `frontend/src/modules/dashboard/types.ts`: Defines `DashboardData` (kpis, companies, chartData, systemHealth).
- `frontend/src/modules/dashboard/api.ts`: `getDashboardData({ date_range, company_id })`.
- `Dashboard.tsx`: Holds filter state (`dateRange`, `companyFilter`), fetches data on mount and filter change, shows a loader, and renders `SuperAdminLayout`.

7. KpiCard.tsx (Premium)
- Props: `title`, `value`, `trend`, `comparisonLabel`, `trendDirection`, `icon`, `color`.
- Styling: Deep tinted gradient (`from-{color}-500/[0.06]`), top light highlight, icon in a colored box (`bg-{color}-500/10`), trend pill (`bg-emerald-400/10`).
- No sparklines currently (removed per user request), clean layout.

8. Pending / Next Steps
- Implement `ManagerLayout.tsx` and `CashierLayout.tsx` for the Dashboard (This is the immediate next task).
- Move to **Parcels (M&P Courier)** module.
- Move to **Purchasing** module.

9. Important Rules
- No native `<select>` — use `Combobox` or styled custom dropdowns.
- No `h-screen` on Drawers — use `h-[100dvh]`.
- Drawers must be `createPortal(..., document.body)`.
- Every mutation uses `lib/apiFetch.ts`.
- Static routes before parameter routes in Laravel.