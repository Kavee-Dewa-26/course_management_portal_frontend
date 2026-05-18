"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type LanguageCode = "EN" | "SI" | "TA";

const LANGS: { id: LanguageCode; label: string; native: string }[] = [
  { id: "EN", label: "English",  native: "EN" },
  { id: "SI", label: "සිංහල",   native: "සි" },
  { id: "TA", label: "தமிழ்",  native: "த" },
];

interface Props {
  current?: LanguageCode;
  onChange?: (code: LanguageCode) => void;
  dark?: boolean;
}

/**
 * UI-only language switcher. Renders a globe-icon dropdown of EN / සිංහල / தமிழ்.
 * Does not actually translate anything yet — real i18n is deferred to a later phase.
 */
export function LanguageSwitcher({ current = "EN", onChange, dark }: Props) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState<LanguageCode>(current);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setCur(current), [current]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const active = LANGS.find((l) => l.id === cur) ?? LANGS[0];

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose language"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 9999,
          border: `1px solid ${dark ? "rgba(255,255,255,0.16)" : "var(--color-stroke)"}`,
          background: dark ? "rgba(255,255,255,0.06)" : "#fff",
          color: dark ? "#fff" : "var(--color-primary)",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        <Icon name="globe" size={14} />
        {active.label}
        <Icon name="chevron-down" size={12} />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 20,
            minWidth: 160,
            background: "#fff",
            border: "1px solid var(--color-stroke)",
            borderRadius: 12,
            boxShadow: "0 8px 24px -8px rgba(21,42,36,0.18)",
            padding: 6,
          }}
        >
          {LANGS.map((l) => (
            <button
              type="button"
              role="menuitem"
              key={l.id}
              onClick={() => {
                setCur(l.id);
                setOpen(false);
                onChange?.(l.id);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 8,
                border: 0,
                background: "transparent",
                color: "var(--color-primary)",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 13,
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--color-stroke-2)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span>{l.label}</span>
              {cur === l.id && <Icon name="check" size={14} style={{ color: "var(--color-success-deep)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
