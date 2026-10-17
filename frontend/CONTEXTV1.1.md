# KarobarDesk — Frontend Context

Version 1.1
Status Living document — update as frontend evolves
Scope React SPA only. Backend details live in KarobarDesk_Locked_Context_v5.4.md.
Path EAIOPOS-DevelopmentKarobarDeskfrontend

Changelog (1.0 → 1.1)
- Users module complete pagesUsers.tsx, modulesusers (api, types, 8 components).
- Sidebar added layoutsAppSidebar.tsx — collapsible, role-aware, MENU header.
- Layout restructured AppLayout wraps AppSidebar + topbar + Outlet.
- CSRF helper added libapiFetch.ts — required for all POSTPUTPATCHDELETE.
- Design tokens drift fixed Select component replaces native select, portaled dropdowns.
- Backend integration Sanctum session cookies + X-XSRF-TOKEN header.
- Section 5 (Auth Flow) updated — linkunlink flow does not affect auth.
- Section 7 (Setup Module) unchanged.
- New sections 18–23 covering Users Module, Sidebar, apiFetch, portaled dropdowns, module conventions, and phase status.
- Section 16 updated (Next Modules) — Companies is next.

---

## 1. Purpose

[unchanged]

## 2. Stack

 Component  Version  Notes 
---------
 Vite  8.3.x  Dev server on 5173, proxies api + sanctum to 8080 
 React  19.2.8  StrictMode ON 
 TypeScript  6.0.2  verbatimModuleSyntax true — use import type 
 React Router  7.18.4  react-router-dom, BrowserRouter 
 Tailwind CSS  3.4.19  HSL color vars in srcindex.css 
 shadcnui  v4 (radix-nova)  button, card, input, label installed 
 lucide-react  1.52.x  Icon library 
 axios  1.20.x  Single client at srcapiclient.ts (auth flow only) 
 next-themes  REMOVED  Replaced by custom ThemeProvider (see section 6) 

Note Users Module uses native fetch via libapiFetch.ts, not axios. Both work; apiFetch is required for CSRF on mutations.

## 3. Folder Structure

frontend
  index.html
  vite.config.ts        (proxy api + sanctum → httplocalhost8080)
  tailwind.config.js
  tsconfig.app.json
  package.json
  src
    main.tsx
    App.tsx
    index.css
    api
      client.ts         axios instance — auth flow
      sync.ts           ERPNext sync endpoints (Setup module)
    auth
      AuthContext.tsx
      useAuth.ts
    theme
      ThemeProvider.tsx
      ThemeToggle.tsx
    components
      ui               shadcn button, card, input, label
      glassGlassCard.tsx
    routes
      ProtectedRoute.tsx
    layouts
      AppLayout.tsx     topbar + user dropdown + Outlet
      AppSidebar.tsx    collapsible sidebar, MENU header, role-aware
    pages
      Login.tsx
      Dashboard.tsx     empty placeholder
      Setup.tsx
      Users.tsx
    setup
      syncSteps.ts
      ConnectionCard.tsx
      SyncCard.tsx
      ActivityPanel.tsx
    modules
      users
        api.ts          fetch helpers → apiusers
        types.ts        User, Role, Company, TillOperation, PaginatedUsers
        components
          Modal.tsx
          Select.tsx    portaled dropdown
          UsersTable.tsx
          UsersFilters.tsx
          CreateUserDialog.tsx
          EditUserDialog.tsx
          UserDetailDrawer.tsx
          LinkErpNextDialog.tsx
          ErpNextBadge.tsx
          UserStatusBadge.tsx
          UserRolesBadges.tsx
    types
      auth.ts
      sync.ts
    lib
      utils.ts          cn() — clsx + tailwind-merge
      apiFetch.ts       fetch wrapper — CSRF + credentials

## 4. Design System

[unchanged]

## 5. Auth Flow

[unchanged]

Additional Users module does not interact with auth. Loginmelogout shape unchanged.

## 6. Theme Provider

[unchanged]

## 7. Setup Module

[unchanged]

## 8. App Shell (AppLayout + AppSidebar)

Topbar (unchanged from 1.0)
- h-14, glass, sticky top z-40
- Left brand (Store icon + wordmark) — hidden on md+ when sidebar is visible
- Right ThemeToggle, user dropdown

Sidebar — NEW (layoutsAppSidebar.tsx)
- 240px expanded  64px collapsed
- Hidden below md breakpoint
- Collapse state persisted in localStorage.karobardesk.sidebar.collapsed
- Structure
  - Header collapse toggle (ChevronLeftChevronRight)
  - MENU label (hidden when collapsed)
  - Nav items (icon + label, active state = violet gradient pill)
