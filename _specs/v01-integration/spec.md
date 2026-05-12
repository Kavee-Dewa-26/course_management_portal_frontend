# Spec: Full Backend Integration — EduPath Frontend
**Version:** v01
**Date:** 2026-05-12
**Status:** Active
**Author:** EduPath Frontend Team

---

## 1. Overview

EduPath (`slp-web`) is a fully built Next.js 14 App Router frontend currently running entirely on in-memory mock data under `src/lib/mock/`. This spec defines all work required to replace every mock with real API calls to `slp-backend` (REST, base path `/api/v1`), including all necessary UI updates so forms, tables, and components correctly reflect real data shapes, error states, and field names from the backend.

**Signup integration is already complete** and merged to `main` on branch `feature/signup-api-integration`.

---

## 2. Scope

### In scope
- Firebase Auth SDK setup and login integration for all three roles (student, admin, super_admin)
- Token storage, auto-refresh, and attaching Bearer token to every authenticated request
- Route guards for all role-gated pages
- All API integrations listed in Section 5
- UI updates required per endpoint (field names, error states, pagination, real data shapes)
- Inline and form-level error handling for every API error code
- Replacing all mock data imports with real API responses

### Out of scope
- Backend development
- Push notifications (beyond in-app)
- Real-time / WebSocket features
- Firebase Cloud Messaging
- Unit or integration tests (test scaffolding exists but is empty)
- `src/ui_structure/` design handoff files (reference only, never imported)

---

## 3. Functional Requirements

| ID | Requirement | Priority | Sprint |
|----|-------------|----------|--------|
| FR-001 | Firebase SDK initialised with env config from backend team | MUST | 1 |
| FR-002 | Login with email + password via Firebase Auth for all roles | MUST | 1 |
| FR-003 | Firebase ID token stored in Redux and attached to all API requests | MUST | 1 |
| FR-004 | Token auto-refreshes before 1h expiry via `onIdTokenChanged` | MUST | 1 |
| FR-005 | Route guards protect `/admin/*`, `/super-admin/*`, `/(student)/*` | MUST | 1 |
| FR-006 | Logout calls Firebase `signOut` + `POST /auth/logout` + clears session | MUST | 1 |
| FR-007 | Password reset flow via `POST /auth/password-reset` | SHOULD | 2 |
| FR-008 | Failed login attempts tracked via `POST /auth/track-failure` | SHOULD | 1 |
| FR-009 | Admin can list, approve, reject, and bulk-approve student registrations | MUST | 2 |
| FR-010 | All users can view and edit their own profile via `GET/PATCH /me` | MUST | 2 |
| FR-011 | All users can change their password via `POST /me/change-password` | MUST | 2 |
| FR-012 | Public course catalog loads from API (published only) | MUST | 3 |
| FR-013 | Course detail page loads real semester/subject/lesson tree | MUST | 3 |
| FR-014 | Student can enroll in a published course | MUST | 4 |
| FR-015 | Student can view and withdraw pending enrollments | MUST | 4 |
| FR-016 | Admin can approve and reject enrollment requests | MUST | 4 |
| FR-017 | Admin can create, edit, publish, unpublish, archive, delete courses | MUST | 5 |
| FR-018 | Admin can manage semesters and subjects within a course | MUST | 6 |
| FR-019 | Admin can manage lessons within a subject | MUST | 6 |
| FR-020 | Admin can upload, download, and delete PDF/DOC attachments on subjects | MUST | 6 |
| FR-021 | Student can mark a subject complete (manual and auto at 90% video) | MUST | 7 |
| FR-022 | Student last-accessed subject is tracked for resume learning | MUST | 7 |
| FR-023 | Course progress percentage loads from API and updates in real time | MUST | 7 |
| FR-024 | Admin can view per-student progress for any course | SHOULD | 7 |
| FR-025 | All roles see real in-app notifications with unread badge count | MUST | 8 |
| FR-026 | Notifications can be marked read individually or all at once | MUST | 8 |
| FR-027 | Admin can list, suspend, and reactivate student accounts | MUST | 8 |
| FR-028 | Super admin can list, create, suspend, reactivate, delete admins | MUST | 8 |
| FR-029 | Super admin can promote a student to admin role | SHOULD | 8 |
| FR-030 | Audit log loads from API with date range and category filters | SHOULD | 8 |

