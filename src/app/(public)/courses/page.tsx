"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Button } from "@/components/ui/Button";
import { CourseCover } from "@/components/ui/CourseCover";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { FEATURED_COURSES } from "@/lib/mock/courses";
import { cn } from "@/lib/cn";

const ALL_TAGS = ["All", ...Array.from(new Set(FEATURED_COURSES.map((c) => c.tag)))];

export default function PublicCoursesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");

  const filtered = useMemo(() => {
    return FEATURED_COURSES.filter((c) => {
      const matchesTag = activeTag === "All" || c.tag === activeTag;
      const q = query.toLowerCase();
      const matchesQuery =
        q === "" ||
        c.title.toLowerCase().includes(q) ||
        (c.desc ?? "").toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
  }, [query, activeTag]);

  return (
    <div className="public">
      <FloatingNav initialActive="courses" onSignUp={() => router.push("/register")} />

      <section className="section section--dark" style={{ paddingTop: 120, paddingBottom: 64 }}>
        <div className="container-x">
          <Eyebrow dark>Course Catalog</Eyebrow>
          <h1
            style={{
              color: "#fff",
              fontSize: 56,
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: "18px 0 12px",
            }}
          >
            Every <span className="accent">course</span> we offer.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, maxWidth: 640, lineHeight: 1.5, margin: "0 0 28px" }}>
            Multi-module programmes in software, machine learning and analytics. Sign in to
            request enrollment in any track.
          </p>

          {/* Search bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            padding: "10px 16px",
            maxWidth: 480,
          }}>
            <Icon name="search" size={16} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                width: "100%",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 0, lineHeight: 1 }}>
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="section section--white" style={{ paddingTop: 40 }}>
        <div className="container-x">
          {/* Tag filter chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={cn("chip", activeTag === tag && "active")}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div style={{ marginBottom: 20, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
            {filtered.length === 0
              ? "No courses match your search."
              : `${filtered.length} course${filtered.length !== 1 ? "s" : ""} found`}
          </div>

          {filtered.length > 0 ? (
            <div className="course-grid" style={{ marginTop: 0 }}>
              {filtered.map((c) => (
                <article
                  key={c.id}
                  className="course-card"
                  onClick={() => router.push(`/courses/${c.id}`)}
                >
                  <CourseCover kind={c.kind} emblem={c.emblem} tag={c.tag} />
                  <div className="body">
                    <div className="meta">
                      <span><Icon name="clock" size={12} />{c.time}</span>
                      <span><Icon name="layers" size={12} />{c.lessons}</span>
                    </div>
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                    <ArrowLink>Learn More</ArrowLink>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-body-green)", fontFamily: "var(--font-body)" }}>
              <Icon name="search" size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No courses found</p>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>Try a different search term or clear the filter.</p>
              <button
                onClick={() => { setQuery(""); setActiveTag("All"); }}
                style={{ marginTop: 16, background: "none", border: "1px solid var(--color-stroke)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}
              >
                Clear filters
              </button>
            </div>
          )}

          <div style={{ marginTop: 48, display: "flex", justifyContent: "center" }}>
            <Button size="lg" onClick={() => router.push("/register")} iconAfter="arrow-right">
              Sign up to enroll
            </Button>
          </div>
        </div>
      </section>

      <footer className="footer footer--minimal">
        <div className="footer-bottom footer-bottom--solo">
          <Logo variant="reversed" height={26} />
          <nav className="footer-nav-links">
            <Link href="/">Home</Link>
            <Link href="/#why">About</Link>
            <Link href="/courses">Courses</Link>
            <Link href="/#faq">Contact</Link>
          </nav>
          <span>© 2026 EduPath. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