- NAV_ITEMS array — the single source of truth for nav
  const NAV_ITEMS = [
    { label 'Dashboard', icon LayoutDashboard, path 'dashboard' },
    { label 'Users',     icon Users,           path 'users', roles ['super_admin'] },
  ]
- Role filtering item.roles array; emptyundefined = visible to all. Compare against useAuth().roles.map(r = r.name).
- Role names use underscores super_admin, admin, manager, cashier, sales_person.
- Icons PanelLeftClosePanelLeftOpen replaced with ChevronLeftChevronRight (version safety).
- Fixed width via inline class (w-16 or w-60), not Tailwind transitions on width.
- To add a new nav item add one entry to NAV_ITEMS. Done.

Setup & Sync remains in the user dropdown — not in the sidebar. Do not move it.

AppLayout layout
div className=flex min-h-screen bg-background
  AppSidebar 
  div className=flex min-w-0 flex-1 flex-col
    header...header          ← topbar unchanged
    main className=min-w-0 flex-1Outlet main
  div
div

## 9. State Management

[unchanged]

## 10. API Clients

Two clients, two purposes

1. srcapiclient.ts — axios instance
   - Used by auth flow, Setup module (sync endpoints)
   - Handles CSRF + X-XSRF-TOKEN header automatically
   - 401 interceptor dispatches authunauthorized event

2. srclibapiFetch.ts — fetch wrapper
   - Used by Users Module (and any new module)
   - Reads XSRF-TOKEN cookie, sends X-XSRF-TOKEN on POSTPUTPATCHDELETE
   - Sends credentials 'include' always
   - Throws ApiError with .status and .errors for 422s

Why two
- axios is fine for auth flow (login, me, logout) — no mutations except login which is handled by sanctum cookie prefetch
- apiFetch is simpler for module code, avoids axios dependency in every module, and returns raw JSON directly

Rule for new modules use libapiFetch.ts. Do not add axios calls for new work.

## 11. Routing

 Path  Element  Guard 
---------
 login  Login  Public; redirects to  if already logged in 
   redirect to dashboard  ProtectedRoute 
 dashboard  Dashboard  ProtectedRoute 
 setup  Setup  ProtectedRoute + isSuperAdmin check inside component 
 users  Users  ProtectedRoute + SA-only action buttons (page renders for all) 
   redirect to   — 

All protected routes render inside AppLayout, which now includes AppSidebar.

## 12. Adding a New Module — Pattern

Frontend
1. srcmodules{feature}types.ts — TS interfaces
2. srcmodules{feature}api.ts — functions using libapiFetch
3. srcmodules{feature}components.tsx — reusable pieces (table, dialogs, badges)
4. srcpages{Feature}.tsx — page component, imports from modules{feature}
5. Route added in App.tsx
6. Nav item added to NAV_ITEMS in AppSidebar.tsx
7. Loading, empty, error states handled

Naming
- Module folder lowercase plural (modulesusers, modulescompanies)
- Page file PascalCase, matches route (pagesUsers.tsx)
- Components PascalCase, one per file

Component conventions (unchanged from 1.0).

## 13. Conventions

[unchanged]

## 14. Constraints

[unchanged]

## 15. Current State

Working
- Login → Sanctum session → AppLayout with sidebar
- Sidebar with collapse toggle, role-aware items
- Dashboard (placeholder)
- Setup page — ERPNext connection test + 6 sync cards + activity panel
- Users page — list, search, filter, create, edit, view drawer, deactivateactivate
- Users drawer — LinkRe-linkUnlink ERPNext, till operation card, accounts pills
- Theme toggle
- Sign out

Not built
- Real dashboard (KPIs, charts)
- Companies page
- Items  Customers  Price Lists views
- Sales  Stock  Parcels  Shifts
- Notifications, search, command palette
- Mobile responsive polish for sidebar (drawer mode)

Known limitations
- Dashboard is an empty placeholder
- No global error boundary
- Native window.confirm used for destructive actions (unlink)
- No pagination UI polish beyond PreviousNext buttons

## 16. Next Likely Modules

In order
1. Companies — read-only list + detail drawer + per-company re-sync
2. Dashboard — real KPIs from synced data + recent activity
3. Items  Customers  Price Lists — read-only lists
4. Sales  Stock  Parcels  Shifts — operational

Each follows section 12.

## 17. Do Not

[unchanged, plus]
- Do not use native select — use modulesuserscomponentsSelect.tsx (portaled dropdown)
- Do not use overflow-hidden on table cards that contain action menus — the menus are portaled to body
- Do not read User.erpnext_user  erpnext_token  erpnext_last_ directly — use User.erpnext.{user, linked, last_tested_at, last_error}
- Do not call mutations without going through libapiFetch

