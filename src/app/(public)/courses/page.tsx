"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Button } from "@/components/ui/Button";
import { CourseCover } from "@/components/ui/CourseCover";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { useCourses } from "@/application/hooks/useCourses";

export default function PublicCoursesPage() {
  const router = useRouter();
  const Q = useCourses({ limit: 12, authenticated: false });

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
              value={Q.search}
              onChange={(e) => Q.setSearch(e.target.value)}
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
            {Q.search && (
              <button onClick={() => Q.setSearch("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 0, lineHeight: 1 }}>
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="section section--white" style={{ paddingTop: 40 }}>
        <div className="container-x">
          {/* Results count */}
          <div style={{ marginBottom: 20, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body-green)" }}>
            {Q.loading
              ? "Loading…"
              : Q.total === 0
                ? "No courses match your search."
                : `${Q.total} course${Q.total !== 1 ? "s" : ""} available`}
          </div>

          {Q.loading && Q.items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-body-green)" }}>
              <Icon name="loader" size={24} style={{ opacity: 0.4 }} />
              <p style={{ marginTop: 12, fontFamily: "var(--font-body)", fontSize: 14 }}>Loading courses…</p>
            </div>
          ) : Q.items.length > 0 ? (
            <>
              <div className="course-grid" style={{ marginTop: 0 }}>
                {Q.items.map((c) => (
                  <article
                    key={c.id}
                    className="course-card"
                    onClick={() => router.push(`/courses/${c.id}`)}
                  >
                    <CourseCover imageUrl={c.coverImageUrl} alt={c.title} />
                    <div className="body">
                      <div className="meta">
                        <span><Icon name="layers" size={12} />{c.semesterCount} {c.semesterCount === 1 ? "module" : "modules"}</span>
                        {c.createdByName && <span><Icon name="user" size={12} />{c.createdByName}</span>}
                      </div>
                      <h3>{c.title}</h3>
                      <p>{c.description}</p>
                      <ArrowLink>Learn More</ArrowLink>
                    </div>
                  </article>
                ))}
              </div>

              {(Q.hasNext || Q.hasPrev) && (
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 32 }}>
                  <Button variant="secondary" icon="chevron-left" disabled={!Q.hasPrev} onClick={Q.prevPage}>
                    Previous
                  </Button>
                  <Button variant="secondary" iconAfter="chevron-right" disabled={!Q.hasNext} onClick={Q.nextPage}>
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-body-green)", fontFamily: "var(--font-body)" }}>
              <Icon name="search" size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No courses found</p>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>Try a different search term.</p>
              {Q.search && (
                <button
                  onClick={() => Q.setSearch("")}
                  style={{ marginTop: 16, background: "none", border: "1px solid var(--color-stroke)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}
                >
                  Clear search
                </button>
              )}
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
