import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";

export type Role = "student" | "admin" | "super_admin";
export type UserStatus = "pending_approval" | "approved" | "rejected" | "suspended";

export interface SessionUser {
  uid: string;
  email: string;
  role: Role;
  roles: string[];
  status: UserStatus;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  avatar?: string;
}

export interface SessionState {
  user: SessionUser | null;
  role: Role | null;
  /**
   * The role the user is currently acting as. Differs from `role` when a
   * dual-role user (e.g. promoted student with `roles: ["student", "admin"]`)
   * has switched views. Used by the sidebar, layout guards, and dashboard
   * redirect logic.
   */
  activeRole: Role | null;
  token: string | null;
  authResolving: boolean;
}

const initialState: SessionState = {
  user: null,
  role: null,
  activeRole: null,
  token: null,
  authResolving: true,
};

/** Pick the highest assigned role as the default active role. */
function pickDefaultActiveRole(roles: string[] | undefined): Role {
  const set = new Set(roles ?? []);
  if (set.has("super_admin")) return "super_admin";
  if (set.has("admin")) return "admin";
  return "student";
}

/** Restore the user's last-selected active role from localStorage. */
function readSavedActiveRole(uid: string): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(`edupath.activeRole.${uid}`) as Role | null;
    if (v === "student" || v === "admin" || v === "super_admin") return v;
  } catch { /* ignore */ }
  return null;
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<SessionUser | null>) {
      if (action.payload) {
        const u = action.payload;
        state.user = {
          ...u,
          name: u.name ?? `${u.firstName} ${u.lastName}`.trim(),
        };
        state.role = u.role;
        // Compute activeRole: saved preference if valid for this user's roles,
        // otherwise the highest assigned role.
        const saved = readSavedActiveRole(u.uid);
        const defaultActive = pickDefaultActiveRole(u.roles);
        if (saved && u.roles.includes(saved)) {
          state.activeRole = saved;
        } else {
          state.activeRole = defaultActive;
        }
      } else {
        state.user = null;
        state.role = null;
        state.activeRole = null;
      }
    },
    setRole(state, action: PayloadAction<Role | null>) {
      state.role = action.payload;
    },
    setActiveRole(state, action: PayloadAction<Role>) {
      // Only switch if the user actually holds that role.
      if (!state.user) return;
      if (!state.user.roles.includes(action.payload)) return;
      state.activeRole = action.payload;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`edupath.activeRole.${state.user.uid}`, action.payload);
        } catch { /* ignore */ }
      }
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    setAuthResolving(state, action: PayloadAction<boolean>) {
      state.authResolving = action.payload;
    },
    clearSession(state) {
      state.user = null;
      state.role = null;
      state.activeRole = null;
      state.token = null;
      state.authResolving = false;
    },
  },
  extraReducers: (builder) => {
    // When redux-persist rehydrates on page reload, reset authResolving to true
    // so API hooks wait for Firebase to restore its session before fetching.
    builder.addCase(REHYDRATE, (state) => {
      state.authResolving = true;
    });
  },
});

export const { setUser, setRole, setActiveRole, setToken, setAuthResolving, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
