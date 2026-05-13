"use client";

import { useState, useCallback } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import { pushToast } from "@/application/slices/uiSlice";
import { setUser, type SessionUser } from "@/application/slices/sessionSlice";
import { apiRequest, ApiRequestError } from "@/infrastructure/api/request";

interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string | null;
}

export function useProfile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.session.user);

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordError, setPasswordError] = useState("");

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  const clearAllErrors = () => setFieldErrors({});

  /** Update profile via PATCH /me — only send changed fields. */
  const updateProfile = useCallback(
    async (changes: ProfileUpdate): Promise<boolean> => {
      if (Object.keys(changes).length === 0) return true;
      setSaving(true);
      clearAllErrors();
      try {
        const updated = await apiRequest<SessionUser>("/me", {
          method: "PATCH",
          body: changes,
        });
        dispatch(setUser(updated));
        dispatch(pushToast({ tone: "success", title: "Profile saved" }));
        return true;
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (err.status === 400 && err.details) {
            // Map field errors from { field: ["message"] }
            Object.entries(err.details).forEach(([k, v]) => {
              setFieldError(k, Array.isArray(v) ? v[0] : String(v));
            });
            dispatch(pushToast({ tone: "warning", title: "Please fix the errors below" }));
          } else {
            dispatch(pushToast({ tone: "warning", title: "Couldn't save profile", message: err.message }));
          }
        } else {
          dispatch(pushToast({ tone: "warning", title: "Couldn't save profile" }));
        }
        return false;
      } finally {
        setSaving(false);
      }
    },
    [dispatch],
  );

  /** Change password via POST /me/change-password. */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      setSavingPassword(true);
      setPasswordError("");
      try {
        await apiRequest("/me/change-password", {
          method: "POST",
          body: { currentPassword, newPassword },
        });
        dispatch(pushToast({
          tone: "success",
          title: "Password updated",
          message: "You'll stay signed in on this device.",
        }));
        return true;
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (err.status === 400 && err.details) {
            // Show first field error (currentPassword or newPassword)
            const firstField = Object.keys(err.details)[0];
            const msg = err.details[firstField];
            setPasswordError(Array.isArray(msg) ? msg[0] : String(msg));
          } else if (err.status === 401) {
            setPasswordError("Current password is incorrect.");
          } else {
            setPasswordError(err.message || "Couldn't update password.");
          }
        } else {
          setPasswordError("Couldn't update password.");
        }
        return false;
      } finally {
        setSavingPassword(false);
      }
    },
    [dispatch],
  );

  return {
    user,
    saving,
    savingPassword,
    fieldErrors,
    passwordError,
    setPasswordError,
    clearFieldError,
    updateProfile,
    changePassword,
  };
}
