# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — Next.js / ESLint (config extends `next/core-web-vitals`; ignores `src/ui_structure/**`)
- `npm run type-check` — `tsc --noEmit` (no test runner is wired up; the `tests/` tree is empty scaffolding)

Path alias: `@/*` → `src/*` (set in `tsconfig.json`). The `src/ui_structure/**` tree is excluded from the TS compile.

## Branch Strategy

### Naming convention
```
feature/<short-description>   e.g. feature/auth-login-token-storage
```

### Rules — follow these strictly

1. **Always ask permission before creating a new branch.** Never create a branch silently.

2. **One feature = one branch.** Even within the same sprint, if two features are distinct enough to be reviewed separately, they get separate branches.

3. **Before switching to a new branch:** if there are any uncommitted changes on the current branch:
   - Commit and push the changes
   - Create a PR
   - Wait for the user to review and merge before starting the next branch

4. **Never work directly on `main`.** All changes go through feature branches and PRs.

5. **Sprint files live at `_sprints/v01/sprint-{N}.md`** — check the relevant sprint file before starting work to know which branches are expected.

6. **PR before merge** — never merge a branch yourself. Always create a PR and let the user review and approve it.

### Workflow per feature

```
Ask permission to create branch
  ↓
git checkout -b feature/<name>
  ↓
Implement feature
  ↓
npm run type-check  (must pass)
  ↓
git add <specific files>
git commit -m "feat(<scope>): ..."
git push -u origin feature/<name>
  ↓
gh pr create ...
  ↓
Wait for user to merge
  ↓
git checkout main && git pull
  ↓
Ask permission for next branch
```

## High-level architecture

This is `slp-web` / EduPath — the Next.js 14 (App Router) frontend for a multi-role Course Management Portal. It is the **presentation layer only**: the long-term plan is to call `slp-backend` over REST (RTK Query + Firebase Auth ID token), but the current code is a UI-first build running off in-memory mocks under `src/lib/mock/`. There is no real auth, no API client, and no Firebase wiring yet — the `infrastructure/`, `domain/`, and `application/api/` directories exist as empty placeholders for the layers described in the blueprint.

The authoritative spec for where things are *going* lives at `.claude/CMP_Web_Frontend_Blueprint.md.md` (Clean Architecture layout, RTK Query endpoints, role guards, page specs, design system). Treat that as the design contract for new work; treat the code as the partial implementation.

### Implementation status

| Layer | Status | Notes |
|---|---|---|
| Pages & routing | ✅ ~85% | 42 page components across all four route groups |
| UI components (`src/components/ui/`) | ✅ Done | 22 primitives — Button, Card, Input, Modal, Badge, Avatar, Toast/Toaster, Skeleton, Spinner, EmptyState, ProgressBar, CourseCover, RowMenu, FilterPopover, ConfirmDialog, etc. |
| Layout shell | ✅ Done | AppShell, Sidebar, TopNav, UserMenu, NotificationBell, FloatingNav, RoleNav |
| Redux store + slices | ✅ Done | `uiSlice`, `sessionSlice`; see State management below |
| Mock data (`src/lib/mock/`) | ✅ Done | `students`, `courses`, `users`, `admins`, `notifications`, `registrations`, `audit` |
| Domain layer (`src/domain/`) | ❌ Empty | Placeholders for types, enums, Zod schemas, pure utils |
| Infrastructure (`src/infrastructure/`) | ❌ Empty | Placeholders for API client, Firebase Auth, token storage |
| RTK Query (`src/application/api/`) | ❌ Empty | Blueprint calls for it; not yet wired |
| Auth / role guards | ❌ Not started | `sessionSlice` is demo-seeded; layout guards are TODO |

**Not yet installed** (in blueprint but absent from `package.json`): Firebase, Axios, react-hook-form, Zod, RTK Query's `createApi`. Do not assume they are available until added.

### Clean Architecture layers (intended)

```
src/app/            Presentation — Next.js App Router, layouts, pages
src/components/     Presentation — UI primitives (ui/) + feature components
src/application/    Application — Redux slices, RTK Query, hooks
src/infrastructure/ Infrastructure — API client, Firebase Auth, token storage   (empty)
src/domain/         Domain — types, enums, Zod schemas, pure utils              (empty)
src/lib/            Cross-cutting helpers (cn, kit) + mock fixtures (lib/mock/)
```

