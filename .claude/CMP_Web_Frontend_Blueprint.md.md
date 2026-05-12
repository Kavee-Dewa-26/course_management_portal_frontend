# CMP — Web Frontend Blueprint
## Course Management Portal · `slp-web`
### React · Next.js 14 · Redux Toolkit · Tailwind CSS · Clean Architecture

**Version:** 1.0.1 *(updated — API alignment fixes)*
**Date:** 07 May 2026
**Organisation:** Future CX Lanka (Pvt) Ltd
**Status:** Release Baseline

> **v1.0.1 Changes:** Aligned RTK Query endpoints with finalised API document.
> Fixed: `markSubjectComplete` now sends `source` body field · `getAllCourses` removed invalid `all` param · `getMyEnrollments` return type corrected to `PaginatedResponse<Enrollment>` · `rejectRegistration` now sends `reason` body · `bulkApproveRegistrations` mutation added · Progress API expanded with `getSubjectProgress`, `updateLastAccessed`, `getAdminCourseProgress` · Domain types updated: `CourseProgress` renamed to `CourseProgressAggregate`; `Attachment` gains `id`/`subjectId`; `Notification.category` uses typed union; `AdminCourseProgress` type added.

---

## Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [Technology Stack](#2-technology-stack)
3. [Clean Architecture — Principles & Layers](#3-clean-architecture--principles--layers)
4. [Project Directory Structure](#4-project-directory-structure)
5. [Routing Architecture](#5-routing-architecture)
6. [Authentication & Route Guards](#6-authentication--route-guards)
7. [State Management (Redux Toolkit)](#7-state-management-redux-toolkit)
8. [API Layer — RTK Query](#8-api-layer--rtk-query)
9. [Component Architecture](#9-component-architecture)
10. [Page Specifications — All Roles](#10-page-specifications--all-roles)
    - 10.1 [Public Pages](#101-public-pages)
    - 10.2 [Student Pages](#102-student-pages)
    - 10.3 [Admin Pages](#103-admin-pages)
    - 10.4 [Super Admin Pages](#104-super-admin-pages)
    - 10.5 [Shared / Common Pages](#105-shared--common-pages)
11. [UI Component Library (Tailwind Design System)](#11-ui-component-library-tailwind-design-system)
12. [Form Handling Strategy](#12-form-handling-strategy)
13. [Notifications & Real-Time Updates](#13-notifications--real-time-updates)
14. [Error Handling Strategy](#14-error-handling-strategy)
15. [Performance Optimisation](#15-performance-optimisation)
16. [Accessibility (WCAG 2.1 AA)](#16-accessibility-wcag-21-aa)
17. [Environment Configuration](#17-environment-configuration)
18. [Testing Strategy](#18-testing-strategy)
19. [Build, CI/CD & Deployment](#19-build-cicd--deployment)
20. [Feature Flags & Internationalisation](#20-feature-flags--internationalisation)

---

## 1. Overview & Goals

`slp-web` is the server-rendered React web frontend for the Course Management Portal. It serves all three user roles — **Student**, **Admin**, and **Super Admin** — through a single, role-aware application. It communicates exclusively with the `slp-backend` REST API over HTTPS. No business logic is implemented client-side; the frontend is a pure **presentation layer**.

### Design Constraints (from SRS)

| Constraint | Specification |
|-----------|--------------|
| Stack | React, Next.js 14 (App Router), Redux Toolkit, RTK Query, Tailwind CSS |
| Auth client | Firebase JS SDK — **Auth only** (no direct Firestore access) |
| Min viewport | 360 px wide |
| Max viewport tested | 1920 px wide |
| Rendering | SSR for public/catalog pages; CSR for authenticated dashboards |
| API contract | Consumes `slp-contracts` OpenAPI 3.1 spec |
| No horizontal scroll | Required on all mobile viewports |
| WCAG | 2.1 Level AA compliance (SHOULD) |

### Architectural Principles

- **Presentation only** — the web client renders state and dispatches user intent; it never grants itself access or mutates persistent data without server confirmation
- **Clean Architecture** — strict separation between domain types, data access, application logic, and UI rendering
- **Server-side rendering** for public, SEO-relevant, and catalog pages
- **Client-side rendering** for all authenticated dashboard views to avoid server-side session management
- **Shared contracts** — TypeScript types imported from `slp-contracts`; no types defined locally that duplicate the API contract

---

## 2. Technology Stack

| Package | Version (target) | Purpose |
|---------|:----------------:|---------|
| `react` | 18.x | UI rendering library |
| `next` | 14.x (App Router) | SSR/SSG framework, file-system routing, image optimisation |
| `@reduxjs/toolkit` | 2.x | State management — slices, thunks, entity adapters |
| `react-redux` | 9.x | React bindings for Redux |
| `@reduxjs/toolkit` RTK Query | (bundled) | Server-state management, caching, auto cache invalidation |
| `tailwindcss` | 3.x | Utility-first CSS framework |
| `@tailwindcss/forms` | latest | Form input base styles for Tailwind |
| `@tailwindcss/typography` | latest | Prose typography styles |
| `firebase` | 10.x | **Auth only** — `signInWithEmailAndPassword`, `signOut`, ID token |
| `react-hook-form` | 7.x | Performant form state management |
| `zod` | 3.x | Schema validation (shared with `slp-contracts`) |
| `@hookform/resolvers` | 3.x | Zod resolver for React Hook Form |
| `next-themes` | latest | Light/dark theme management |
| `lucide-react` | latest | Icon library |
| `clsx` | latest | Conditional class name utility |
| `tailwind-merge` | latest | Merge Tailwind classes without conflicts |
| `date-fns` | 3.x | Date formatting utilities |
| `axios` | 1.x | HTTP client (used inside RTK Query base query) |
| `@testing-library/react` | 14.x | Component testing |
| `jest` | 29.x | Unit test runner |
| `playwright` | latest | E2E testing |
| `eslint` | 8.x + Next.js config | Linting |
| `prettier` | 3.x | Code formatting |
| `typescript` | 5.x | Type safety |

---

## 3. Clean Architecture — Principles & Layers

The frontend follows a **Clean Architecture** approach adapted for a Next.js/React application. Layers have strict dependency rules: inner layers never depend on outer layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│    Next.js Pages / App Router · React Components · Layouts     │
│    Role-aware UI · Forms · Feedback · Navigation                │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                            │
│    Redux Slices · RTK Query Endpoints · Custom Hooks            │
│    Use-case orchestration · State transformations               │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                         │
│    API Client (Axios + RTK Query base query)                    │
│    Firebase Auth SDK · Token management · Error normalisation   │
├─────────────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER (shared)                        │
│    TypeScript types from slp-contracts                          │
│    Zod schemas · Enums · Constants · Business type guards       │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### Domain Layer — `src/domain/`
- TypeScript interfaces and types **re-exported** from `slp-contracts`
- Enums for roles, statuses, lifecycle states
- Zod validation schemas shared with the backend
- Pure utility functions (no I/O, no side-effects)
- **Rule:** Zero dependencies on React, Redux, or Next.js

#### Infrastructure Layer — `src/infrastructure/`
- `apiClient.ts` — Axios instance with base URL, auth header injection, token refresh, error normalisation
- `firebaseAuth.ts` — Firebase Auth initialisation and helper wrappers
- `tokenService.ts` — Secure token storage (`sessionStorage`/memory; no `localStorage` for tokens)
- RTK Query `baseQuery` with Firebase ID token injection
- **Rule:** No React components or Redux logic here

#### Application Layer — `src/application/`
- Redux slices (auth, ui, notifications)
- RTK Query API definitions (endpoints, cache tags, invalidations)
- Custom React hooks (`useAuth`, `useRole`, `useCourseProgress`, etc.)
- **Rule:** No direct DOM manipulation; no Tailwind classes

#### Presentation Layer — `src/app/` + `src/components/`
- Next.js App Router pages and layouts
- React components (UI primitives, feature components, page components)
- Tailwind CSS utility classes
- **Rule:** No direct API calls or Axios imports; all data via hooks/RTK Query

---

## 4. Project Directory Structure

```
slp-web/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (public)/                 # Route group — no auth required
│   │   │   ├── page.tsx              # Landing / home page
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── courses/              # Public course catalog (SSR)
│   │   │       ├── page.tsx
│   │   │       └── [courseId]/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (student)/                # Route group — role: student
│   │   │   ├── layout.tsx            # Student shell layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── my-courses/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx      # Course viewer
│   │   │   │       └── [subjectId]/
│   │   │   │           └── page.tsx  # Subject / lesson viewer
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── notifications/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (admin)/                  # Route group — role: admin | super_admin
│   │   │   ├── layout.tsx            # Admin shell layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx          # Course list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create course
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx      # Course editor
│   │   │   │       ├── semesters/
│   │   │   │       │   └── [semesterId]/
│   │   │   │       │       └── subjects/
│   │   │   │       │           ├── new/page.tsx
│   │   │   │       │           └── [subjectId]/page.tsx
│   │   │   │       └── publish/
│   │   │   │           └── page.tsx
│   │   │   ├── students/
│   │   │   │   ├── page.tsx          # Student list + search
│   │   │   │   └── [studentId]/
│   │   │   │       └── page.tsx      # Student detail
│   │   │   ├── registrations/
│   │   │   │   └── page.tsx          # Pending registrations queue
│   │   │   ├── enrollments/
│   │   │   │   └── page.tsx          # Pending enrollments queue
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── notifications/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (super-admin)/            # Route group — role: super_admin only
│   │   │   ├── layout.tsx
│   │   │   ├── admins/
│   │   │   │   ├── page.tsx          # Admin list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create admin
│   │   │   │   └── [adminId]/
│   │   │   │       └── page.tsx      # Admin detail
│   │   │   └── audit-log/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                      # Next.js Route Handlers (minimal)
│   │   │   └── health/
│   │   │       └── route.ts
│   │   │
│   │   ├── error.tsx                 # Global error boundary
│   │   ├── not-found.tsx             # 404 page
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   └── globals.css               # Tailwind base + custom properties
│   │
│   ├── components/                   # Presentation layer
│   │   ├── ui/                       # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── ProgressBar.tsx
│   │   │
│   │   ├── layout/                   # Shell and navigation
│   │   │   ├── RootLayout.tsx
│   │   │   ├── StudentLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── SuperAdminLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNav.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── NotificationBell.tsx
│   │   │
│   │   ├── auth/                     # Auth feature components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   └── RoleGuard.tsx
│   │   │
│   │   ├── course/                   # Course feature components
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseList.tsx
│   │   │   ├── CourseDetail.tsx
│   │   │   ├── CourseEditor.tsx
│   │   │   ├── CourseStatusBadge.tsx
│   │   │   ├── SemesterAccordion.tsx
│   │   │   ├── SubjectItem.tsx
│   │   │   ├── SubjectEditor.tsx
│   │   │   ├── AttachmentUploader.tsx
│   │   │   ├── YouTubePlayer.tsx
│   │   │   └── CourseProgressRing.tsx
│   │   │
│   │   ├── enrollment/               # Enrollment feature components
│   │   │   ├── EnrollButton.tsx
│   │   │   ├── EnrollmentStatusBadge.tsx
│   │   │   ├── EnrollmentQueue.tsx
│   │   │   └── RegistrationQueue.tsx
│   │   │
│   │   ├── progress/                 # Progress feature components
│   │   │   ├── ProgressCard.tsx
│   │   │   ├── SubjectCompletionToggle.tsx
│   │   │   └── CourseProgressSummary.tsx
│   │   │
│   │   ├── student/                  # Student management components
│   │   │   ├── StudentTable.tsx
│   │   │   ├── StudentFilters.tsx
│   │   │   ├── StudentStatusBadge.tsx
│   │   │   └── StudentDetail.tsx
│   │   │
│   │   ├── admin/                    # Admin management components
│   │   │   ├── AdminTable.tsx
│   │   │   └── AdminDetail.tsx
│   │   │
│   │   └── notifications/
│   │       ├── NotificationList.tsx
│   │       └── NotificationItem.tsx
│   │
│   ├── domain/                       # Domain layer — pure types & schemas
│   │   ├── types/
│   │   │   ├── user.ts               # Re-export from slp-contracts
│   │   │   ├── course.ts
│   │   │   ├── enrollment.ts
│   │   │   ├── progress.ts
│   │   │   └── notification.ts
│   │   ├── enums/
│   │   │   ├── UserRole.ts
│   │   │   ├── UserStatus.ts
│   │   │   ├── CourseState.ts
│   │   │   ├── EnrollmentState.ts
│   │   │   └── ProgressState.ts
│   │   ├── schemas/                  # Zod validation schemas (from slp-contracts)
│   │   │   ├── auth.schemas.ts
│   │   │   ├── course.schemas.ts
│   │   │   └── enrollment.schemas.ts
│   │   └── utils/
│   │       ├── courseUtils.ts
│   │       ├── progressUtils.ts
│   │       └── dateUtils.ts
│   │
│   ├── infrastructure/               # Infrastructure layer
│   │   ├── api/
│   │   │   ├── apiClient.ts          # Axios instance + interceptors
│   │   │   ├── baseQuery.ts          # RTK Query base query with token injection
│   │   │   └── errorHandler.ts       # Normalise API error envelope
│   │   ├── auth/
│   │   │   ├── firebaseConfig.ts     # Firebase app initialisation
│   │   │   ├── firebaseAuth.ts       # Auth helpers (signIn, signOut, onAuthState)
│   │   │   └── tokenService.ts       # In-memory token store + refresh
│   │   └── storage/
│   │       └── sessionStorage.ts     # Typed session storage wrappers
│   │
│   ├── application/                  # Application layer
│   │   ├── store/
│   │   │   ├── index.ts              # Redux store setup
│   │   │   ├── rootReducer.ts
│   │   │   └── middleware.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts          # Current user + auth status
│   │   │   ├── uiSlice.ts            # Global UI state (modals, toasts)
│   │   │   └── notificationSlice.ts  # Unread count + in-app notifications
│   │   ├── api/                      # RTK Query endpoint definitions
│   │   │   ├── authApi.ts
│   │   │   ├── coursesApi.ts
│   │   │   ├── enrollmentsApi.ts
│   │   │   ├── progressApi.ts
│   │   │   ├── studentsApi.ts
│   │   │   ├── adminsApi.ts
│   │   │   ├── notificationsApi.ts
│   │   │   └── auditApi.ts
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useRole.ts
│   │       ├── useCourseProgress.ts
│   │       ├── useNotifications.ts
│   │       ├── useConfirmDialog.ts
│   │       ├── useDebounce.ts
│   │       └── usePagination.ts
│   │
│   ├── lib/                          # Shared utilities
│   │   ├── cn.ts                     # clsx + tailwind-merge helper
│   │   ├── constants.ts              # App-level constants
│   │   └── config.ts                 # Runtime config from env vars
│   │
│   └── middleware.ts                 # Next.js middleware (auth redirect)
│
├── public/                           # Static assets
│   ├── icons/
│   └── images/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local                        # Local env vars (gitignored)
├── .env.example                      # Env var template (committed)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.ts
├── playwright.config.ts
└── package.json
```

---

## 5. Routing Architecture

### Route Groups and Access Levels

Next.js 14 App Router **route groups** (parenthesised folders) define access tiers without affecting the URL path.

```
URL Pattern                         Route Group        Auth Required   Roles
─────────────────────────────────────────────────────────────────────────────
/                                   (public)           No              All
/login                              (public)           No              All
/register                           (public)           No              All
/courses                            (public)           No              All (SSR)
/courses/[courseId]                 (public)           No              All (SSR)

/dashboard                          (student)          Yes             student
/my-courses                         (student)          Yes             student
/my-courses/[courseId]              (student)          Yes             student
/my-courses/[courseId]/[subjectId]  (student)          Yes             student
/profile                            (student)          Yes             student
/notifications                      (student)          Yes             student

/dashboard                          (admin)            Yes             admin | super_admin
/courses (admin)                    (admin)            Yes             admin | super_admin
/courses/new                        (admin)            Yes             admin | super_admin
/courses/[courseId] (admin editor)  (admin)            Yes             admin | super_admin
/students                           (admin)            Yes             admin | super_admin
/registrations                      (admin)            Yes             admin | super_admin
/enrollments                        (admin)            Yes             admin | super_admin
/profile (admin)                    (admin)            Yes             admin | super_admin
/notifications (admin)              (admin)            Yes             admin | super_admin

/admins                             (super-admin)      Yes             super_admin only
/admins/new                         (super-admin)      Yes             super_admin only
/admins/[adminId]                   (super-admin)      Yes             super_admin only
/audit-log                          (super-admin)      Yes             super_admin only
```

> **Note on role-based routing:** When a logged-in user navigates to `/dashboard`, the root layout resolves their role from the Redux auth slice and redirects to the appropriate role-specific layout. Admin and Student dashboard URLs are disambiguated by route groups at the Next.js level, not by URL paths.

### Next.js Middleware — `src/middleware.ts`

The Next.js middleware runs at the Edge before every request to protected route groups. It reads the Firebase ID token from an httpOnly cookie (set on login), validates its presence, and redirects unauthenticated users to `/login`.

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/my-courses', '/students',
  '/registrations', '/enrollments', '/admins', '/audit-log', '/profile',
  '/notifications', '/courses/new'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  // Token presence check only — full verification in the API layer
  const token = request.cookies.get('__session')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
```

### Role Redirect Logic

After the Firebase `onAuthStateChanged` callback fires in the client, the `AuthGuard` component dispatches the user's role to the Redux auth slice and performs client-side role-based redirects:

```
Authenticated user visits /login → redirect to role-appropriate /dashboard
Student visits /admins → redirect to /dashboard (student)
Admin visits /admins → redirect to /dashboard (admin)
Super Admin visits /admins → allowed
```

---

## 6. Authentication & Route Guards

### Firebase Auth Integration

Authentication uses the Firebase JS SDK (Auth only). No Firestore client access.

```typescript
// src/infrastructure/auth/firebaseAuth.ts
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, signOut as fbSignOut,
  onAuthStateChanged, User
} from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
}

export async function signOut() {
  await fbSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
```

### Token Service (In-Memory)

ID tokens are stored **in memory only** to prevent XSS token theft. The Firebase SDK handles token refresh transparently. Tokens are never written to `localStorage`.

```typescript
// src/infrastructure/auth/tokenService.ts
let _idToken: string | null = null;

export const tokenService = {
  set: (token: string) => { _idToken = token; },
  get: () => _idToken,
  clear: () => { _idToken = null; },
};
```

### RTK Query Base Query with Token Injection

```typescript
// src/infrastructure/api/baseQuery.ts
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getIdToken } from '../auth/firebaseAuth';
import { config } from '@/lib/config';

export const baseQuery = fetchBaseQuery({
  baseUrl: config.apiBaseUrl,
  prepareHeaders: async (headers) => {
    const token = await getIdToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});
```

### AuthGuard Component

```typescript
// src/components/auth/AuthGuard.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/application/store';
import { selectAuthStatus, selectCurrentUser } from '@/application/slices/authSlice';
import { Spinner } from '@/components/ui/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ('student' | 'admin' | 'super_admin')[];
}

export function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const router = useRouter();
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status === 'authenticated' && requiredRoles && user) {
      if (!requiredRoles.includes(user.role)) {
        router.replace('/dashboard');
      }
    }
  }, [status, user, requiredRoles, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return <>{children}</>;
}
```

### RoleGuard Component (Conditional Rendering)

Used to **conditionally render UI elements** based on role without full page redirects.

```typescript
// src/components/auth/RoleGuard.tsx
'use client';
import { useRole } from '@/application/hooks/useRole';

type Role = 'student' | 'admin' | 'super_admin';

interface RoleGuardProps {
  allow: Role | Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allow, children, fallback = null }: RoleGuardProps) {
  const { role } = useRole();
  const allowed = Array.isArray(allow) ? allow : [allow];

  // Super admin inherits admin permissions
  const effectiveRole = role === 'super_admin' ? ['super_admin', 'admin'] : [role];
  const hasAccess = allowed.some(r => effectiveRole.includes(r));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

---

## 7. State Management (Redux Toolkit)

### Store Configuration

```typescript
// src/application/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { rootReducer } from './rootReducer';
import { rtkQueryMiddleware } from './middleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(rtkQueryMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Auth Slice

```typescript
// src/application/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { signIn, signOut, getIdToken } from '@/infrastructure/auth/firebaseAuth';
import { tokenService } from '@/infrastructure/auth/tokenService';
import type { UserProfile } from '@/domain/types/user';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: UserProfile | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { idToken } = await signIn(email, password);
      tokenService.set(idToken);
      // Fetch user profile from API (to get status and role)
      const res = await fetch('/api/v1/me', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return await res.json() as UserProfile;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await signOut();
  tokenService.clear();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    clearAuth: (state) => {
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload as string;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      });
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthStatus = (state: { auth: AuthState }) => state.auth.status;
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role;

export default authSlice.reducer;
```

### UI Slice (Toasts, Modals)

```typescript
// src/application/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UiState {
  toasts: Toast[];
  confirmDialog: {
    open: boolean;
    title: string;
    description: string;
    onConfirm: (() => void) | null;
  };
}

const initialState: UiState = {
  toasts: [],
  confirmDialog: { open: false, title: '', description: '', onConfirm: null },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      state.toasts.push({ ...action.payload, id: crypto.randomUUID() });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    openConfirmDialog: (state, action: PayloadAction<Omit<UiState['confirmDialog'], 'open'>>) => {
      state.confirmDialog = { open: true, ...action.payload };
    },
    closeConfirmDialog: (state) => {
      state.confirmDialog = { open: false, title: '', description: '', onConfirm: null };
    },
  },
});

export const { addToast, removeToast, openConfirmDialog, closeConfirmDialog } = uiSlice.actions;
export default uiSlice.reducer;
```

### Notification Slice

```typescript
// src/application/slices/notificationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '@/domain/types/notification';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = { items: [], unreadCount: 0 };

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter(n => !n.readAt).length;
    },
    markRead: (state, action: PayloadAction<string>) => {
      const n = state.items.find(i => i.id === action.payload);
      if (n && !n.readAt) {
        n.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.items.forEach(n => { if (!n.readAt) n.readAt = new Date().toISOString(); });
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, markRead, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
```

---

## 8. API Layer — RTK Query

### API Service Base

```typescript
// src/application/api/baseApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/infrastructure/api/baseQuery';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Course', 'Semester', 'Subject',
    'Enrollment', 'Registration',
    'Progress', 'Student', 'Admin',
    'Notification', 'AuditLog', 'Me',
  ],
  endpoints: () => ({}),
});
```

### Courses API

```typescript
// src/application/api/coursesApi.ts
import { baseApi } from './baseApi';
import type {
  Course, CreateCourseDto, UpdateCourseDto,
  Semester, CreateSemesterDto,
  Subject, CreateSubjectDto, UpdateSubjectDto,
  PaginatedResponse,
} from '@/domain/types/course';

export const coursesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Public — SSR compatible
    getPublishedCourses: builder.query<PaginatedResponse<Course>, { limit?: number; cursor?: string }>({
      query: ({ limit = 20, cursor } = {}) => ({
        url: '/courses',
        params: { limit, cursor },
      }),
      providesTags: ['Course'],
    }),

    getCourseById: builder.query<Course, string>({
      query: (id) => `/courses/${id}`,
      providesTags: (_, __, id) => [{ type: 'Course', id }],
    }),

    // Admin — role resolved server-side from Bearer token; no `all` flag needed
    getAllCourses: builder.query<PaginatedResponse<Course>, { limit?: number; cursor?: string; state?: 'draft' | 'published' | 'archived' }>({
      query: ({ limit = 20, cursor, state } = {}) => ({
        url: '/courses',
        params: { limit, cursor, ...(state ? { state } : {}) },
      }),
      providesTags: ['Course'],
    }),

    createCourse: builder.mutation<Course, CreateCourseDto>({
      query: (body) => ({ url: '/courses', method: 'POST', body }),
      invalidatesTags: ['Course'],
    }),

    updateCourse: builder.mutation<Course, { id: string; body: UpdateCourseDto }>({
      query: ({ id, body }) => ({ url: `/courses/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Course', id }, 'Course'],
    }),

    publishCourse: builder.mutation<Course, string>({
      query: (id) => ({ url: `/courses/${id}/publish`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [{ type: 'Course', id }, 'Course'],
    }),

    // Semesters
    createSemester: builder.mutation<Semester, { courseId: string; body: CreateSemesterDto }>({
      query: ({ courseId, body }) => ({
        url: `/courses/${courseId}/semesters`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_, __, { courseId }) => [{ type: 'Course', id: courseId }, 'Semester'],
    }),

    // Subjects
    createSubject: builder.mutation<Subject, { semesterId: string; body: CreateSubjectDto }>({
      query: ({ semesterId, body }) => ({
        url: `/semesters/${semesterId}/subjects`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subject', 'Semester'],
    }),

    updateSubject: builder.mutation<Subject, { id: string; body: UpdateSubjectDto }>({
      query: ({ id, body }) => ({ url: `/subjects/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Subject', id }],
    }),

    uploadAttachment: builder.mutation<void, { subjectId: string; file: File }>({
      query: ({ subjectId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/subjects/${subjectId}/attachments`,
          method: 'POST',
          body: formData,
          // Do NOT set Content-Type — browser sets multipart boundary automatically
          headers: { 'Content-Type': undefined },
        };
      },
      invalidatesTags: (_, __, { subjectId }) => [{ type: 'Subject', id: subjectId }],
    }),
  }),
});

export const {
  useGetPublishedCoursesQuery,
  useGetCourseByIdQuery,
  useGetAllCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  usePublishCourseMutation,
  useCreateSemesterMutation,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useUploadAttachmentMutation,
} = coursesApi;
```

### Enrollments API

```typescript
// src/application/api/enrollmentsApi.ts
import { baseApi } from './baseApi';
import type { Enrollment, PaginatedResponse } from '@/domain/types/enrollment';

export const enrollmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // API returns paginated shape: { items, nextCursor, total }
    getMyEnrollments: builder.query<PaginatedResponse<Enrollment>, { state?: string; limit?: number; cursor?: string }>({
      query: ({ state, limit = 20, cursor } = {}) => ({
        url: '/me/enrollments',
        params: { ...(state ? { state } : {}), limit, cursor },
      }),
      providesTags: ['Enrollment'],
    }),

    enrollInCourse: builder.mutation<Enrollment, string>({
      query: (courseId) => ({ url: `/courses/${courseId}/enroll`, method: 'POST' }),
      invalidatesTags: ['Enrollment', 'Course'],
    }),

    withdrawEnrollment: builder.mutation<void, string>({
      query: (enrollmentId) => ({ url: `/enrollments/${enrollmentId}/withdraw`, method: 'POST' }),
      invalidatesTags: ['Enrollment'],
    }),

    // Admin
    getPendingEnrollments: builder.query<PaginatedResponse<Enrollment>, { courseId?: string; cursor?: string }>({
      query: ({ courseId, cursor } = {}) => ({
        url: '/admin/enrollments',
        params: { status: 'pending', courseId, cursor },
      }),
      providesTags: ['Enrollment'],
    }),

    approveEnrollment: builder.mutation<Enrollment, string>({
      query: (id) => ({ url: `/admin/enrollments/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Enrollment'],
    }),

    rejectEnrollment: builder.mutation<Enrollment, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/enrollments/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Enrollment'],
    }),

    // Registration queue (Admin)
    getPendingRegistrations: builder.query<PaginatedResponse<any>, { cursor?: string }>({
      query: ({ cursor } = {}) => ({ url: '/admin/registrations', params: { status: 'pending', cursor } }),
      providesTags: ['Registration'],
    }),

    approveRegistration: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/registrations/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Registration', 'Student'],
    }),

    // Fix 5: include optional reason body (API: POST /admin/registrations/:id/reject)
    rejectRegistration: builder.mutation<void, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/registrations/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Registration'],
    }),

    // Fix 6: bulk approve up to 50 registrations in one request (FR-ADM-011)
    bulkApproveRegistrations: builder.mutation<
      { approved: string[]; failed: Array<{ id: string; reason: string }> },
      string[]
    >({
      query: (registrationIds) => ({
        url: '/admin/registrations/bulk-approve',
        method: 'POST',
        body: { registrationIds },
      }),
      invalidatesTags: ['Registration', 'Student'],
    }),
  }),
});

export const {
  useGetMyEnrollmentsQuery,
  useEnrollInCourseMutation,
  useWithdrawEnrollmentMutation,
  useGetPendingEnrollmentsQuery,
  useApproveEnrollmentMutation,
  useRejectEnrollmentMutation,
  useGetPendingRegistrationsQuery,
  useApproveRegistrationMutation,
  useRejectRegistrationMutation,
  useBulkApproveRegistrationsMutation,
} = enrollmentsApi;
```

### Progress API

```typescript
// src/application/api/progressApi.ts
import { baseApi } from './baseApi';
import type {
  CourseProgressAggregate,
  SubjectProgress,
  AdminCourseProgress,
  PaginatedResponse,
} from '@/domain/types/progress';

export const progressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Student: course-level aggregate (completionPercent, lastAccessedSubjectId)
    getCourseProgress: builder.query<CourseProgressAggregate, string>({
      query: (courseId) => `/me/progress/courses/${courseId}`,
      providesTags: (_, __, courseId) => [{ type: 'Progress', id: courseId }],
    }),

    // Student: per-subject progress state (completed / not_started / in_progress)
    getSubjectProgress: builder.query<SubjectProgress, string>({
      query: (subjectId) => `/me/progress/subjects/${subjectId}`,
      providesTags: (_, __, subjectId) => [{ type: 'Progress', id: `subject-${subjectId}` }],
    }),

    // Fix 1: include source body field ('manual' | 'auto') — required by API
    markSubjectComplete: builder.mutation<SubjectProgress, { subjectId: string; source?: 'manual' | 'auto' }>({
      query: ({ subjectId, source = 'manual' }) => ({
        url: `/progress/subjects/${subjectId}/complete`,
        method: 'POST',
        body: { source },
      }),
      invalidatesTags: ['Progress'],
    }),

    // Fix 2a: update lastAccessedAt resume pointer — powers "Continue Learning" (FR-LRN-007)
    updateLastAccessed: builder.mutation<{ subjectId: string; lastAccessedAt: string }, string>({
      query: (subjectId) => ({
        url: `/progress/subjects/${subjectId}/access`,
        method: 'POST',
      }),
      // Invalidate course progress so lastAccessedSubjectId refreshes
      invalidatesTags: ['Progress'],
    }),

    // Fix 2b: admin aggregate view for all enrolled students in a course
    getAdminCourseProgress: builder.query<
      PaginatedResponse<AdminCourseProgress> & { courseTitle: string; totalSubjects: number; enrolledCount: number },
      { courseId: string; limit?: number; cursor?: string }
    >({
      query: ({ courseId, limit = 25, cursor }) => ({
        url: `/admin/progress/courses/${courseId}`,
        params: { limit, cursor },
      }),
      providesTags: (_, __, { courseId }) => [{ type: 'Progress', id: `admin-${courseId}` }],
    }),
  }),
});

export const {
  useGetCourseProgressQuery,
  useGetSubjectProgressQuery,
  useMarkSubjectCompleteMutation,
  useUpdateLastAccessedMutation,
  useGetAdminCourseProgressQuery,
} = progressApi;
```

---

## 9. Component Architecture

### Design System Utility

```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Button Component

```typescript
// src/components/ui/Button.tsx
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary:     'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
  secondary:   'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost:       'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
  outline:     'border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  variant = 'primary', size = 'md', loading, fullWidth,
  disabled, children, className, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
```

### Badge Component

```typescript
// src/components/ui/Badge.tsx
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

const badgeVariants: Record<BadgeVariant, string> = {
  default:  'bg-slate-100 text-slate-700',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-700',
  error:    'bg-red-100 text-red-700',
  info:     'bg-blue-100 text-blue-700',
  outline:  'border border-slate-300 text-slate-700',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  );
}
```

### CourseStatusBadge

```typescript
// src/components/course/CourseStatusBadge.tsx
import { Badge } from '@/components/ui/Badge';
import type { CourseState } from '@/domain/enums/CourseState';

const stateConfig: Record<CourseState, { label: string; variant: any }> = {
  draft:     { label: 'Draft',     variant: 'warning' },
  published: { label: 'Published', variant: 'success' },
  archived:  { label: 'Archived',  variant: 'default' },
};

export function CourseStatusBadge({ state }: { state: CourseState }) {
  const { label, variant } = stateConfig[state];
  return <Badge variant={variant}>{label}</Badge>;
}
```

### ConfirmDialog

```typescript
// src/components/ui/ConfirmDialog.tsx
'use client';
import { useAppDispatch, useAppSelector } from '@/application/store';
import { closeConfirmDialog } from '@/application/slices/uiSlice';
import { Button } from './Button';

export function ConfirmDialog() {
  const dispatch = useAppDispatch();
  const { open, title, description, onConfirm } = useAppSelector(s => s.ui.confirmDialog);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.();
    dispatch(closeConfirmDialog());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-900">{title}</h2>
        <p id="confirm-desc" className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => dispatch(closeConfirmDialog())}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### EmptyState

```typescript
// src/components/ui/EmptyState.tsx
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && <div className="mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

### YouTubePlayer

Embeds YouTube videos using the official IFrame API. Fires a callback when playback reaches 90%.

```typescript
// src/components/course/YouTubePlayer.tsx
'use client';
import { useEffect, useRef, useCallback } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onThresholdReached?: () => void; // fired at ≥90% playback (FR-STU-013)
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({ videoId, onThresholdReached }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thresholdFiredRef = useRef(false);

  const startPolling = useCallback(() => {
    intervalRef.current = setInterval(() => {
      if (!playerRef.current || thresholdFiredRef.current) return;
      const duration = playerRef.current.getDuration?.();
      const current = playerRef.current.getCurrentTime?.();
      if (duration > 0 && current / duration >= 0.9) {
        thresholdFiredRef.current = true;
        onThresholdReached?.();
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 2000);
  }, [onThresholdReached]);

  useEffect(() => {
    const loadPlayer = () => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) startPolling();
            if (e.data === window.YT.PlayerState.PAUSED && intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      loadPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = loadPlayer;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
  }, [videoId, startPolling]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
```

---

## 10. Page Specifications — All Roles

---

### 10.1 Public Pages

#### `/` — Landing Page
- **Rendering:** SSG
- **Content:** Hero section, platform features overview, CTA to Register / Login
- **Data:** Static (no API calls)
- **FR:** — (marketing page)

#### `/login` — Login Page
- **Rendering:** CSR
- **Fields:** Email, Password
- **Actions:** Submit → `loginThunk` → on success redirect to role-appropriate `/dashboard`; on `PENDING` or `REJECTED` account show non-disclosing error toast
- **Links:** "Don't have an account? Register" · "Forgot password?"
- **Validation (client):** Email format; password non-empty
- **FR:** FR-AUTH-004, FR-STU-002

#### `/register` — Student Registration Page
- **Rendering:** CSR
- **Fields:** First Name, Last Name, Email, Password, Confirm Password
- **Password rules displayed inline:** min 10 chars, mixed case, digit, symbol
- **Actions:** Submit → `POST /api/v1/auth/register` → show success banner "Your account is pending approval"; user cannot log in
- **Validation:** Zod schema from `slp-contracts` (`registrationSchema`)
- **FR:** FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-STU-001

#### `/courses` — Public Course Catalog
- **Rendering:** SSR (Next.js `generateStaticParams` + ISR revalidation every 60 s)
- **Data:** `getPublishedCoursesQuery` prefetched on server
- **Layout:** Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- **Components:** `CourseCard` (title, description summary, cover image, "Apply to Enroll" / "View" button)
- **Empty state:** "No courses published yet. Check back soon."
- **FR:** FR-STU-005

#### `/courses/[courseId]` — Public Course Detail
- **Rendering:** SSR
- **Data:** `getCourseByIdQuery` (published state only; 404 if DRAFT)
- **Sections:** Cover image, title, description, semester/subject list (titles only — no video/attachments until enrolled and approved)
- **CTA:** "Apply to Enroll" (visible to unauthenticated or non-enrolled students); "Continue Learning" (visible to approved enrolled students)
- **FR:** FR-STU-006

---

### 10.2 Student Pages

All student pages wrapped in `<AuthGuard requiredRoles={['student']} />`.

#### `/dashboard` (student) — Student Dashboard
- **Rendering:** CSR
- **Sections:**
  - Enrolled courses with progress ring (% completion)
  - "Continue Learning" quick-action card (last accessed subject)
  - Unread notifications count badge
- **Data:** `getMyEnrollmentsQuery`, `getCourseProgressQuery` per course
- **Empty state for no enrollments:** "Browse the course catalog to get started" with link to `/courses`
- **FR:** FR-STU-008, FR-STU-009, FR-LRN-004

#### `/my-courses` — Enrolled Courses List
- **Rendering:** CSR
- **List items:** Course title, cover image, enrollment state badge, progress percentage, "Continue" button
- **Filters:** By enrollment status (All / Approved / Pending)
- **FR:** FR-STU-008, FR-ENR-004

#### `/my-courses/[courseId]` — Course Viewer
- **Rendering:** CSR
- **Layout:** Left sidebar (semester/subject navigation) + right content panel
- **Sidebar:** Collapsible `SemesterAccordion` listing subjects with completion tick marks
- **Content panel:** Subject title, description, `YouTubePlayer`, attachments list (download links)
- **"Mark as Complete" button:** Calls `markSubjectComplete` mutation; button changes to "Completed ✓" on success
- **Progress bar:** Updates in real time via RTK Query cache invalidation
- **Breadcrumb:** Home → My Courses → [Course Name] → [Subject Name]
- **FR:** FR-STU-009, FR-STU-010, FR-STU-011, FR-LRN-001 to FR-LRN-004, FR-LRN-007

#### `/my-courses/[courseId]/[subjectId]` — Subject / Lesson Page
- **Rendering:** CSR
- **Full-page lesson view:** Large `YouTubePlayer` (aspect-video), description, attachment cards with file name, type badge, download button
- **Auto-complete logic:** `YouTubePlayer.onThresholdReached` + all attachments opened → dispatch `markSubjectComplete` with `source=auto`
- **Navigation:** "← Previous Subject" / "Next Subject →" buttons
- **FR:** FR-STU-010, FR-STU-013, FR-LRN-003, FR-LRN-007

#### `/profile` (student) — Student Profile
- **Rendering:** CSR
- **Sections:**
  - Profile photo (upload, preview)
  - Display name, contact details (edit inline)
  - Change password section (current password required)
- **Save:** `PATCH /api/v1/me` — success toast; error messages inline
- **FR:** FR-STU-003

#### `/notifications` (student) — Notification Center
- **Rendering:** CSR
- **List:** All notifications newest-first; unread items highlighted with left accent border
- **Actions:** "Mark all read" button; per-item "Mark as read"
- **Empty state:** "No notifications yet."
- **FR:** FR-NOT-001, FR-NOT-006

---

### 10.3 Admin Pages

All admin pages wrapped in `<AuthGuard requiredRoles={['admin', 'super_admin']} />`.

#### `/dashboard` (admin) — Admin Dashboard
- **Rendering:** CSR
- **Stat cards:**
  - Pending registrations (count + link to queue)
  - Pending enrollments (count + link to queue)
  - Draft courses (count + link)
  - Published courses (count + link)
  - Total enrolled students
- **Quick-action buttons:** "Review Registrations", "Review Enrollments", "Create Course"
- **FR:** FR-ADM-002

#### `/courses` (admin) — Course Management List
- **Rendering:** CSR
- **Table columns:** Title, State badge, Semesters, Subjects, Created by, Created date, Actions
- **Actions per row:** Edit, Publish (if DRAFT), Archive (if PUBLISHED), Delete
- **Filters:** By state (All / Draft / Published / Archived)
- **Search:** By title (debounced, 300 ms)
- **"Create Course" button** links to `/courses/new`
- **FR:** FR-ADM-003, FR-CRS-001 to FR-CRS-005

#### `/courses/new` — Create Course
- **Rendering:** CSR
- **Form fields:** Title, Description (textarea), Cover image upload (optional)
- **Submit:** `createCourseMutation` → redirect to `/courses/[newId]` editor
- **Validation:** Zod `createCourseSchema` — title required, unique (checked server-side)
- **FR:** FR-CRS-001

#### `/courses/[courseId]` (admin) — Course Editor
- **Rendering:** CSR
- **Sections:**
  1. **Metadata panel:** Title, Description, Cover image, State badge, "Publish" / "Unpublish" / "Archive" buttons
  2. **Semesters panel:** Drag-to-reorder list of semesters; "Add Semester" button; each semester expandable with subject list
  3. **Subjects list per semester:** Drag-to-reorder; "Add Subject" button; each subject shows title + YouTube ID + attachment count

- **Publish validation:** If course has no semesters or a semester has no subjects → inline error message; publish button disabled
- **"Delete Course" button:** Wrapped in `ConfirmDialog` ("This will soft-delete the course. Enrolled students will lose access.")
- **FR:** FR-ADM-003 to FR-ADM-006, FR-CRS-002 to FR-CRS-012

#### `/courses/[courseId]/semesters/[semesterId]/subjects/new` — Create Subject
- **Form fields:**
  - Title (required, max 200)
  - Description (required, textarea)
  - YouTube Video URL or ID (required — validated to 11-char ID on blur; shows embeddability warning if needed)
  - Sort order (number)
  - Attachments (multi-file upload; PDF/.doc/.docx only; 25 MB max each; file type enforced client-side and server-side)
- **Attachment upload UX:** Drag-and-drop zone + browse button; per-file progress bar; file type/size error shown inline
- **Submit:** `createSubjectMutation` + `uploadAttachmentMutation` per file
- **FR:** FR-ADM-006, FR-CRS-008, FR-CRS-009, FR-CRS-010

#### `/students` — Student List
- **Rendering:** CSR
- **Table columns:** Name, Email, Status badge, Enrolled courses count, Joined date, Actions
- **Actions per row:** View, Suspend (if APPROVED), Reactivate (if SUSPENDED)
- **Filters:** Status (All / Pending / Approved / Rejected / Suspended), enrolled in course (dropdown)
- **Search:** Free-text (name or email substring, debounced)
- **Pagination:** Cursor-based, 25 per page
- **Suspend action:** Wrapped in `ConfirmDialog`
- **FR:** FR-ADM-009, FR-ADM-010

#### `/students/[studentId]` — Student Detail
- **Sections:**
  - Profile info
  - Account status + actions (Suspend / Reactivate)
  - Enrollment history table
  - Per-course progress summary
- **FR:** FR-ADM-009, FR-ADM-010, FR-LRN-006

#### `/registrations` — Pending Registrations Queue
- **Rendering:** CSR
- **Auto-refreshes:** Every 30 s via RTK Query `pollingInterval`
- **Table columns:** Name, Email, Submitted date, Actions
- **Actions per row:** Approve (green), Reject (red)
- **Approve action:** Calls `approveRegistrationMutation`; row disappears with fade-out; success toast
- **Reject action:** Wrapped in `ConfirmDialog`; calls `rejectRegistrationMutation`
- **Bulk approve:** Checkbox column → "Approve Selected" button → `Promise.all` of approve mutations
- **Empty state:** "No pending registrations. All caught up! ✓"
- **FR:** FR-ENR-001 to FR-ENR-003, FR-ADM-007, FR-ADM-011

#### `/enrollments` — Pending Enrollments Queue
- **Rendering:** CSR
- **Auto-refreshes:** Every 30 s
- **Table columns:** Student name, Course title, Submitted date, Actions
- **Filter:** By course (dropdown)
- **Actions per row:** Approve, Reject (with optional reason input)
- **FR:** FR-ENR-005 to FR-ENR-007, FR-ADM-008

#### `/profile` (admin) — Admin Profile
- Same structure as student profile page
- **FR:** FR-ADM-001

#### `/notifications` (admin) — Admin Notifications
- Same structure as student notifications page
- Includes registration and enrollment pending alerts
- **FR:** FR-NOT-001, FR-NOT-004, FR-NOT-005

---

### 10.4 Super Admin Pages

All super-admin pages wrapped in `<AuthGuard requiredRoles={['super_admin']} />`.

#### `/admins` — Admin List
- **Rendering:** CSR
- **Table columns:** Name, Email, Status badge, Last login, Created date, Actions
- **Actions per row:** View, Suspend (if ACTIVE), Reactivate (if SUSPENDED), Delete
- **"Create Admin" button** → links to `/admins/new`
- **FR:** FR-SADM-002, FR-SADM-003, FR-SADM-004

#### `/admins/new` — Create Admin
- **Form fields:** First name, Last name, Email, Initial password (auto-generated or manual)
- **Submit:** `POST /api/v1/super-admin/admins` → success toast + redirect to admin list
- **FR:** FR-SADM-001

#### `/admins/[adminId]` — Admin Detail
- **Sections:** Profile info, Status badge, Activity log, Suspend/Reactivate/Delete actions
- **Suspend/Delete actions:** Wrapped in `ConfirmDialog` with consequences stated
- **FR:** FR-SADM-003, FR-SADM-004, FR-SADM-005

#### `/audit-log` — System Audit Log
- **Rendering:** CSR
- **Table columns:** Timestamp, Actor, Action, Target type, Target ID, Request ID
- **Filters:** Actor (search), Action (dropdown), Target type (dropdown), Date range picker
- **Pagination:** Cursor-based, 50 per page
- **Export CSV button:** Downloads current filtered set
- **FR:** FR-SADM-007, NFR-SEC-011

---

### 10.5 Shared / Common Pages

#### `error.tsx` — Global Error Boundary
- Catches unhandled React errors at segment level
- Shows sanitised "Something went wrong" with a "Try again" button
- Logs to console (stack trace never shown to user per NFR-AVL-006)

#### `not-found.tsx` — 404 Page
- "Page not found" with navigation back to dashboard

---

## 11. UI Component Library (Tailwind Design System)

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand palette — maps to CSS variables for theme switching
        primary: {
          50:  'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
        },
        brand: {
          navy:  '#1B3A6B',
          blue:  '#2563EB',
          teal:  '#0F766E',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

### Global CSS & CSS Custom Properties

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary-50:  #eff6ff;
    --color-primary-100: #dbeafe;
    --color-primary-500: #3b82f6;
    --color-primary-600: #2563eb;
    --color-primary-700: #1d4ed8;
    --font-sans: 'Geist', ui-sans-serif, system-ui, sans-serif;
    --font-mono: 'Geist Mono', ui-monospace, monospace;
  }

  * {
    @apply border-slate-200;
  }

  body {
    @apply bg-slate-50 text-slate-900 antialiased;
  }
}

@layer components {
  /* Reusable layout patterns */
  .page-container {
    @apply mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8;
  }

  .card {
    @apply rounded-xl border bg-white p-6 shadow-card;
  }

  .section-title {
    @apply text-lg font-semibold text-slate-900;
  }

  .field-label {
    @apply block text-sm font-medium text-slate-700;
  }

  .field-error {
    @apply mt-1 text-xs text-red-600;
  }
}
```

### Responsive Breakpoints

| Breakpoint | Min Width | Context |
|-----------|:--------:|---------|
| `sm` | 640 px | Large phones / small tablets |
| `md` | 768 px | Tablets |
| `lg` | 1024 px | Small desktops |
| `xl` | 1280 px | Standard desktops |
| `2xl` | 1536 px | Large desktops |
| Min supported | 360 px | Per SRS NFR-USB-001 |

### Sidebar Layout Pattern

```typescript
// src/components/layout/AdminLayout.tsx
'use client';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 lg:flex lg:flex-col">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-slate-900/50" />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="page-container py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global confirm dialog */}
      <ConfirmDialog />
    </div>
  );
}
```

---

## 12. Form Handling Strategy

All forms use **React Hook Form** with **Zod resolvers**. Schemas are sourced from `slp-contracts` or the local `src/domain/schemas/` folder. Client-side validation is UX-only; server-side validation is authoritative.

### Registration Form Example

```typescript
// src/components/auth/RegisterForm.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName:  z.string().min(1, 'Last name is required').max(100),
  email:     z.string().email('Enter a valid email address'),
  password:  z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Must include at least one uppercase letter')
    .regex(/[a-z]/, 'Must include at least one lowercase letter')
    .regex(/[0-9]/, 'Must include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must include at least one special character'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.error?.code === 'EMAIL_EXISTS') {
          setError('email', { message: 'This email is already registered.' });
        } else {
          setError('root', { message: 'Registration failed. Please try again.' });
        }
        return;
      }
      router.push('/register/pending'); // Shows "awaiting approval" screen
    } catch {
      setError('root', { message: 'An unexpected error occurred.' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="field-label">First Name</label>
          <Input id="firstName" {...register('firstName')} error={errors.firstName?.message} />
        </div>
        <div>
          <label htmlFor="lastName" className="field-label">Last Name</label>
          <Input id="lastName" {...register('lastName')} error={errors.lastName?.message} />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="field-label">Email Address</label>
        <Input id="email" type="email" {...register('email')} error={errors.email?.message} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <Input id="password" type="password" {...register('password')} error={errors.password?.message} />
        <p className="mt-1 text-xs text-slate-500">
          Min 10 chars · uppercase · lowercase · number · special character
        </p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
        <Input id="confirmPassword" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
      </div>
      {errors.root && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
        Create Account
      </Button>
    </form>
  );
}
```

### Form Design Rules

1. All `<input>` and `<textarea>` elements have associated `<label>` elements (linked via `id`/`htmlFor`) — required for WCAG
2. Validation errors render **below the field** with `role="alert"` on form-level errors
3. Forms use `noValidate` to disable browser native validation (Zod handles it)
4. Submit button shows `loading` spinner and is `disabled` during submission
5. Network errors set `errors.root` and render a top-level error banner
6. Successful destructive actions (delete, reject, suspend) always go through `ConfirmDialog`

---

## 13. Notifications & Real-Time Updates

### Polling Strategy

The SRS specifies in-app notifications as the authoritative channel. The frontend polls the notifications endpoint every 60 seconds while the user is authenticated.

```typescript
// src/application/api/notificationsApi.ts
import { baseApi } from './baseApi';
import type { Notification, PaginatedResponse } from '@/domain/types/notification';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedResponse<Notification>, void>({
      query: () => '/me/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/me/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: '/me/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

// Polling usage in NotificationBell.tsx:
// useGetNotificationsQuery(undefined, { pollingInterval: 60_000 });
```

### Notification Bell Component

```typescript
// src/components/layout/NotificationBell.tsx
'use client';
import { useGetNotificationsQuery } from '@/application/api/notificationsApi';
import { BellIcon } from 'lucide-react';
import Link from 'next/link';

export function NotificationBell() {
  const { data } = useGetNotificationsQuery(undefined, {
    pollingInterval: 60_000,
  });
  const unread = data?.items?.filter(n => !n.readAt).length ?? 0;

  return (
    <Link
      href="/notifications"
      className="relative rounded-full p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
    >
      <BellIcon className="h-5 w-5 text-slate-600" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
```

### Admin Queue Auto-Refresh

The registration and enrollment queue pages poll every 30 seconds to surface new requests without a page reload.

```typescript
// In /registrations/page.tsx
const { data, isLoading } = useGetPendingRegistrationsQuery(
  {},
  { pollingInterval: 30_000 }
);
```

---

## 14. Error Handling Strategy

### API Error Normalisation

The API returns errors in the envelope: `{ error: { code, message, details? }, requestId }`.

```typescript
// src/infrastructure/api/errorHandler.ts
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  requestId: string;
}

export function parseApiError(response: any): ApiError {
  return {
    code:      response?.error?.code      ?? 'UNKNOWN_ERROR',
    message:   response?.error?.message   ?? 'An unexpected error occurred.',
    details:   response?.error?.details,
    requestId: response?.requestId        ?? '',
  };
}

// HTTP status → user-friendly message mapping
export function getStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'The request contained invalid data. Please check your input.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested item could not be found.',
    409: 'A conflict occurred. This item may already exist.',
    422: 'The submitted data could not be processed.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'A server error occurred. Please try again later.',
  };
  return messages[status] ?? 'An unexpected error occurred.';
}
```

### RTK Query Error Handling Pattern

```typescript
// In a component using RTK Query mutations:
const [approveMutation, { isLoading, error }] = useApproveEnrollmentMutation();
const dispatch = useAppDispatch();

const handleApprove = async (id: string) => {
  try {
    await approveMutation(id).unwrap();
    dispatch(addToast({ type: 'success', message: 'Enrollment approved.' }));
  } catch (err: any) {
    const msg = err?.data?.error?.message ?? 'Failed to approve enrollment.';
    dispatch(addToast({ type: 'error', message: msg }));
  }
};
```

### Toast Notification System

Toasts are rendered at the root layout level, sourcing from the Redux `uiSlice`.

```typescript
// src/components/ui/Toast.tsx — rendered in RootLayout
'use client';
import { useAppSelector, useAppDispatch } from '@/application/store';
import { removeToast } from '@/application/slices/uiSlice';
import { cn } from '@/lib/cn';
import { useEffect } from 'react';

const typeStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50   border-red-200   text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-blue-50  border-blue-200  text-blue-800',
};

export function ToastContainer() {
  const toasts = useAppSelector(s => s.ui.toasts);
  const dispatch = useAppDispatch();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dispatch(removeToast(toast.id))}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: any; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        'flex max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
        typeStyles[toast.type as keyof typeof typeStyles]
      )}
    >
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
```

---

## 15. Performance Optimisation

### Next.js Image Optimisation

All images (course covers, profile photos) rendered through `next/image` with proper `sizes` attributes.

```tsx
import Image from 'next/image';

