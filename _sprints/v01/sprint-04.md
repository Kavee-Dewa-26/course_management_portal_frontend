# Sprint 4: Student Enrollments & Admin Enrollment Queue

**Goal:** Students can enroll in courses and manage enrollments; admins can approve or reject enrollment requests via the real API.
**Estimated effort:** M
**Depends on:** Sprint 3 (course catalog must show real courses to enroll in)
**Status:** Not started

---

## Branch(es)
- `feature/student-enrollment` — enroll, list, withdraw
- `feature/admin-enrollment-queue` — admin approval queue for enrollments

---

## Features

### Student Enrollment
**What to integrate:**
- "Enroll" button on course detail → `POST /courses/:id/enroll`
- Show pending state immediately after enroll (optimistic UI)
- My courses / enrollments page loads from `GET /me/enrollments`
- Withdraw button on pending enrollments → `POST /enrollments/:id/withdraw`

**UI changes needed:**
- Enroll button: idle → loading → "Pending approval" state
- Enroll button hidden for courses already enrolled (pending or approved)
- My courses page: real enrollment cards with `state` badge (Pending / Approved / Rejected / Withdrawn)
- Withdrawn enrollments filtered out by default, toggle to show
- "Request rejected" state with rejection reason if present

**Error states to handle:**
- `409 ENROLLMENT_EXISTS` → button shows "Already enrolled"
- `422 COURSE_NOT_PUBLISHED` → toast error
- `429 RESUBMIT_TOO_EARLY` → toast with cooldown message ("Wait 24h after rejection to resubmit")
- `403` (account not approved) → toast "Your account is pending approval"

---

### Admin Enrollment Queue
**What to integrate:**
- Replace mock enrollment queue with `GET /admin/enrollments?status=pending`
- Individual approve → `POST /admin/enrollments/:id/approve`
- Individual reject with optional reason → `POST /admin/enrollments/:id/reject`
- Filter by course → send `courseId` param

**UI changes needed:**
- Queue count from `total` in API response
- Real student names, emails, course titles from API
- Reject modal with optional reason input field
- Pagination using `nextCursor`
- Course filter dropdown (load course list for filter options)
- Empty state when queue is clear

**Error states to handle:**
- `409 INVALID_STATE` → toast "Already processed"

---

## Checklist
- [ ] Enroll button → `POST /courses/:id/enroll`
- [ ] Enroll button shows correct state based on existing enrollment
- [ ] My courses page → `GET /me/enrollments`
- [ ] Withdraw → `POST /enrollments/:id/withdraw`
- [ ] Handle `409`, `422`, `429` enrollment errors inline
- [ ] Admin enrollment queue → `GET /admin/enrollments`
- [ ] Admin approve → `POST /admin/enrollments/:id/approve`
- [ ] Admin reject with reason → `POST /admin/enrollments/:id/reject`
- [ ] Pagination on enrollment queue
- [ ] Test full flow: student enrolls → admin approves → student sees approved state
- [ ] Test rejection flow → student sees rejected badge + reason
