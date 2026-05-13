import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
  // Legacy display fields for components that still expect them.
  // Computed from firstName + lastName when setUser is called.
  name?: string;
  avatar?: string;
}

interface SessionState {
  user: SessionUser | null;
  role: Role | null;
  token: string | null;
  /** True while initial Firebase auth state is being resolved on mount. */
  authResolving: boolean;
}

const initialState: SessionState = {
  user: null,
  role: null,
  token: null,
  authResolving: true,
};

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
      } else {
        state.user = null;
        state.role = null;
      }
    },
    setRole(state, action: PayloadAction<Role | null>) {
      state.role = action.payload;
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
      state.token = null;
      state.authResolving = false;
    },
  },
});

export const { setUser, setRole, setToken, setAuthResolving, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
