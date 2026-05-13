"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "@/infrastructure/firebase/auth";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import {
  setUser,
  setToken,
  setAuthResolving,
  clearSession,
  type SessionUser,
} from "@/application/slices/sessionSlice";

/**
 * Listens to Firebase auth state. On every token change:
 *  - Updates Redux token (token auto-refreshes ~5min before 1h expiry)
 *  - Fetches /me to populate the user profile on cold-start
 *  - Clears session on sign-out
 */
export function FirebaseAuthListener({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      if (!fbUser) {
        dispatch(clearSession());
        dispatch(setAuthResolving(false));
        return;
      }

      try {
        const token = await fbUser.getIdToken();
        dispatch(setToken(token));

        // Fetch profile on every token change. Cheap, and keeps user data fresh
        // in case role/status was updated server-side (e.g. promotion to admin).
        const me = await apiRequest<SessionUser>("/me");

        // Block non-approved users from accessing the app silently.
        if (me.status !== "approved") {
          await auth.signOut();
          dispatch(clearSession());
          return;
        }

        dispatch(setUser(me));
      } catch (err) {
        // If /me fails (e.g. account suspended, network), sign out cleanly.
        if (err instanceof ApiRequestError && (err.status === 401 || err.status === 403)) {
          await auth.signOut();
          dispatch(clearSession());
        }
      } finally {
        dispatch(setAuthResolving(false));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}