---

## 4. UI / UX Requirements

### 4.1 Authentication & Session

| Component | Current state | Required change |
|---|---|---|
| `LoginForm` | Mock role toggle + instant sign-in | Remove role toggle; real Firebase login; inline errors per error code |
| `LoginForm` | No loading state | Disable button + show "Signing in…" during request |
| All layouts | No auth check | Add `onAuthStateChanged` check; loading skeleton while auth resolves |
| `UserMenu` | Mock logout | Real `signOut` + API logout call |
| All pages | No redirect on 401 | Catch 401 from any API call → redirect to `/login` |

### 4.2 Registration Queue

| Component | Current state | Required change |
|---|---|---|
| `RegistrationsPage` | Mock list | Paginated API list; real timestamps; real total count in header |
| Approve button | Mock state update | Real API call; success toast; remove from pending list |
| Reject button | No reason field | Add optional reason textarea in confirm dialog |
| Bulk approve | Mock | Real endpoint; partial failure handling in toast |
| Empty state | Static | Show when all registrations are processed |

### 4.3 User Profile

| Component | Current state | Required change |
|---|---|---|
| Profile page | Mock data | Load from `GET /me`; pre-fill edit form |
| Edit form | No save | `PATCH /me` on submit; show changed fields only |
| Save button | Always enabled | Disable when no changes detected |
| Password section | Not functional | `POST /me/change-password`; show/hide toggle |

### 4.4 Course Catalog

| Component | Current state | Required change |
|---|---|---|
| `CourseCover` | Always gradient | Use `coverImageUrl` from API; fall back to gradient if null |
| Course cards | Mock metadata | Real title, description, semesterCount, publishedAt |
| Search bar | No API call | Send `?q=` param; debounce 300ms |
| Course list | No pagination | Add next/prev using `nextCursor` |
| Course detail | Mock semesters | Real semester/subject tree from API |

### 4.5 Enrollments

| Component | Current state | Required change |
|---|---|---|
| Enroll button | No action | POST enroll; disable after; show "Pending approval" |
| My courses page | Mock data | Real enrollments with state badges |
| Enrollment state badge | Not shown | Show Pending / Approved / Rejected / Withdrawn |
| Withdraw button | No action | Only on `pending` enrollments; confirm before withdraw |
| Rejection reason | Not shown | Display reason string below rejected enrollment card |

### 4.6 Course Management (Admin)

| Component | Current state | Required change |
|---|---|---|
| Course list table | Mock rows | Real data with state, updatedAt, enrollment count |
| State badge | Hardcoded | Reflect actual `state` from API (draft/published/archived) |
| Create course form | No submit | POST; redirect to editor on success; title uniqueness error |
| Publish button | No validation | Show only on `draft`; handle `422` errors inline |
| Delete confirm | Generic message | Mention 30-day soft-delete recovery |

### 4.7 Course Structure Editor

| Component | Current state | Required change |
|---|---|---|
| Semester tree | Mock semesters | Load from `GET /courses/:id`; real CRUD |
| Subject form | Mock | Real POST/PATCH; YouTube URL validation |
| Lesson form | Not wired | New form: title, video URL (any provider), description |
| Sort order | Manual input | Positive integer; controls display order |

### 4.8 Attachments

| Component | Current state | Required change |
|---|---|---|
| Attachment list | Mock | Real from subject API response |
| Upload area | No action | `multipart/form-data` POST; file type + size validation |
| Download button | No action | Fetch signed URL → open in new tab; 15min expiry |
| File type display | Static | Real `mimeType` and `sizeBytes` from API |

### 4.9 Progress

| Component | Current state | Required change |
|---|---|---|
| Progress bar | Hardcoded % | Real `completionPercent` from API |
| "Mark Complete" | No action | POST; update button to "Completed ✓" |
| Subject sidebar | No completion state | Checkmark on completed subjects |
| "Continue learning" | Mock link | Navigate to real `lastAccessedSubjectId` |

