"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

interface Props {
  user: { name: string; avatar?: string };
  role?: string;
  onLogout: () => void;
}

export function UserMenu({ user, role, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
        }}
        aria-label="Account menu"
      >
        <Avatar src={user.avatar} size="sm" name={user.name} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 220,
            background: "#fff",
            borderRadius: 12,
            boxShadow:
              "0 10px 28px -8px rgba(21,42,36,0.18), 0 4px 8px -4px rgba(21,42,36,0.08)",
            border: "1px solid rgba(21,42,36,0.08)",
            padding: 6,
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid rgba(21,42,36,0.08)",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 14,
                color: "#152A24",
              }}
            >
              {user.name}
            </div>
            {role && (
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "#41574A",
                  marginTop: 2,
                }}
              >
                {role}
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: "transparent",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "#152A24",
            }}
          >
            <Icon name="log-out" size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