<Image
  src={course.coverImageUrl}
  alt={course.title}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="object-cover"
  priority={isAboveFold}
/>
```

### Code Splitting

- Next.js App Router **automatically code-splits** at the page level
- Heavy components (`YouTubePlayer`, `CourseEditor`, rich text) use `next/dynamic` with SSR disabled:

```typescript
import dynamic from 'next/dynamic';

const YouTubePlayer = dynamic(
  () => import('@/components/course/YouTubePlayer').then(m => m.YouTubePlayer),
  { ssr: false, loading: () => <div className="aspect-video rounded-lg bg-slate-100 animate-pulse" /> }
);
```

### RTK Query Caching Strategy

| Endpoint | Cache behaviour | Keep unused data |
|----------|----------------|:----------------:|
| `getPublishedCourses` | Tag: `Course` · Invalidated by `createCourse`, `publishCourse` | 300 s |
| `getCourseById` | Tag: `{ type: Course, id }` · Invalidated by `updateCourse` | 300 s |
| `getMyEnrollments` | Tag: `Enrollment` · Invalidated by `enrollInCourse` | 60 s |
| `getCourseProgress` | Tag: `{ type: Progress, id }` · Invalidated by `markSubjectComplete` | 60 s |
| `getNotifications` | Tag: `Notification` · Polled every 60 s | 0 s |
| `getPendingRegistrations` | Tag: `Registration` · Polled every 30 s | 0 s |
| `getPendingEnrollments` | Tag: `Enrollment` · Polled every 30 s | 0 s |

### Bundle Size Rules

- No moment.js — use `date-fns` (tree-shakable)
- No lodash — use native JS or individual `lodash-es` imports
- Keep `firebase` import minimal — only Auth SDK: `import { getAuth } from 'firebase/auth'`
- Use `lucide-react` individual icon imports, not barrel imports
- Tailwind `purge` configured for production to eliminate unused utility classes

### Web Vitals Targets (NFR-PRF-004)

| Metric | Target |
|--------|--------|
| First Contentful Paint | ≤ 2.0 s |
| Time to Interactive | ≤ 3.5 s |
| Largest Contentful Paint | ≤ 2.5 s |
| Cumulative Layout Shift | < 0.1 |
| First Input Delay | < 100 ms |

---

## 16. Accessibility (WCAG 2.1 AA)

### Requirements (NFR-USB-003)

| Criterion | Implementation |
|-----------|---------------|
| Keyboard navigation | All interactive elements reachable via Tab; visible `focus-visible` ring on all focusable elements (Tailwind `focus-visible:ring-2`) |
| Semantic HTML | `<nav>`, `<main>`, `<aside>`, `<header>`, `<section>`, `<article>` landmark elements used correctly; headings follow logical `h1→h2→h3` hierarchy |
| ARIA labels | Icon-only buttons have `aria-label`; notification bell announces unread count; modals use `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Colour contrast | All text/background combinations meet WCAG AA ratio (4.5:1 normal text, 3:1 large text); verified with Tailwind's contrast palette |
| Live regions | Toast container has `aria-live="polite"`; error banners have `role="alert"` |
| Form labels | Every `<input>` / `<textarea>` / `<select>` has an associated `<label>` or `aria-label` |
| Images | All `<Image>` components have meaningful `alt` text; decorative images have `alt=""` |
| Skip link | `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` in root layout |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` applied to all CSS transitions and animations |
| Focus management | Modal opens move focus to first focusable element; modal closes return focus to trigger element |

### Tailwind Accessibility Utilities

```css
/* Used throughout components */
.sr-only           /* visually hidden but available to screen readers */
.focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
.not-sr-only       /* unhide sr-only elements on focus */
```

---

## 17. Environment Configuration

```bash
# .env.example — commit this file; .env.local is gitignored