Dependency rule: inner layers (domain) must never import from outer layers (application/presentation/infrastructure). Presentation must not import Axios or call APIs directly — go through hooks / RTK Query.

### Routing model — three role-grouped App Router trees

`src/app/` uses route groups to segregate by role; the role gate is *not yet implemented* — guards belong in each group's `layout.tsx` once auth lands:

- `(public)/` — landing, login, register, public course catalog (`courses/[courseId]`)
- `(student)/` — `dashboard`, `my-courses/[courseId]/[subjectId]`, `profile`, `notifications`, `help`, all wrapped in a student `layout.tsx`
- `admin/` — registrations / enrollments approval queues, course editor with nested `[courseId]/semesters/[semesterId]/subjects/...`, students, audit log
- `super-admin/` — admin management (`admins/[adminId]`), plus its own copies of registrations/enrollments/courses/audit-log

Nav configuration for all three roles is centralised in `src/components/layout/RoleNav.ts` (`STUDENT_NAV`, `ADMIN_NAV`, `SUPERADMIN_NAV`). The shared shell is `components/layout/AppShell.tsx` (Sidebar + TopNav + Toaster + footer).

Feature component directories under `src/components/`: `auth/`, `course/`, `enrollment/`, `admin/` have files; `student/`, `notifications/`, `progress/` exist but are empty placeholders.

### State management

Redux Toolkit store at `src/application/store/`. `RootLayout` mounts `Providers` (`src/app/providers.tsx`) which wraps the app in `<Provider store={store}>`. Two slices today:

- `uiSlice` — toasts (with `nanoid` ids), modal kind+payload, sidebar collapsed flag
- `sessionSlice` — current `user` + `role` (`student | admin | super_admin`), seeded with a demo student so role-aware screens render without auth

Hooks: `useAppDispatch`, `useAppSelector`, plus `useApprovalQueue` (generic optimistic approve/reject + bulk-select state used by registrations and enrollments queues — dispatches a toast on action). RTK Query is **not yet added** despite the blueprint calling for it; data comes from `src/lib/mock/*.ts`.

### Design system

Tailwind is the styling system. Brand tokens are defined in **two places that must stay in sync**:
- `tailwind.config.ts` — extended `colors`, `fontFamily`, `borderRadius`, `boxShadow` (utility classes like `bg-primary`, `text-accent`, `shadow-card`)
- `src/app/globals.css` — the same tokens as CSS custom properties (`--color-primary`, `--fs-h1`, etc.), used by raw CSS and by the `.shell` / `.shell-main` layout classes referenced from `AppShell`

Fonts are loaded via `next/font/google` in `src/app/layout.tsx` (Figtree → `--font-heading`, Inter → `--font-body`, JetBrains Mono → `--font-mono`).

Class-merging helper: `cn()` in `src/lib/cn.ts` (clsx + tailwind-merge). Course cover gradients and pravatar avatars live in `src/lib/kit.ts`.

### `src/ui_structure/` — design handoff bundle, not source

This directory is a Claude Design HTML/CSS/JS prototype handoff (see `src/ui_structure/README.md`). It is **excluded from TypeScript, ESLint, and Tailwind content scanning**. Treat it as a reference for pixel-perfect recreation of screens (`screens-public.jsx`, `screens-student.jsx`, `screens-admin.jsx`, `screens-real.jsx`) and the design system in `design_system/colors_and_type.css`. Do not import from it; do not render it; mirror its visuals into real React/Tailwind components instead.

## Conventions worth knowing

- Prettier: 100-col, double quotes, trailing commas, semis, `prettier-plugin-tailwindcss` sorts class names.
- All components that touch Redux, hooks, or browser APIs need `"use client"` (this is a Next.js App Router project — server is the default).
- `next.config.mjs` whitelists `i.pravatar.cc` and `images.unsplash.com` for `next/image`; mock avatars use pravatar via `kit.ts`.
- Env template is `.env.example` (`NEXT_PUBLIC_API_BASE_URL`, Firebase keys) — actual integration is pending.
- Theme (light/dark) is managed by `next-themes`; `providers.tsx` wraps the app in both `<Provider store={store}>` and `<ThemeProvider>`.
