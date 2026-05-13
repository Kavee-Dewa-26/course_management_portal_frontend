"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import { auth } from "@/infrastructure/firebase/auth";

export type EnrollmentState = "pending" | "approved" | "rejected" | "withdrawn";

export interface Enrollment {
  id: string;
  studentUid: string;
  courseId: string;
  state: EnrollmentState;
  reason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PagedResponse {
  items: Enrollment[];
  nextCursor: string | null;
  total: number;
}

const FETCH_PAGE_SIZE = 100;
const MAX_PAGES = 20;

/**
 * Fetches the student's enrollments and exposes mutations:
 * - enroll(courseId) → POST /courses/:id/enroll
 * - withdraw(enrollmentId) → POST /enrollments/:id/withdraw
 *
 * Also exports getStatus(courseId) for the browse pages so the UI can show
 * the right enrollment state for a course (Available / Pending / Approved / Rejected).
 */
export function useEnrollments() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.session.user);

  const [items, setItems] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const collected: Enrollment[] = [];
      let cursor: string | undefined = undefined;
      let pageNo = 0;
      do {
        const params = new URLSearchParams({ limit: String(FETCH_PAGE_SIZE) });
        if (cursor) params.append("cursor", cursor);
        const data: PagedResponse = await apiRequest<PagedResponse>(`/me/enrollments?${params}`);
        collected.push(...(data.items ?? []));
        cursor = data.nextCursor ?? undefined;
        pageNo += 1;
      } while (cursor && pageNo < MAX_PAGES);
      setItems(collected);
    } catch {
      dispatch(pushToast({ tone: "warning", title: "Failed to load enrollments" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!user || !auth.currentUser) return;
    fetchAll();
  }, [user, fetchAll]);

  /** Read-only lookup used by browse pages to decide button state. */
  const byCourseId = useMemo(() => {
    const map = new Map<string, Enrollment>();
    for (const e of items) {
      const existing = map.get(e.courseId);
      // Prefer most recent active state (pending/approved over withdrawn/rejected).
      if (!existing) {
        map.set(e.courseId, e);
        continue;
      }
      const priority = (s: EnrollmentState) =>
        s === "approved" ? 4 : s === "pending" ? 3 : s === "rejected" ? 2 : 1;
      if (priority(e.state) > priority(existing.state)) {
        map.set(e.courseId, e);
      }
    }
    return map;
  }, [items]);

  const getEnrollmentForCourse = useCallback(
    (courseId: string) => byCourseId.get(courseId),
    [byCourseId],
  );

  /** "Available" / "Pending" / "Approved" / "Rejected" / "Withdrawn" view-model status */
  const getStatus = useCallback(
    (courseId: string): EnrollmentState | "available" => {
      const e = byCourseId.get(courseId);
      if (!e) return "available";
      if (e.state === "withdrawn" || e.state === "rejected") return "available";
      return e.state;
    },
    [byCourseId],
  );

  const enroll = useCallback(
    async (courseId: string): Promise<Enrollment | null> => {
      try {
        const enrollment = await apiRequest<Enrollment>(`/courses/${courseId}/enroll`, {
          method: "POST",
        });
        setItems((prev) => {
          // Replace any existing enrollment for this course with the new one.
          const without = prev.filter((e) => e.courseId !== courseId);
          return [...without, enrollment];
        });
        dispatch(pushToast({
          tone: "success",
          title: "Enrollment requested",
          message: "An admin will review your request shortly.",
        }));
        return enrollment;
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (err.code === "ENROLLMENT_PENDING") {
            dispatch(pushToast({ tone: "warning", title: "Already requested", message: "Your enrollment is awaiting approval." }));
          } else if (err.code === "ALREADY_ENROLLED") {
            dispatch(pushToast({ tone: "warning", title: "Already enrolled", message: "You're already enrolled in this course." }));
          } else if (err.code === "COOLOFF_ACTIVE") {
            dispatch(pushToast({ tone: "warning", title: "Wait before resubmitting", message: "You must wait 24 hours after a rejection." }));
          } else if (err.code === "COURSE_NOT_FOUND") {
            dispatch(pushToast({ tone: "warning", title: "Course not available", message: "This course is no longer published." }));
          } else if (err.status === 403) {
            dispatch(pushToast({ tone: "warning", title: "Account not approved", message: "Your account must be approved before enrolling." }));
          } else {
            dispatch(pushToast({ tone: "warning", title: "Enrollment failed", message: err.message }));
          }
        }
        return null;
      }
    },
    [dispatch],
  );

  const withdraw = useCallback(
    async (enrollmentId: string): Promise<boolean> => {
      try {
        const updated = await apiRequest<Enrollment>(`/enrollments/${enrollmentId}/withdraw`, {
          method: "POST",
        });
        setItems((prev) => prev.map((e) => (e.id === enrollmentId ? updated : e)));
        dispatch(pushToast({ tone: "success", title: "Enrollment withdrawn" }));
        return true;
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (err.code === "INVALID_STATE") {
            dispatch(pushToast({ tone: "warning", title: "Cannot withdraw", message: "Enrollment is not in a withdrawable state." }));
          } else if (err.status === 403) {
            dispatch(pushToast({ tone: "warning", title: "Not allowed", message: "You do not own this enrollment." }));
          } else if (err.status === 404) {
            dispatch(pushToast({ tone: "warning", title: "Enrollment not found" }));
          } else {
            dispatch(pushToast({ tone: "warning", title: "Withdraw failed", message: err.message }));
          }
        }
        return false;
      }
    },
    [dispatch],
  );

  return {
    items,
    loading,
    refresh: fetchAll,
    getStatus,
    getEnrollmentForCourse,
    enroll,
    withdraw,
  };
}
