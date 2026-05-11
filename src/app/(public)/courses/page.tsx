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
import { FEATURED_COURSES } from "@/lib/mock/courses";

export default function PublicCoursesPage() {
  const router = useRouter();
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
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 17,
              maxWidth: 640,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Multi-module programmes in software, machine learning and analytics. Sign in to
            request enrollment in any track.
          </p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container-x">
          <div className="course-grid" style={{ marginTop: 0 }}>
            {FEATURED_COURSES.map((c) => (
              <article
                key={c.id}
                className="course-card"
                onClick={() => router.push(`/courses/${c.id}`)}
              >
                <CourseCover kind={c.kind} emblem={c.emblem} tag={c.tag} />
                <div className="body">
                  <div className="meta">
                    <span>
                      <Icon name="clock" size={12} />
                      {c.time}
                    </span>
                    <span>
                      <Icon name="layers" size={12} />
                      {c.lessons}
                    </span>
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <ArrowLink>Learn More</ArrowLink>
                </div>
              </article>
            ))}
          </div>
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
