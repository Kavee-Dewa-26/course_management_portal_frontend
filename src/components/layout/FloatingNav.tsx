"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TccrWordmark } from "@/components/ui/TccrWordmark";

interface Props {
  initialActive?: string;
  onSignUp: () => void;
}

// V2 labels — Home / Bible School / Cell Groups / Contact.
// Targets are section ids on the landing page that the floating nav
// smooth-scrolls to (top, modules grid, modules grid, FAQ).
const LINKS = [
  { id: "home", label: "Home", target: "top" },
  { id: "school", label: "Bible School", target: "modules" },
  { id: "cells", label: "Cell Groups", target: "modules" },
  { id: "contact", label: "Contact", target: "faq" },
] as const;

export function FloatingNav({ initialActive = "home", onSignUp }: Props) {
  const [active, setActive] = useState(initialActive);
  const router = useRouter();
  const pathname = usePathname() ?? "/";

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
        style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
      >
        <TccrWordmark />
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
