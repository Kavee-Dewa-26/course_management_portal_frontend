# Sprint 2: Registration Approval & User Profiles

**Goal:** Enable admins to approve/reject student registrations via real API, and allow all users to view and edit their own profile.
**Estimated effort:** M
**Depends on:** Sprint 1 (token storage must be working)
**Status:** Not started

---

## Branch(es)
- `feature/registration-approval-queue` — admin registration queue integration
- `feature/user-profile` — profile view and edit for all roles

---

## Features

### Registration Queue (Admin & Super Admin)
**What to integrate:**
- Replace mock `registrations` data with paginated API fetch
- Search/filter params sent to API (`status`, `q`)
- Individual approve action → real endpoint
- Individual reject action → real endpoint with optional reason
- Bulk approve → real endpoint, handle partial failures

**UI changes needed:**
- Queue count in page header from `total` in API response
- Pagination controls (next/prev using `nextCursor`)
- Reject modal → add optional reason text input
- Bulk approve shows partial failure toast if some IDs fail
- Real submitted-at timestamps replace mock "Today, 09:44" strings
- Empty state when all registrations are processed

**Error states to handle:**
- `409 INVALID_STATE` → toast "This registration was already processed"
- `401` → session expired, redirect to login

---

### Student Login After Approval
**What to integrate:**
- After registration is approved the student can now sign in via Firebase
- No extra code needed beyond Sprint 1 login — approval sets their account active in Firebase
- Verify the login flow works end-to-end for a newly approved student

**UI changes needed:**
- None — Sprint 1 login covers this

---

### User Profile — View & Edit (All Roles)
**What to integrate:**
- Profile page loads real data from `GET /me` on mount
- Edit form PATCHes changed fields only
- Success toast after save
- Profile photo URL field (text input for now)

**UI changes needed:**
- Replace hardcoded profile mock values with API data
- Show real `createdAt` as member since date
- Form inputs pre-filled from API response
- Save button disabled when no changes detected
- Inline field errors from `400` validation response

**Error states to handle:**
- `400 VALIDATION_ERROR` → show `details` per field
- `401` → session expired

---

### Change Password
**What to integrate:**
- Change password form calls `POST /me/change-password`
- Requires `newPassword` that meets complexity rules

**UI changes needed:**
- Change password section in profile/settings page
- Show/hide toggle on new password field (reuse `Input` `rightSlot`)
- Success toast on completion
- Inline error if password too weak

**Error states to handle:**
- `400 VALIDATION_ERROR` → inline on password field

---

### Password Reset (Login Page)
**What to integrate:**
- "Forgot password?" link → shows email input
- Calls `POST /auth/password-reset`
- Always shows success message (prevents email enumeration)

**UI changes needed:**
- Forgot password flow (modal or separate step in login form)
- Success state: "If an account exists, a reset link has been sent"

---

## Checklist
- [ ] Replace mock registration list with `GET /admin/registrations` API call
- [ ] Add pagination to registration queue (nextCursor)
- [ ] Wire approve action → `POST /admin/registrations/{id}/approve`
- [ ] Wire reject action with reason input → `POST /admin/registrations/{id}/reject`
- [ ] Wire bulk approve → `POST /admin/registrations/bulk-approve`
- [ ] Handle partial bulk-approve failures in UI
- [ ] Verify newly approved student can log in via Sprint 1 flow
- [ ] Profile page loads from `GET /me`
- [ ] Profile edit form → `PATCH /me`
- [ ] Change password form → `POST /me/change-password`
- [ ] Forgot password flow → `POST /auth/password-reset`
- [ ] Test full registration → approval → student login flow end-to-end