### 4.10 Notifications

| Component | Current state | Required change |
|---|---|---|
| Bell badge | Hardcoded count | Real unread count from API |
| Notification list | Mock | Real list from API; real categories and timestamps |
| Mark read on click | No action | `POST /me/notifications/:id/read` |
| "Mark all read" | No action | `POST /me/notifications/read-all` |

### 4.11 User & Admin Management

| Component | Current state | Required change |
|---|---|---|
| Student list | Mock | Real API with search, status filter, pagination |
| Suspend/Reactivate | Mock state | Real endpoint with UID from API |
| Admin list | Mock `ADMINS_SEED` | Real API |
| Create admin form | Wired to mock | Real `POST /super-admin/admins` with `initialPassword` field |
| Delete admin | Removes from local array | Real `DELETE /super-admin/admins/:uid` |

### 4.12 Audit Log

| Component | Current state | Required change |
|---|---|---|
| Log table | Mock `AUDIT_SEED` | Real API data |
| Date range dropdown | Non-functional | Sends `from`/`to` ISO params derived from selected range |
| Category chips | Filters mock array | Sends `category` param to API |
| Pagination | None | Add using `nextCursor`; show total in header |

---

## 5. API Integration Summary

| Feature | Method + Path | Auth | UI Component |
|---|---|---|---|
| Login | Firebase SDK | — | `LoginForm` |
| Get own profile | `GET /me` | Bearer | All profile pages |
| Update profile | `PATCH /me` | Bearer | Profile edit form |
| Change password | `POST /me/change-password` | Bearer | Profile settings |
| Logout | `POST /auth/logout` | Bearer | `UserMenu` |
| Password reset | `POST /auth/password-reset` | None | Login page |
| Track login failures | `POST /auth/track-failure` | None | `LoginForm` |
| List registrations | `GET /admin/registrations` | Admin | Registrations page |
| Approve registration | `POST /admin/registrations/:id/approve` | Admin | Registrations page |
| Reject registration | `POST /admin/registrations/:id/reject` | Admin | Registrations page |
| Bulk approve | `POST /admin/registrations/bulk-approve` | Admin | Registrations page |
| List courses (public) | `GET /courses` | Optional | Public catalog |
| Get course | `GET /courses/:id` | Optional | Course detail |
| Create course | `POST /courses` | Admin | Admin course editor |
| Update course | `PATCH /courses/:id` | Admin | Admin course editor |
| Publish course | `POST /courses/:id/publish` | Admin | Admin course editor |
| Unpublish course | `POST /courses/:id/unpublish` | Admin | Admin course editor |
| Archive course | `POST /courses/:id/archive` | Admin | Admin course editor |
| Delete course | `DELETE /courses/:id` | Admin | Admin course list |
| Create semester | `POST /courses/:id/semesters` | Admin | Course tree editor |
| Update semester | `PATCH /semesters/:id` | Admin | Course tree editor |
| Delete semester | `DELETE /semesters/:id` | Admin | Course tree editor |
| Create subject | `POST /semesters/:id/subjects` | Admin | Course tree editor |
| Update subject | `PATCH /subjects/:id` | Admin | Course tree editor |
| Delete subject | `DELETE /subjects/:id` | Admin | Course tree editor |
| List lessons | `GET /subjects/:id/lessons` | Student/Admin | Course viewer |
| Create lesson | `POST /subjects/:id/lessons` | Admin | Subject editor |
| Update lesson | `PATCH /lessons/:id` | Admin | Subject editor |
| Delete lesson | `DELETE /lessons/:id` | Admin | Subject editor |
| Upload attachment | `POST /subjects/:id/attachments` | Admin | Subject editor |
| Get download URL | `GET /attachments/:id/download-url` | Student/Admin | Course viewer |
| Delete attachment | `DELETE /attachments/:id` | Admin | Subject editor |
| Enroll in course | `POST /courses/:id/enroll` | Student | Course detail |
| List my enrollments | `GET /me/enrollments` | Student | My courses |
| Withdraw enrollment | `POST /enrollments/:id/withdraw` | Student | My courses |
| List enrollment queue | `GET /admin/enrollments` | Admin | Enrollments page |
| Approve enrollment | `POST /admin/enrollments/:id/approve` | Admin | Enrollments page |
| Reject enrollment | `POST /admin/enrollments/:id/reject` | Admin | Enrollments page |
| Mark subject complete | `POST /progress/subjects/:id/complete` | Student | Course viewer |
| Track subject access | `POST /progress/subjects/:id/access` | Student | Course viewer |
| Get course progress | `GET /me/progress/courses/:courseId` | Student | Course viewer, Dashboard |
| Get subject progress | `GET /me/progress/subjects/:subjectId` | Student | Course viewer |
| Admin course progress | `GET /admin/progress/courses/:courseId` | Admin | Admin course detail |
| List notifications | `GET /me/notifications` | All | Notifications page, Bell |
| Mark notification read | `POST /me/notifications/:id/read` | All | Notification item |
| Mark all read | `POST /me/notifications/read-all` | All | Notifications page |
| List users | `GET /users` | Admin | Students page |
| Get user | `GET /users/:uid` | Admin | Student detail |
| Suspend user | `POST /users/:uid/suspend` | Admin | Students page |
| Reactivate user | `POST /users/:uid/reactivate` | Admin | Students page |
| List admins | `GET /super-admin/admins` | Super Admin | Admins page |
| Create admin | `POST /super-admin/admins` | Super Admin | Admins page |
| Get admin | `GET /super-admin/admins/:uid` | Super Admin | Admin detail |
| Suspend admin | `POST /super-admin/admins/:uid/suspend` | Super Admin | Admins page |
| Reactivate admin | `POST /super-admin/admins/:uid/reactivate` | Super Admin | Admins page |
| Delete admin | `DELETE /super-admin/admins/:uid` | Super Admin | Admins page |
| Promote to admin | `POST /super-admin/users/:uid/make-admin` | Super Admin | Admin detail |
| Get audit log | `GET /audit-log` | Admin/Super Admin | Audit log page |

