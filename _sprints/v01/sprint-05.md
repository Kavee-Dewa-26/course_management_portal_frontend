# Sprint 5: Course Management (Admin)

**Goal:** Admins can create, edit, publish, unpublish, archive and delete courses via real API endpoints.
**Estimated effort:** M
**Depends on:** Sprint 1 (admin must be authenticated)
**Status:** Not started

---

## Branch(es)
- `feature/admin-course-management` — full admin course CRUD and lifecycle

---

## Features

### Admin Course List
**What to integrate:**
- Replace `ADMIN_COURSES_SEED` mock with `GET /courses` (admin sees all states)
- Search bar → `?q=` param
- State filter (draft / published / archived) → `?state=` param

**UI changes needed:**
- Course list table shows real data
- State badge reflects actual course state (draft / published / archived)
- Real `updatedAt` timestamps
- Real student enrollment counts (from API response)
- Pagination with `nextCursor`

---

### Create Course
**What to integrate:**
- "New course" button → form → `POST /courses`
- After creation redirect to course editor
- Course starts as `draft`

**UI changes needed:**
- Create course form: title (required), description (required), cover image URL (optional)
- Validate title uniqueness error from API
- Success → redirect to `/admin/courses/:id`

**Error states to handle:**
- `409 COURSE_TITLE_EXISTS` → inline error on title field
- `400 VALIDATION_ERROR` → inline errors per field

---

### Edit Course Metadata
**What to integrate:**
- Course editor metadata tab → `PATCH /courses/:id`
- Only changed fields sent

**UI changes needed:**
- Edit form pre-filled with current course data
- Save button disabled when no changes
- Success toast on save

**Error states to handle:**
- `404` → redirect to course list with toast

---

### Course Lifecycle Actions (Publish / Unpublish / Archive)
**What to integrate:**
- Publish button → `POST /courses/:id/publish`
- Unpublish button → `POST /courses/:id/unpublish`
- Archive button → `POST /courses/:id/archive`
- Buttons shown conditionally based on current `state`

**UI changes needed:**
- Toolbar shows correct actions based on course state:
  - `draft` → "Publish" button active
  - `published` → "Unpublish" + "Archive" buttons
  - `archived` → "Unpublish" only
- Confirm dialog before archive / unpublish
- State badge updates after action

**Error states to handle:**
- `422 NO_SEMESTERS` → toast "Add at least one semester before publishing"
- `422 EMPTY_SEMESTER` → toast "Every semester needs at least one subject"
- `409 INVALID_STATE` → toast with server message

---

### Delete Course
**What to integrate:**
- Delete action in course row menu → confirm dialog → `DELETE /courses/:id`
- Soft delete — course removed from list after deletion

**UI changes needed:**
- Confirm dialog: "This cannot be undone. Enrolled students retain read-only access for 30 days."
- Course removed from list after `204` response

**Error states to handle:**
- `404` → toast "Course not found"

---

## Checklist
- [ ] Admin course list from `GET /courses` with state filter
- [ ] Pagination on course list
- [ ] Create course form → `POST /courses`
- [ ] Edit course metadata → `PATCH /courses/:id`
- [ ] Publish action → `POST /courses/:id/publish`
- [ ] Unpublish action → `POST /courses/:id/unpublish`
- [ ] Archive action → `POST /courses/:id/archive`
- [ ] Delete course → `DELETE /courses/:id`
- [ ] Conditional action buttons based on course state
- [ ] Handle publish validation errors (no semesters, empty semester)
- [ ] Test create → publish → unpublish → archive → delete full lifecycle
