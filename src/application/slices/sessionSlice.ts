import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Role = "student" | "admin" | "super_admin";

export interface SessionUser {
  name: string;
  email?: string;
  avatar?: string;
}

interface SessionState {
  user: SessionUser | null;
  role: Role | null;
}

// Demo seed so role-aware screens have a user without API integration.
const initialState: SessionState = {
  user: { name: "Priya Mendis", email: "priya@example.com", avatar: "https://i.pravatar.cc/120?img=32" },
  role: "student",
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<SessionUser | null>) {
      state.user = action.payload;
    },
    setRole(state, action: PayloadAction<Role | null>) {
      state.role = action.payload;
    },
    clearSession(state) {
      state.user = null;
      state.role = null;
    },
  },
});

export const { setUser, setRole, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
