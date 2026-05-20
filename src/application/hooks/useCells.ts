"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";

export type CellType  = "g12" | "care" | "children" | "outreach";
export type CellState = "active" | "archived";

export interface Cell {
  id: string;
  name: string;
  type: CellType;
  area: string;
  leaderUid: string;
  leaderName?: string;
  g12LeaderUid?: string;
  g12LeaderName?: string;
  memberCount: number;
  reportCount: number;
  state: CellState;
  createdAt: string;
  updatedAt: string;
}

export interface CellDetail extends Cell {
  members?: { uid: string; displayName: string }[];
}

function parseList(res: unknown): Cell[] {
  if (Array.isArray(res)) return res as Cell[];
  const r = res as { items?: Cell[] };
  return r.items ?? [];
}

/**
 * Fetch the paginated cell list scoped by the caller's role.
 * Server auto-applies scope: Member/Student → active cells;
 * Leader → cells they lead; G12 → network; Admin → all.
 */
export function useCells(params?: { search?: string; type?: CellType | "all"; state?: CellState }) {
  const dispatch = useAppDispatch();
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCells = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "100" });
      if (params?.state)          qs.set("state", params.state);
      if (params?.type && params.type !== "all") qs.set("type", params.type);
      if (params?.search?.trim()) qs.set("search", params.search.trim());
      const res = await apiRequest<unknown>(`/cells?${qs}`);
      setCells(parseList(res));
    } catch {
      setCells([]);
    } finally {
      setLoading(false);
    }
  }, [params?.search, params?.type, params?.state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCells(); }, [fetchCells]);

  return { cells, loading, refetch: fetchCells };
}

/**
 * Fetch cells the signed-in user belongs to (GET /cells/mine).
 */
export function useMyCells() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyCells = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<unknown>("/cells/mine");
      setCells(parseList(res));
    } catch {
      setCells([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyCells(); }, [fetchMyCells]);

  return { cells, loading, refetch: fetchMyCells };
}

/**
 * Cell mutations — create, update, archive.
 */
export function useCellMutations() {
  const dispatch = useAppDispatch();

  const createCell = async (body: {
    name: string; type: CellType; area: string; g12LeaderUid?: string;
  }): Promise<Cell | null> => {
    try {
      const created = await apiRequest<Cell>("/cells", { method: "POST", body });
      dispatch(pushToast({ tone: "success", title: "Cell created" }));
      return created;
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Failed to create cell.";
      dispatch(pushToast({ tone: "warning", title: "Couldn't create cell", message: msg }));
      return null;
    }
  };

  const updateCell = async (cellId: string, body: Partial<{ name: string; type: CellType; area: string }>): Promise<Cell | null> => {
    try {
      const updated = await apiRequest<Cell>(`/cells/${cellId}`, { method: "PATCH", body });
      dispatch(pushToast({ tone: "success", title: "Cell updated" }));
      return updated;
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Failed to update cell.";
      dispatch(pushToast({ tone: "warning", title: "Couldn't update cell", message: msg }));
      return null;
    }
  };

  const archiveCell = async (cellId: string): Promise<boolean> => {
    try {
      await apiRequest(`/cells/${cellId}/archive`, { method: "POST" });
      dispatch(pushToast({ tone: "success", title: "Cell archived" }));
      return true;
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Failed to archive cell.";
      dispatch(pushToast({ tone: "warning", title: "Couldn't archive cell", message: msg }));
      return false;
    }
  };

  return { createCell, updateCell, archiveCell };
}
