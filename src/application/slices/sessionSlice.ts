import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";

export type Role =
  | "member"        // V2: every authenticated user holds this implicitly
  | "student"
  | "leader"        // V2: cell-group leader
  | "g12"           // V2: senior leader overseeing leaders
  | "admin"
  | "super_admin";
export type UserStatus = "pending_approval" | "approved" | "rejected" | "suspended";

/** Where each role lands after login. Picked by the user's activeRole. */
export const DASHBOARD_BY_ROLE: Record<Role, string> = {
  member: "/home",
  leader: "/cells",
  g12: "/cells",
  student: "/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/super-admin/dashboard",
};

const ROLE_LITERALS: ReadonlySet<Role> = new Set<Role>([
  "member",
  "student",
  "leader",
  "g12",
  "admin",
  "super_admin",
]);

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && ROLE_LITERALS.has(v as Role);
}

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

/** Pick the highest assigned role as the default active role.
 *  Priority: super_admin > admin > g12 > leader > student > member. */
function pickDefaultActiveRole(roles: string[] | undefined): Role {
  const set = new Set(roles ?? []);
  if (set.has("super_admin")) return "super_admin";
  if (set.has("admin")) return "admin";
  if (set.has("g12")) return "g12";
  if (set.has("leader")) return "leader";
  if (set.has("student")) return "student";
  return "member";
}

/** Restore the user's last-selected active role from localStorage. */
function readSavedActiveRole(uid: string): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(`edupath.activeRole.${uid}`);
    return isRole(v) ? v : null;
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
