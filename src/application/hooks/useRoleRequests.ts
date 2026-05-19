"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "./useAppSelector";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";

export interface RoleRequest {
  id: string;
  requestedRole: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt: string | null;
  decisionByName: string | null;
  decisionNote: string | null;
}

interface UseRoleRequestsResult {
  items: RoleRequest[];
  loading: boolean;
  /** The most recent student role request (any status). */
  latestStudent: RoleRequest | null;
  hasPendingStudent: boolean;
  refetch: () => void;
}

/**
 * Member-side hook — fetches GET /role-requests/mine.
 * Used on /apply/student, /apply/student/pending, /my-requests, and /home.
 */
export function useRoleRequests(): UseRoleRequestsResult {
  const user = useAppSelector((s) => s.session.user);
  const [items, setItems] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ items: RoleRequest[]; total: number }>(
        "/role-requests/mine",
      );
      setItems(res.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const studentRequests = items.filter((r) => r.requestedRole === "student");
  const latestStudent = studentRequests.length
    ? studentRequests.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]
    : null;

  return {
    items,
    loading,
    latestStudent,
    hasPendingStudent: latestStudent?.status === "pending",
    refetch: fetchRequests,
  };
}

/**
 * Submit a new role request (POST /role-requests).
 * Returns the created request or throws ApiRequestError.
 */
export async function submitRoleRequest(
  requestedRole: "student",
): Promise<RoleRequest> {
  return apiRequest<RoleRequest>("/role-requests", {
    method: "POST",
    body: { requestedRole },
  });
}
