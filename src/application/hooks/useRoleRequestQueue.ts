"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";

export interface RoleRequestQueueItem {
  id: string;
  requesterUid: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterRoles?: string[];   // current roles from GET /users/:uid
  requesterPhone?: string;     // if backend provides it
  requestedRole: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt: string | null;
  decisionByName: string | null;
  decisionNote: string | null;
}

interface QueueState {
  items: RoleRequestQueueItem[];
  total: number;
  nextCursor: string | null;
  loading: boolean;
  status: "pending" | "approved" | "rejected";
  search: string;
}

/**
 * Admin-side hook for the role-requests approval queue.
 * Replaces the V1 useRegistrationQueue (which called /admin/registrations).
 */
export function useRoleRequestQueue() {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<QueueState>({
    items: [],
    total: 0,
    nextCursor: null,
    loading: true,
    status: "pending",
    search: "",
  });
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchQueue = useCallback(
    async (overrides?: Partial<Pick<QueueState, "status" | "search">>) => {
      // Read status/search from functional update to avoid stale closure.
      setState((s) => {
        const next = { ...s, loading: true, ...(overrides ?? {}) };
        return next;
      });
      // Get current values for the API call.
      const { status, search } = overrides
        ? { status: overrides.status ?? state.status, search: overrides.search ?? state.search }
        : { status: state.status, search: state.search };
      try {
        const params = new URLSearchParams({ status, limit: "20" });
        if (search) params.set("search", search);
        const res = await apiRequest<{
          items: RoleRequestQueueItem[];
          total: number;
          nextCursor: string | null;
        }>(`/role-requests?${params}`);

        // Enrich each request with the requester's current roles + phone
        // via GET /users/:uid. Failures are silently ignored per item.
        const enriched = await Promise.all(
          (res.items ?? []).map(async (item) => {
            try {
              const user = await apiRequest<{
                roles?: string[];
                phone?: string;
              }>(`/users/${item.requesterUid}`);
              return {
                ...item,
                requesterRoles: user.roles ?? [],
                requesterPhone: user.phone ?? undefined,
              };
            } catch {
              return item;
            }
          }),
        );

        setState((s) => ({
          ...s,
          items: enriched,
          total: res.total ?? 0,
          nextCursor: res.nextCursor ?? null,
          loading: false,
          status,
          search,
        }));
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [state],
  );

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = useCallback(
    async (id: string, note = "") => {
      setProcessingId(id);
      try {
        await apiRequest(`/role-requests/${id}/approve`, {
          method: "POST",
          body: { note },
        });
        dispatch(pushToast({ tone: "success", title: "Role request approved" }));
        fetchQueue();
      } catch (err) {
        const msg = err instanceof ApiRequestError ? err.message : "Approval failed.";
        dispatch(pushToast({ tone: "warning", title: "Couldn't approve", message: msg }));
      } finally {
        setProcessingId(null);
      }
    },
    [dispatch, fetchQueue],
  );

  const reject = useCallback(
    async (id: string, note: string) => {
      setProcessingId(id);
      try {
        await apiRequest(`/role-requests/${id}/reject`, {
          method: "POST",
          body: { note },
        });
        dispatch(pushToast({ tone: "success", title: "Role request rejected" }));
        fetchQueue();
      } catch (err) {
        const msg = err instanceof ApiRequestError ? err.message : "Rejection failed.";
        dispatch(pushToast({ tone: "warning", title: "Couldn't reject", message: msg }));
      } finally {
        setProcessingId(null);
      }
    },
    [dispatch, fetchQueue],
  );

  return {
    ...state,
    processingId,
    approve,
    reject,
    setStatus: (status: QueueState["status"]) => fetchQueue({ status }),
    setSearch: (search: string) => fetchQueue({ search }),
    refetch: () => fetchQueue(),
  };
}
