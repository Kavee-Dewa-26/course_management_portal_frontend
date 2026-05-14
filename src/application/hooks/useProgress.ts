"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";

/* ─── Types ───────────────────────────────────────────────────────────── */

export interface CourseProgress {
  courseId: string;
  completionPercent: number;
  completedCount: number;
  totalSubjects: number;
  lastAccessedSubjectId: string | null;
  lastAccessedAt?: string | null;
  completedSubjectIds: string[];
}

export interface SubjectProgress {
  subjectId: string;
  courseId: string;
  completedAt: string | null;
  lastAccessedAt: string | null;
}

export interface StudentProgressRow {
  studentUid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  completionPercent: number;
  completedCount: number;
  totalSubjects: number;
  lastAccessedAt: string | null;
}

interface AdminProgressResponse {
  items: StudentProgressRow[];
  nextCursor: string | null;
  total: number;
}

/* ─── Student progress hook ───────────────────────────────────────────── */

/**
 * Fetches and tracks course progress for the current student.
 * Use `markComplete(subjectId, semesterId)` to mark a subject completed.
 * Use `trackAccess(subjectId, semesterId)` to record the last accessed subject.
 */
export function useCourseProgress(courseId: string | undefined) {
  const dispatch = useAppDispatch();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiRequestError | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await apiRequest<CourseProgress>(`/me/progress/courses/${courseId}`);
      setProgress(data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err);
        // Silent for 404 (no progress yet) and 403 (no enrollment) — just show empty UI.
        if (err.status !== 404 && err.status !== 403) {
          dispatch(pushToast({ tone: "warning", title: "Failed to load progress" }));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, dispatch]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const markComplete = useCallback(
    async (subjectId: string, semesterId?: string) => {
      if (!courseId) return;
      try {
        await apiRequest(`/progress/subjects/${subjectId}/complete`, {
          method: "POST",
          body: { courseId, semesterId },
        });
        // Refetch course progress so % and completedSubjectIds update.
        await fetchProgress();
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (err.status === 403) {
            dispatch(pushToast({ tone: "warning", title: "Enrollment required", message: "You need an approved enrollment to track progress." }));
          } else {
            dispatch(pushToast({ tone: "warning", title: "Could not mark complete" }));
          }
        }
      }
    },
    [courseId, dispatch, fetchProgress],
  );

  const trackAccess = useCallback(
    async (subjectId: string, semesterId?: string) => {
      if (!courseId) return;
      try {
        await apiRequest(`/progress/subjects/${subjectId}/access`, {
          method: "POST",
          body: { courseId, semesterId },
        });
      } catch {
        // Silent — access tracking is a background hint, not a critical action.
      }
    },
    [courseId],
  );

  const completedSet = new Set(progress?.completedSubjectIds ?? []);

  return {
    progress,
    loading,
    error,
    completedSet,
    markComplete,
    trackAccess,
    refresh: fetchProgress,
  };
}

/* ─── Admin progress hook ─────────────────────────────────────────────── */

/**
 * Admin view of all students' progress for a single course.
 * Used in /admin/courses/:id/view to show enrolled-student progress table.
 */
export function useAdminCourseProgress(courseId: string | undefined) {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<StudentProgressRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      // Fetch all pages — admin progress lists are usually small per course.
      const collected: StudentProgressRow[] = [];
      let cursor: string | undefined;
      let pageNo = 0;
      const MAX_PAGES = 20;
      do {
        const params = new URLSearchParams({ limit: "100" });
        if (cursor) params.append("cursor", cursor);
        const data: AdminProgressResponse = await apiRequest<AdminProgressResponse>(
          `/admin/progress/courses/${courseId}?${params}`,
        );
        collected.push(...(data.items ?? []));
        setTotal(data.total ?? collected.length);
        cursor = data.nextCursor ?? undefined;
        pageNo += 1;
      } while (cursor && pageNo < MAX_PAGES);
      setItems(collected);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status !== 404 && err.status !== 403) {
        dispatch(pushToast({ tone: "warning", title: "Failed to load student progress" }));
      }
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [courseId, dispatch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { items, total, loading, refresh: fetchAll };
}
