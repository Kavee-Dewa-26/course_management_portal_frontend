"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  state: "draft" | "published" | "archived";
  semesterCount: number;
  createdBy?: string;
  createdByName?: string;
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt?: string;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  youtubeVideoId?: string;
  url?: string;
  sortOrder?: number;
  attachments?: Attachment[];
}

export interface Semester {
  id: string;
  name: string;
  sortOrder?: number;
  subjectCount?: number;
  subjects?: Subject[];
}

export interface CourseDetail extends CourseSummary {
  semesters?: Semester[];
}

interface PagedResponse {
  items: CourseSummary[];
  nextCursor: string | null;
  total: number;
}

interface UseCoursesOptions {
  /** Items per page (default 20). Public catalog uses higher, landing uses 4. */
  limit?: number;
  /** Optional state filter for admins (draft, published, archived). */
  state?: "draft" | "published" | "archived";
  /** Whether to fire request (e.g. wait for auth). Defaults true. */
  enabled?: boolean;
  /** Use authenticated request. Set false for unauthenticated public listing. */
  authenticated?: boolean;
}

/**
 * List courses with pagination + debounced search.
 * - `GET /courses?limit=...&q=...&cursor=...&state=...`
 * - Public catalog can pass `authenticated: false` to skip the Bearer token.
 */
export function useCourses({
  limit = 20,
  state,
  enabled = true,
  authenticated = true,
}: UseCoursesOptions = {}) {
  const dispatch = useAppDispatch();

  const [items, setItems] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  const fetchPage = useCallback(
    async (q: string, cur?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: String(limit) });
        if (q) params.append("q", q);
        if (cur) params.append("cursor", cur);
        if (state) params.append("state", state);
        const data = await apiRequest<PagedResponse>(`/courses?${params}`, {
          auth: authenticated,
        });
        setItems(data.items ?? []);
        setNextCursor(data.nextCursor);
        setTotal(data.total ?? 0);
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) {
          // 401 handled globally by apiRequest (signOut + redirect)
          return;
        }
        dispatch(pushToast({ tone: "warning", title: "Failed to load courses" }));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, limit, state, authenticated],
  );

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => fetchPage(search, cursor), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, cursor, fetchPage, enabled]);

  const nextPage = () => {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, cursor ?? ""]);
    setCursor(nextCursor);
  };

  const prevPage = () => {
    const stack = [...cursorStack];
    const prev = stack.pop();
    setCursorStack(stack);
    setCursor(prev || undefined);
  };

  const refresh = () => fetchPage(search, cursor);

  /** POST /courses/:id/publish */
  const publish = useCallback(
    async (id: string) => {
      try {
        await apiRequest(`/courses/${id}/publish`, { method: "POST" });
        await fetchPage(search, cursor);
        dispatch(pushToast({ tone: "success", title: "Course published" }));
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (err.code === "EMPTY_SEMESTER" || err.code === "NO_SEMESTERS") {
            dispatch(pushToast({ tone: "warning", title: "Cannot publish", message: err.message }));
          } else if (err.status === 409) {
            dispatch(pushToast({ tone: "warning", title: "Already published" }));
          } else {
            dispatch(pushToast({ tone: "warning", title: "Publish failed", message: err.message }));
          }
        }
      }
    },
    [dispatch, fetchPage, search, cursor],
  );

  /** POST /courses/:id/unpublish */
  const unpublish = useCallback(
    async (id: string) => {
      try {
        await apiRequest(`/courses/${id}/unpublish`, { method: "POST" });
        await fetchPage(search, cursor);
        dispatch(pushToast({ tone: "success", title: "Course unpublished" }));
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 409) {
          dispatch(pushToast({ tone: "warning", title: "Already a draft" }));
        } else {
          dispatch(pushToast({ tone: "warning", title: "Unpublish failed" }));
        }
      }
    },
    [dispatch, fetchPage, search, cursor],
  );

  /** POST /courses/:id/archive */
  const archive = useCallback(
    async (id: string) => {
      try {
        await apiRequest(`/courses/${id}/archive`, { method: "POST" });
        await fetchPage(search, cursor);
        dispatch(pushToast({ tone: "success", title: "Course archived" }));
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 409) {
          dispatch(pushToast({ tone: "warning", title: "Already archived" }));
        } else {
          dispatch(pushToast({ tone: "warning", title: "Archive failed" }));
        }
      }
    },
    [dispatch, fetchPage, search, cursor],
  );

  /** DELETE /courses/:id (soft delete, recoverable 30d) */
  const remove = useCallback(
    async (id: string) => {
      try {
        await apiRequest(`/courses/${id}`, { method: "DELETE" });
        await fetchPage(search, cursor);
        dispatch(pushToast({ tone: "success", title: "Course deleted" }));
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 404) {
          dispatch(pushToast({ tone: "warning", title: "Course not found" }));
        } else {
          dispatch(pushToast({ tone: "warning", title: "Delete failed" }));
        }
      }
    },
    [dispatch, fetchPage, search, cursor],
  );

  return {
    items,
    loading,
    total,
    search,
    setSearch,
    nextPage,
    prevPage,
    hasNext: !!nextCursor,
    hasPrev: cursorStack.length > 0,
    refresh,
    publish,
    unpublish,
    archive,
    remove,
  };
}

/**
 * Get a single course with its full semester/subject tree.
 * - `GET /courses/:id`
 * - 404 → returns null + redirects (caller handles)
 */
export function useCourse(courseId: string | undefined, authenticated = true) {
  const dispatch = useAppDispatch();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; status: number } | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiRequest<CourseDetail>(`/courses/${courseId}`, { auth: authenticated })
      .then((data) => {
        if (cancelled) return;
        setCourse(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiRequestError) {
          setError({ code: err.code, status: err.status });
          if (err.status === 404) {
            dispatch(pushToast({ tone: "warning", title: "Course not found" }));
          } else if (err.status === 403) {
            dispatch(pushToast({ tone: "warning", title: "Enrollment required", message: "You must be enrolled to view this course." }));
          } else if (err.status !== 401) {
            dispatch(pushToast({ tone: "warning", title: "Failed to load course" }));
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [courseId, authenticated, dispatch]);

  return { course, loading, error };
}
