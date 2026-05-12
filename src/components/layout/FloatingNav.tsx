"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

interface Props {
  initialActive?: string;
  onSignUp: () => void;
}

const LINKS = [
  { id: "home", label: "Home", target: "top" },
  { id: "about", label: "About", target: "why" },
  { id: "courses", label: "Courses", target: "courses" },
  { id: "contact", label: "Contact", target: "faq" },
] as const;

export function FloatingNav({ initialActive = "home", onSignUp }: Props) {
  const [active, setActive] = useState(initialActive);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  useEffect(() => setMounted(true), []);
  const logoVariant = mounted && resolvedTheme === "dark" ? "reversed" : "default";

  const handleNav = (id: string, target: string) => {
    setActive(id);

    if (id === "home") {
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/");
      }
      return;
    }

    // Scroll to section on home page (About, Courses, Contact)
    if (pathname === "/") {
      const el = document.getElementById(target);
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    } else {
      router.push(`/#${target}`);
    }
  };

  return (
    <nav className="floating-nav">
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          handleNav("home", "top");
        }}
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <Logo variant={logoVariant} height={26} />
      </a>
      <div className="nav-links">
        {LINKS.map((l) => (
          <a
            key={l.id}
            href="#"
            className={active === l.id ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              handleNav(l.id, l.target);
            }}
          >
            {l.label}
          </a>
        ))}
      </div>
      <Button size="sm" onClick={onSignUp}>
        Sign Up
      </Button>
    </nav>
  );
}