## 18. Users Module (Phase 3) — Locked

Files
- pagesUsers.tsx — page shell (list + filters + dialogs + drawer + toast)
- modulesusersapi.ts — listUsers, getUser, createUser, updateUser, deactivateUser, activateUser, listRoles, listCompanies, linkErpNext, unlinkErpNext
- modulesuserstypes.ts — User, Role, Company, TillOperation, TillOperationAccount, ErpNextLink, PaginatedUsers, CreateUserPayload, UpdateUserPayload, LinkErpNextPayload, ListUsersParams
- modulesuserscomponents — table, filters, modals, drawer, badges, Select, Modal

Create user flow (local-first)
- Modal has fields name, username, email, password, primary company (Select), company access (multi pills), roles (multi pills), is_active
- NO ERPNext fields in create
- POST apiusers → 201, user created locally
- Row appears in table

Link to ERPNext flow
- Drawer → Link to ERPNext button → LinkErpNextDialog
- Dialog erpnext_user + erpnext_password → POST apiusers{id}erpnextlink
- Backend logs in, fetches till, upserts locally, returns updated user
- Drawer refreshes with till card + accounts
- On failure error shown inline in dialog, nothing saved

Unlink flow
- Drawer → Unlink button (when linked) → window.confirm → DELETE apiusers{id}erpnextunlink
- Drawer refreshes, shows Not linked

Super Admin protection
- SA row shows Protected pill in the Actions column (no row menu)
- Backend returns 403 for updatedeactivatelinkunlink on SA
- SA role cannot be assigned via the API

Drawer state
- Accepts user prop, mirrors to local `current` state
- onUserUpdated callback fires after linkunlink to refresh the parent list
- Nested components (LinkErpNextDialog, ErpNextBadge, UserRolesBadges) read from `current`

## 19. Sidebar (AppSidebar.tsx)

Full spec in section 8.

To add nav items
1. Import the lucide icon at the top
2. Add one entry to NAV_ITEMS { label, icon, path, roles }
3. roles is optional; missing = visible to everyone

To gate by role
- Use roles ['super_admin'] — matches backend role names (underscores)
- Multiple roles ['super_admin', 'admin', 'manager']

## 20. CSRF  apiFetch.ts

Location srclibapiFetch.ts

Exports
- apiFetchT(path, options) PromiseT — main entry
- ApiError class with .status, .errors, .message

Behavior
- Always sets credentials 'include'
- Sets Accept applicationjson
- Sets Content-Type applicationjson when body present
- On POSTPUTPATCHDELETE
  - Ensures XSRF-TOKEN cookie exists (fetches sanctumcsrf-cookie if missing)
  - Reads XSRF-TOKEN from document.cookie
  - Sends X-XSRF-TOKEN header

Why
- Laravel Sanctum SPA mode requires CSRF header on every unsafe method
- Plain fetch does not do this automatically
- Without it, every POST returns CSRF token mismatch

Rule every mutation in every module uses apiFetch. Never raw fetch.

## 21. Portaled Dropdowns

Two components use createPortal to escape parent overflow
- modulesuserscomponentsSelect.tsx — for all custom dropdowns
- RowActionMenu inside UsersTable.tsx — for the row actions (⋯)

Pattern
- Compute screen coordinates with element.getBoundingClientRect()
- Render the panel via createPortal(panel, document.body)
- position fixed, topleft from computed coords
- z-[100] — above everything
- Close on outside click, Escape, or scroll (optional reposition)

Why parent tablescards have overflow-x-auto or rounded corners that clip absolute dropdowns. Portaling to body bypasses all clipping.

Rule any dropdown that might appear near the edge of a tablecard uses portal, not absolute positioning.

## 22. Known Pattern Failures (Do Not Repeat)

- Native select with dark theme options render with OS-default whiteblue. Always use Select.tsx.
- overflow-hidden on the table card clips absolute dropdowns. Removed.
- axios vs apiFetch for Users module we standardized on apiFetch. Keep it that way.
- Direct reads of user.erpnext_user user.erpnext is the correct accessor.
- Vite proxy missing sanctum CSRF prefetch silently fails → mismatch on POST.
- Passing role names to sync() instead of IDs backend resolves names → IDs. Frontend sends names.

## 23. Phase Status

- Phase 1 — Master Data Sync COMPLETE (backend + Setup page)
- Phase 3 — Users Module COMPLETE (list, CRUD, ERPNext linkunlink)
- Phase 2 — Webhooks DEFERRED
- Phase 4 — Dashboard, Companies UI, Items UI, Customers UI IN PROGRESS
- Phase 5 — Parcels, Sales, Stock, Shifts PENDING

Immediate next Companies page (see section 16).

End of frontend context.