# API
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

# Firebase (public keys — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Feature flags
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_SEARCH=false

# Build
NEXT_PUBLIC_APP_VERSION=$npm_package_version
```

```typescript
// src/lib/config.ts
export const config = {
  apiBaseUrl:    process.env.NEXT_PUBLIC_API_URL!,
  firebase: {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  },
  features: {
    darkMode: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === 'true',
    search:   process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
  },
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0',
} as const;
```

---

## 18. Testing Strategy

### Testing Pyramid

```
                     ┌──────────┐
                     │   E2E    │   ~20 tests (Playwright)
                     │  Tests   │   Critical user journeys
                     ├──────────┤
                  ┌──┤Integration├──┐
                  │  │  Tests   │  │  ~50 tests (RTL + MSW)
                  │  └──────────┘  │  Feature components + API mocking
               ┌──┴──────────────┴──┐
               │    Unit Tests       │   ~150 tests (Jest + RTL)
               │  Slices · Hooks    │   Redux logic, utils, domain
               └────────────────────┘
```

### Unit Tests (Jest)

- **Redux slices:** Test reducers and selectors in isolation with mocked state
- **Domain utils:** Pure function testing (progressUtils, courseUtils, dateUtils)
- **Zod schemas:** Test valid and invalid inputs against schemas
- **Custom hooks:** Using `renderHook` from `@testing-library/react`

```typescript
// tests/unit/authSlice.test.ts
import { authSlice, loginThunk } from '@/application/slices/authSlice';

