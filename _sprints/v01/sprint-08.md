# Sprint 8: Notifications, User Management, Admin Management & Audit Log

**Goal:** Wire up the final feature set — real-time notifications, admin user/admin management, and the live audit log.
**Estimated effort:** L
**Depends on:** Sprint 1 (auth), Sprint 2 (users exist in the system)
**Status:** Not started

---

## Branch(es)
- `feature/notifications` — notification list, mark read, bell badge count
- `feature/user-management` — admin: list/suspend/reactivate students
- `feature/admin-management` — super admin: list/create/suspend/reactivate/delete/promote admins
- `feature/audit-log` — real audit log with API filters

> Four separate branches — each can be reviewed and merged independently.

---

## Features

### Notifications
**What to integrate:**
- Notification bell badge shows count of unread notifications from `GET /me/notifications?read=false`
- Notifications page loads full list from API
- Click notification → mark as read → `POST /me/notifications/:id/read`
- "Mark all as read" button → `POST /me/notifications/read-all`
- Refetch unread count after marking read

**UI changes needed:**
- Bell badge: replace hardcoded count with real unread count
- Notifications list: real titles, bodies, categories, timestamps
- Category icon based on `category` field (`enrollment_approved`, `registration_approved`, etc.)
- Unread notifications highlighted; read notifications muted
- `markedCount` from mark-all response shown in success toast

**Error states to handle:**
- `404` on single mark-read → toast "Notification not found"

---

### User Management (Admin — Student Accounts)
**What to integrate:**
- Students list page → `GET /users?role=student&limit=25`
- Search → `?q=` param
- Status filter → `?status=` param (approved, suspended, pending_approval)
- Student detail page → `GET /users/:uid`
- Suspend student → `POST /users/:uid/suspend` with optional reason
- Reactivate student → `POST /users/:uid/reactivate`

**UI changes needed:**
- Student list table with real data (name, email, status, enrollment count, joined date)
- Pagination using `nextCursor`
- Suspend button → confirm dialog with optional reason field
- Reactivate button → confirm dialog
- Student detail: real profile, real enrollment history with course titles and states
- Status badge reflects real `status` from API

**Error states to handle:**
- `409 ALREADY_SUSPENDED` → toast "Student is already suspended"
- `409 ALREADY_ACTIVE` → toast "Student is already active"
- `404` → toast "Student not found"

---

### Admin Management (Super Admin)
**What to integrate:**
- Admin list → `GET /super-admin/admins?limit=25`
- Create admin → `POST /super-admin/admins` (firstName, lastName, email, initialPassword)
- Admin detail → `GET /super-admin/admins/:uid`
- Suspend admin → `POST /super-admin/admins/:uid/suspend`
- Reactivate admin → `POST /super-admin/admins/:uid/reactivate`
- Delete admin → `DELETE /super-admin/admins/:uid`
- Promote student to admin → `POST /super-admin/users/:uid/make-admin`

**UI changes needed:**
- Admin list table with real data (currently uses mock `ADMINS_SEED`)
- `createdAt` column from real API
- Create admin form already built — wire to real endpoint
- Suspend/Reactivate already wired to mock — update to real UIDs from API
- Delete confirm dialog → `204` removes from list
- Promote to admin: input or search for student UID to promote

**Error states to handle:**
- `409 EMAIL_EXISTS` → inline on email field in create form
- `409 ALREADY_SUSPENDED` / `ALREADY_ACTIVE` → toast
- `409 INVALID_ROLE` on promote → toast "Only students can be promoted"
- `404 USER_NOT_FOUND` → toast

---

### Audit Log
**What to integrate:**
- Audit log table → `GET /audit-log?limit=20`
- Date range filter (already has dropdown) → sends `from` and `to` ISO dates
- Category filter chips → sends `category` param
- Search → sends `actorUid` or text via API params
- Pagination using `nextCursor`

**UI changes needed:**
- Replace mock `AUDIT_SEED` with real API data
- Real actor email + action + category + IP + timestamp
- Date range dropdown now uses actual ISO `from`/`to` params:
  - Last 7 days → `from = now - 7d`
  - Last 30 days → `from = now - 30d`
  - Last 90 days → `from = now - 90d`
  - All time → no `from`/`to`
- Pagination controls (currently no pagination on audit log)
- Total count in page header from `total` field

**Error states to handle:**
- `403` → toast "Insufficient permissions to view audit log"

---

## Checklist
- [ ] Notification bell badge from `GET /me/notifications?read=false`
- [ ] Notification list from API
- [ ] Mark single notification read
- [ ] Mark all notifications read
- [ ] Unread count refreshes after marking read
- [ ] Student list → `GET /users?role=student`
- [ ] Student search and status filter
- [ ] Student detail → `GET /users/:uid`
- [ ] Suspend student → `POST /users/:uid/suspend`
- [ ] Reactivate student → `POST /users/:uid/reactivate`
- [ ] Admin list → `GET /super-admin/admins` (replace mock)
- [ ] Create admin form wired to real endpoint
- [ ] Suspend admin → real endpoint with UID from API
- [ ] Reactivate admin → real endpoint
- [ ] Delete admin → `DELETE /super-admin/admins/:uid`
- [ ] Promote student to admin → `POST /super-admin/users/:uid/make-admin`
- [ ] Audit log → `GET /audit-log` replaces mock
- [ ] Date range filter sends ISO `from`/`to` params
- [ ] Category filter sends `category` param
- [ ] Audit log pagination
- [ ] Test full notification flow: admin approves enrollment → student sees notification