---

## 6. Error Handling Requirements

All API errors must be handled visibly — no silent failures.

| Error code | HTTP | Where to show |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Inline under affected field(s) using `details` map |
| `INVALID_YOUTUBE_ID` | 400 | Inline on YouTube URL field |
| `FILE_TOO_LARGE` | 400 | Inline on file upload area |
| `MISSING_TOKEN` / `TOKEN_EXPIRED` / `TOKEN_REVOKED` | 401 | Redirect to `/login` with toast |
| `FORBIDDEN` | 403 | Toast "You don't have permission" |
| `ENROLLMENT_REQUIRED` | 403 | Toast or inline prompt to enroll |
| `*_NOT_FOUND` | 404 | Toast + redirect or empty state |
| `EMAIL_EXISTS` | 409 | Inline on email field |
| `COURSE_TITLE_EXISTS` | 409 | Inline on title field |
| `ENROLLMENT_EXISTS` | 409 | Enroll button disabled with "Already enrolled" |
| `INVALID_STATE` | 409 | Toast with server message |
| `ALREADY_SUSPENDED` / `ALREADY_ACTIVE` | 409 | Toast |
| `INVALID_ROLE` | 409 | Toast "Only students can be promoted" |
| `NO_SEMESTERS` / `EMPTY_SEMESTER` | 422 | Toast with actionable message |
| `COURSE_NOT_PUBLISHED` | 422 | Toast |
| `RESUBMIT_TOO_EARLY` | 429 | Toast with 24h cooldown message |
| `RATE_LIMIT_EXCEEDED` | 429 | Toast with retry guidance |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Inline on file upload |
| `INTERNAL_ERROR` | 500 | Toast "Something went wrong. Try again." |
| Network error | — | Toast "Could not reach the server" |

---

## 7. Data Models (Frontend Types)

These types replace all mock interfaces. Define in `src/domain/` when implemented.