describe('authSlice', () => {
  it('sets status to loading on loginThunk.pending', () => {
    const state = authSlice.reducer(undefined, loginThunk.pending('', { email: '', password: '' }));
    expect(state.status).toBe('loading');
  });

  it('sets user and authenticated on loginThunk.fulfilled', () => {
    const mockUser = { uid: '123', role: 'student', status: 'approved' };
    const state = authSlice.reducer(undefined, loginThunk.fulfilled(mockUser as any, '', { email: '', password: '' }));
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(mockUser);
  });
});
```

### Integration Tests (React Testing Library + MSW)

```typescript
// tests/integration/CourseCard.test.tsx
import { render, screen } from '@testing-library/react';
import { CourseCard } from '@/components/course/CourseCard';

const mockCourse = {
  id: 'c1',
  title: 'Introduction to TypeScript',
  description: 'Learn TypeScript from scratch.',
  state: 'published' as const,
  semesterCount: 3,
};

describe('CourseCard', () => {
  it('renders course title and description', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Introduction to TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Learn TypeScript from scratch.')).toBeInTheDocument();
  });

  it('shows Published badge', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

Critical flows covered:

| Test | Pages | Priority |
|------|-------|:--------:|
| Student registration → pending screen | `/register` | P0 |
| Admin approves student → student logs in | `/registrations`, `/login` | P0 |
| Admin creates & publishes course | `/courses/new`, `/courses/[id]` | P0 |
| Student enrolls → Admin approves → student accesses content | Multiple | P0 |
| Student marks subject complete → progress updates | `/my-courses/[id]/[subjectId]` | P0 |
| Super Admin creates Admin → Admin logs in | `/admins/new`, `/login` | P1 |
| Admin rejects enrollment with reason → student sees notification | Multiple | P1 |
| Unauthenticated user redirected to login | Any protected route | P0 |
| Student cannot access DRAFT course URL | `/courses/[draftId]` | P0 |
| Admin cannot access /admins (Super Admin only) | `/admins` | P1 |

---

## 19. Build, CI/CD & Deployment

### Build Commands

```bash
# Development
npm run dev           # Start Next.js dev server with hot reload

# Type checking
npm run type-check    # tsc --noEmit

# Linting
npm run lint          # eslint src --ext .ts,.tsx
npm run lint:fix      # eslint src --ext .ts,.tsx --fix

# Formatting
npm run format        # prettier --write src

# Testing
npm run test          # jest --coverage
npm run test:e2e      # playwright test

# Production build
npm run build         # next build
npm run start         # next start (preview production locally)

# Analyse bundle
npm run analyze       # ANALYZE=true next build
```

### CI/CD Pipeline (per PR + main branch)

```yaml
# .github/workflows/ci.yml (illustrative)
steps:
  - Checkout code
  - Setup Node.js 20.x
  - Install dependencies (npm ci)
  - Type check (npm run type-check)
  - Lint (npm run lint)
  - Unit + integration tests (npm run test)
  - Production build (npm run build)
  - E2E tests against built app (npm run test:e2e)
  - Deploy to staging (on main branch merge)
  - Run Lighthouse CI (assert Web Vitals targets)
  - Deploy to production (on release tag)
```

### next.config.ts

```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Output for containerised deployment
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' }, // Firebase Cloud Storage
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'X-Frame-Options',             value: 'DENY' },
          { key: 'X-XSS-Protection',            value: '1; mode=block' },
          { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.youtube.com https://apis.google.com",
              "frame-src https://www.youtube.com",
              "connect-src 'self' https://apis.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
              "img-src 'self' data: https://storage.googleapis.com https://i.ytimg.com",
              "style-src 'self' 'unsafe-inline'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Redirect HTTP to HTTPS (handled at CDN level; here for completeness)
  async redirects() {
    return [];
  },
};

export default config;
```

### Deployment

| Environment | Trigger | Host |
|-------------|---------|------|
| **Development** | `npm run dev` | localhost:3000 |
| **Preview** | PR opened | CDN/edge (e.g., Vercel Preview, Netlify Deploy Preview) |
| **Staging** | Merge to `main` | CDN/edge — staging domain |
| **Production** | Release tag push | CDN/edge — production domain, HSTS enabled |

---

## 20. Feature Flags & Internationalisation

### Feature Flags

Feature flags are environment-variable-driven for v1.0. No external feature flag service required at launch.

```typescript
// src/lib/config.ts — features section
features: {
  darkMode:       process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === 'true',
  search:         process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',    // FR-STU-014 (COULD)
  bookmarks:      process.env.NEXT_PUBLIC_ENABLE_BOOKMARKS === 'true', // FR-STU-015 (COULD)
  bulkApprove:    process.env.NEXT_PUBLIC_ENABLE_BULK_APPROVE === 'true', // FR-ADM-011 (COULD)
  csvExport:      process.env.NEXT_PUBLIC_ENABLE_CSV_EXPORT === 'true',   // FR-ADM-012 (COULD)
}
```

Usage in components:

```typescript
import { config } from '@/lib/config';

{config.features.search && (
  <SearchBar placeholder="Search courses..." />
)}
```

### Internationalisation Readiness (NFR-USB-004)

All user-facing strings are externalised. v1.0 ships English only. The architecture supports adding locales without code changes.

```
src/
└── messages/
    └── en.json           # All UI strings — English (v1.0 default)
    # future:
    # └── si.json         # Sinhala
    # └── ta.json         # Tamil
```

```json
// src/messages/en.json (sample)
{
  "auth": {
    "login": {
      "title": "Welcome back",
      "emailLabel": "Email address",
      "passwordLabel": "Password",
      "submitButton": "Sign in",
      "registerLink": "Don't have an account? Register"
    },
    "register": {
      "title": "Create your account",
      "pendingMessage": "Your account is pending approval. You will be notified by email."
    }
  },
  "courses": {
    "emptyState": {
      "title": "No courses available",
      "description": "Check back soon for new courses."
    }
  },
  "errors": {
    "generic": "An unexpected error occurred. Please try again.",
    "unauthorized": "You do not have permission to perform this action.",
    "sessionExpired": "Your session has expired. Please log in again."
  }
}
```

String loading via `next-intl` (or equivalent) — configured to default to `en` for v1.0.

---

## Appendix A — Domain Types (Representative)

```typescript
// src/domain/types/user.ts
export type UserRole   = 'super_admin' | 'admin' | 'student';
export type UserStatus = 'pending_approval' | 'approved' | 'rejected' | 'suspended';

export interface UserProfile {
  uid:             string;
  email:           string;
  role:            UserRole;
  status:          UserStatus;
  firstName:       string;
  lastName:        string;
  profilePhotoUrl?: string;
  createdAt:       string;
  updatedAt:       string;
}

// src/domain/types/course.ts
export type CourseState    = 'draft' | 'published' | 'archived';
export type EnrollmentState = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type ProgressState  = 'not_started' | 'in_progress' | 'completed';

export interface Course {
  id:             string;
  title:          string;
  titleSlug:      string;
  description:    string;
  coverImageUrl?: string;
  state:          CourseState;
  createdBy:      string;
  createdByName:  string;
  semesterCount:  number;
  publishedAt?:   string;
  createdAt:      string;
  updatedAt:      string;
}

export interface Semester {
  id:          string;
  courseId:    string;
  name:        string;
  sortOrder:   number;
  subjectCount: number;
}

export interface Attachment {
  id:          string;       // Attachment document ID (needed for download-url and delete endpoints)
  subjectId:   string;
  storagePath: string;
  fileName:    string;
  mimeType:    string;
  sizeBytes:   number;
  uploadedBy:  string;
  uploadedAt:  string;
}

export interface Subject {
  id:             string;
  semesterId:     string;
  title:          string;
  description:    string;
  youtubeVideoId: string;
  sortOrder:      number;
  attachments:    Attachment[];
}

// src/domain/types/progress.ts
export type ProgressState = 'not_started' | 'in_progress' | 'completed';
export type CompletionSource = 'manual' | 'auto';

export interface SubjectProgress {
  studentUid:        string;
  subjectId:         string;
  courseId:          string;
  semesterId:        string;
  state:             ProgressState;
  completionSource?: CompletionSource;
  completedAt?:      string;       // ISO 8601; immutable once set (FR-LRN-008)
  lastAccessedAt?:   string;       // ISO 8601; updated on each subject visit
}

// Renamed from CourseProgress to match API doc (GET /me/progress/courses/:courseId)
export interface CourseProgressAggregate {
  courseId:               string;
  studentUid:             string;
  totalSubjects:          number;
  completedCount:         number;
  pendingCount:           number;
  completionPercent:      number;  // 0.0–100.0, 1 decimal place
  lastAccessedSubjectId:  string | null;
}

// Used by admin progress view (GET /admin/progress/courses/:courseId items)
export interface AdminCourseProgress {
  studentUid:        string;
  studentName:       string;
  completedCount:    number;
  completionPercent: number;
  lastAccessedAt:    string | null;
}

// src/domain/types/notification.ts
export type NotificationCategory =
  | 'registration_approved'
  | 'registration_rejected'
  | 'enrollment_pending'
  | 'enrollment_approved'
  | 'enrollment_rejected'
  | 'course_published'
  | 'system';

export interface Notification {
  id:        string;
  userUid:   string;
  category:  NotificationCategory;
  title:     string;
  body:      string;
  payload:   Record<string, unknown>;
  readAt:    string | null;   // null = unread
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items:      T[];
  nextCursor: string | null;
  total?:     number;
}
```

---

## Appendix B — Custom Hooks Reference

| Hook | Location | Purpose |
|------|----------|---------|
| `useAuth()` | `application/hooks/useAuth.ts` | Returns `{ user, status, login, logout }` |
| `useRole()` | `application/hooks/useRole.ts` | Returns `{ role, isAdmin, isStudent, isSuperAdmin }` |
| `useCourseProgress(courseId)` | `application/hooks/useCourseProgress.ts` | Wraps `useGetCourseProgressQuery` — returns `CourseProgressAggregate` |
| `useSubjectProgress(subjectId)` | `application/hooks/useSubjectProgress.ts` | Wraps `useGetSubjectProgressQuery` — per-subject completion state |
| `useNotifications()` | `application/hooks/useNotifications.ts` | Polled notifications + mark read helpers |
| `useConfirmDialog()` | `application/hooks/useConfirmDialog.ts` | Dispatches `openConfirmDialog` action |
| `useDebounce(value, delay)` | `application/hooks/useDebounce.ts` | Debounces a value (used for search inputs) |
| `usePagination(fetchFn)` | `application/hooks/usePagination.ts` | Cursor-based pagination state management |

---

## Appendix C — SRS Requirement Traceability

| SRS Requirement | Frontend Implementation |
|-----------------|------------------------|
| FR-AUTH-001 | `RegisterForm.tsx` · `/register/page.tsx` |
| FR-AUTH-004 | `firebaseAuth.ts` · `authSlice.ts` · `loginThunk` |
| FR-AUTH-006 | `logoutThunk` · `signOut()` in `firebaseAuth.ts` |
| FR-AUTH-007 | `AuthGuard.tsx` · `RoleGuard.tsx` · `middleware.ts` |
| FR-STU-005 | `/courses/page.tsx` (SSR, PUBLISHED only) |
| FR-STU-006 | `/courses/[courseId]/page.tsx` (content hidden pre-enrollment) |
| FR-STU-009 | "Continue" button → `lastAccessedSubjectId` from `CourseProgressAggregate` · `useUpdateLastAccessedMutation` on subject open |
| FR-STU-010 | `YouTubePlayer.tsx` · `AttachmentUploader.tsx` |
| FR-STU-011 | `SubjectCompletionToggle.tsx` → `markSubjectComplete({ subjectId, source: 'manual' })` |
| FR-STU-013 | `YouTubePlayer.onThresholdReached` → `markSubjectComplete({ subjectId, source: 'auto' })` |
| FR-CRS-004 | Publish button disabled + validation message when no semesters/subjects |
| FR-CRS-009 | YouTube ID validation in `SubjectEditor` on blur |
| FR-CRS-010 | Client-side MIME type + size check in `AttachmentUploader` |
| FR-ENR-001 | `/registrations/page.tsx` (polled queue) |
| FR-ENR-004 | `EnrollButton.tsx` → `enrollInCourse` mutation |
| FR-ADM-011 | `RegistrationQueue.tsx` checkbox select → `useBulkApproveRegistrationsMutation` |
| FR-LRN-004 | `CourseProgressSummary.tsx` · `CourseProgressRing.tsx` → `CourseProgressAggregate.completionPercent` |
| FR-LRN-007 | `useUpdateLastAccessedMutation` called on subject page mount; "Continue" reads `lastAccessedSubjectId` |
| FR-LRN-008 | Idempotent on server; UI button shows "Completed ✓" regardless of whether it was already complete |
| FR-NOT-001 | `NotificationBell.tsx` · `/notifications/page.tsx` |
| FR-NOT-006 | `markNotificationRead` / `markAllNotificationsRead` mutations |
| FR-SADM-001 | `/admins/new/page.tsx` |
| FR-SADM-007 | `/audit-log/page.tsx` |
| NFR-USB-001 | Tailwind responsive classes; min-width 360 px; no overflow-x |
| NFR-USB-003 | ARIA attributes, semantic HTML, skip link, focus rings |
| NFR-USB-004 | `src/messages/en.json`; i18n-ready architecture |
| NFR-USB-005 | Inline field errors via React Hook Form + Zod |
| NFR-USB-006 | `Spinner` on operations >300 ms; all mutations show loading state |
| NFR-USB-007 | `EmptyState` component on all list pages |
| NFR-USB-008 | `ConfirmDialog` for all destructive actions |
| NFR-SEC-001 | `next.config.ts` security headers (HSTS, CSP, etc.) |
| NFR-PRF-004 | Next.js SSR/SSG + `next/image` + code splitting + bundle optimisation |

---

*© 2026 Future CX Lanka (Pvt) Ltd — Confidential*  
*Document version: 1.0.0 | Paired with SRS dated 07 May 2026 and CMP Blueprint v1.0.0*
