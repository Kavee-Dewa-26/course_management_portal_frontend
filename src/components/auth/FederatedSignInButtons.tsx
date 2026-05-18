"use client";

import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { AppleIcon } from "./AppleIcon";

interface Props {
  /** Override the toast / handler text. */
  context?: "signin" | "signup";
  disabled?: boolean;
}

/**
 * UI-only federated sign-in buttons (Google + Apple) with an "OR CONTINUE WITH EMAIL"
 * divider. Real Firebase popup wiring is deferred — click handlers stub a toast.
 */
export function FederatedSignInButtons({ context = "signin", disabled }: Props) {
  const dispatch = useAppDispatch();

  const onClick = (provider: "Google" | "Apple") => {
    dispatch(
      pushToast({
        tone: "warning",
        title: `${provider} sign-${context === "signin" ? "in" : "up"} coming soon`,
        message: "Federated sign-in is being wired up. Use email/password for now.",
      }),
    );
  };

  return (
    <>
      <div className="fed-row">
        <button
          type="button"
          className="fed-btn"
          disabled={disabled}
          onClick={() => onClick("Google")}
          aria-label="Continue with Google"
        >
          <GoogleIcon size={18} />
          Google
        </button>
        <button
          type="button"
          className="fed-btn"
          disabled={disabled}
          onClick={() => onClick("Apple")}
          aria-label="Continue with Apple"
        >
          <AppleIcon size={18} />
          Apple
        </button>
      </div>
      <div className="fed-divider">OR CONTINUE WITH EMAIL</div>
    </>
  );
}