```typescript
// Auth / Session
interface SessionUser {
  uid: string;
  email: string;
  role: 'student' | 'admin' | 'super_admin';
  roles: string[];
  status: 'pending_approval' | 'approved' | 'rejected' | 'suspended';
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
}

// Courses
interface Course {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  state: 'draft' | 'published' | 'archived';
  semesterCount: number;
  createdByName: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  semesters?: Semester[];
}

interface Semester {
  id: string;
  courseId: string;
  name: string;
  sortOrder: number;
  subjectCount: number;
  subjects?: Subject[];
}

interface Subject {
  id: string;
  semesterId: string;
  title: string;
  description: string;
  youtubeVideoId: string;
  sortOrder: number;
  attachments: Attachment[];
}

interface Lesson {
  id: string;
  subjectId: string;
  courseId: string;
  semesterId: string;
  title: string;
  description: string | null;
  url: string;
  order: number;
}

interface Attachment {
  id: string;
  subjectId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

// Enrollments
interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  state: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  approvedAt?: string;
  rejectedAt?: string;
  reason?: string;
  createdAt: string;
}

// Progress
interface CourseProgress {
  courseId: string;
  totalSubjects: number;
  completedCount: number;
  completionPercent: number;
  lastAccessedSubjectId: string | null;
}

// Notifications
interface Notification {
  id: string;
  category: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

// Pagination
interface PagedResponse<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}
```

---

## 8. Environment & Setup Requirements

```bash
# Install Firebase
npm install firebase

# Required env variables (get from backend team)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Already configured
NEXT_PUBLIC_API_BASE_URL=http://<backend-ip>:<port>/api/v1
NEXT_PUBLIC_API_PREFIX=/api/v1
```

CORS is already solved via Next.js rewrite proxy in `next.config.mjs`.

---

## 9. Acceptance Criteria

### Authentication
- [ ] Student, admin, and super admin can log in with real credentials
- [ ] Wrong password shows inline error on password field
- [ ] Suspended account shows form-level banner
- [ ] Token attaches to every API request automatically
- [ ] Token refreshes silently before 1h expiry
- [ ] Accessing `/admin` without auth redirects to `/login`
- [ ] Logout clears session and redirects to `/login`

### Registration & Approval
- [ ] Admin sees real pending registrations list with actual names and timestamps
- [ ] Approving a registration allows that student to log in
- [ ] Rejecting with a reason is stored and sent to student
- [ ] Bulk approve handles partial failures gracefully

### Courses & Enrollment
- [ ] Public catalog shows only published courses
- [ ] Course detail shows full semester/subject/lesson tree
- [ ] Student can enroll; button reflects pending/approved/rejected state
- [ ] Admin can approve or reject enrollment with optional reason
- [ ] Enrolled student can access course content; unenrolled cannot

### Course Management
- [ ] Admin can create course → add semesters → add subjects → publish
- [ ] Publishing fails with clear message if no subjects exist
- [ ] Admin can upload PDF/DOC attachments; student can download
- [ ] Student cannot download attachments without an approved enrollment

### Progress
- [ ] Marking a subject complete updates progress bar immediately
- [ ] Returning to a course resumes from `lastAccessedSubjectId`
- [ ] Progress bar shows real percentage, not hardcoded value

### Notifications & Management
- [ ] Bell badge shows real unread count
- [ ] Notifications marked read on click; count decrements
- [ ] Admin can suspend/reactivate student accounts
- [ ] Super admin can create/suspend/delete admin accounts

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Firebase project config keys — when will these be shared? | Backend team | Blocking Sprint 1 |
| 2 | Does `POST /auth/login` endpoint exist, or is login purely via Firebase SDK? | Backend team | Answered: Firebase SDK only |
| 3 | Cover image upload — is there a separate endpoint, or is `coverImageUrl` a manual URL entry? | Backend team | Open |
| 4 | Dual-role admin (promoted student) — which dashboard do they land on after login? | Product | Open |
| 5 | Audit log `actor` field — `actorUid` or `actor.uid` in response? (API doc inconsistency) | Backend team | Open |
