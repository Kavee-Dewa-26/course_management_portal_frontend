"use client";

import { useEffect, useMemo } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { useAppSelector } from "@/application/hooks/useAppSelector";
import { hydrateLocale, type Locale } from "@/application/slices/localeSlice";
import enMessages from "@/messages/en.json";
import siMessages from "@/messages/si.json";
import taMessages from "@/messages/ta.json";

/**
 * Bridges Redux's current locale into next-intl's provider.
 *
 * Why this lives in its own component: next-intl's <NextIntlClientProvider>
 * needs to be re-mounted (or at least re-rendered with new `messages` and
 * `locale` props) whenever the active locale changes. By reading the locale
 * from Redux here, every dispatch of `setLocale` ripples through the whole
 * subtree automatically.
 *
 * Message resolution merges English defaults under each locale so a missing
 * key in si.json or ta.json falls back to English instead of rendering as
 * the raw key path.
 */
type MessagesShape = typeof enMessages;

const CATALOGUES: Record<Locale, Partial<MessagesShape> & Record<string, unknown>> = {
  en: enMessages,
  si: siMessages as Partial<MessagesShape>,
  ta: taMessages as Partial<MessagesShape>,
};

/** Deep-merge English defaults with a target locale so missing keys fall back. */
function mergeWithFallback(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (key.startsWith("_")) continue; // skip _README and similar private keys
    const baseVal = base[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      out[key] = mergeWithFallback(
        baseVal as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else if (typeof value === "string" && value.length === 0) {
      // Empty string in a non-English catalogue: keep the English default.
      continue;
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function IntlBridge({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const locale = useAppSelector((s) => s.locale.current);

  // Hydrate from localStorage on first client render. SSR initial value is
  // "en"; if the user previously picked Sinhala / Tamil the swap happens
  // within the first microtask after mount.
  useEffect(() => {
    dispatch(hydrateLocale());
  }, [dispatch]);

  const messages = useMemo(() => {
    if (locale === "en") return enMessages as unknown as Record<string, unknown>;
    return mergeWithFallback(
      enMessages as unknown as Record<string, unknown>,
      CATALOGUES[locale] as unknown as Record<string, unknown>,
    );
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Colombo">
      {children}
    </NextIntlClientProvider>
  );
}
