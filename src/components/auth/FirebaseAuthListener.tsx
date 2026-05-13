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
 * Listens to Firebase auth state changes.
 *
 * On page reload, Firebase fires onIdTokenChanged(null) ONCE before restoring
 * the session from IndexedDB. We skip that initial null event so API hooks
 * don't fire unauthenticated requests. A 3-second safety timeout ensures we
 * never get stuck in authResolving=true if the user is genuinely logged out.
 */
export function FirebaseAuthListener({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let firstEvent = true;
    let safetyTimer: ReturnType<typeof setTimeout>;

    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      if (!fbUser) {
        if (firstEvent) {
          // Skip the initial null — Firebase is still restoring from IndexedDB.
          // Set a safety timeout so we don't stay stuck if the user is truly logged out.
          firstEvent = false;
          safetyTimer = setTimeout(() => {
            dispatch(clearSession());
            dispatch(setAuthResolving(false));
          }, 3000);
          return;
        }
        // Actual sign-out event — clear immediately.
        clearTimeout(safetyTimer);
        dispatch(clearSession());
        dispatch(setAuthResolving(false));
        return;
      }

      clearTimeout(safetyTimer);
      firstEvent = false;

      try {
        const token = await fbUser.getIdToken();
        dispatch(setToken(token));

        const me = await apiRequest<SessionUser>("/me");

        if (me.status !== "approved") {
          await auth.signOut();
          dispatch(clearSession());
          return;
        }

        dispatch(setUser(me));
      } catch (err) {
        if (err instanceof ApiRequestError && (err.status === 401 || err.status === 403)) {
          await auth.signOut();
          dispatch(clearSession());
        }
      } finally {
        dispatch(setAuthResolving(false));
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}
