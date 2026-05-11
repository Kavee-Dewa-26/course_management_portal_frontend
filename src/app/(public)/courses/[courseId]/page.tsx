"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { CourseCover } from "@/components/ui/CourseCover";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { COURSE_VIEWER_SEMESTERS, FEATURED_COURSES } from "@/lib/mock/courses";

export default function PublicCourseDetailPage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const course =
    FEATURED_COURSES.find((c) => c.id === params.courseId) ?? FEATURED_COURSES[0];

  return (
    <div className="public">
      <FloatingNav initialActive="courses" onSignUp={() => router.push("/register")} />

      <section className="section section--dark" style={{ paddingTop: 120, paddingBottom: 64 }}>
        <div
          className="container-x"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div>
            <Eyebrow dark>{course.tag}</Eyebrow>
            <h1
              style={{
                color: "#fff",
                fontSize: 48,
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: "18px 0 12px",
              }}
            >
              {course.title}
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 17,
                lineHeight: 1.5,
                maxWidth: 540,
                margin: "0 0 28px",
              }}
            >
              {course.desc}
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/login" className="btn btn--primary btn--lg">
                Sign in to enroll <Icon name="arrow-right" size={18} style={{ marginLeft: 4 }} />
              </Link>
              <Link href="/courses" className="btn btn--secondary-light btn--lg">
                Back to catalog
              </Link>
            </div>
            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 28,
                color: "rgba(255,255,255,0.8)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="clock" size={14} /> {course.time}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="layers" size={14} /> {course.lessons}
              </span>
            </div>
          </div>
          <div
            style={{
              position: "relative",
              borderRadius: 24,
              overflow: "hidden",
              aspectRatio: "4 / 5",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
            }}
          >
            <CourseCover kind={course.kind} emblem={course.emblem} />
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container-x">
          <Eyebrow>Syllabus</Eyebrow>
          <h2 className="section-title">
            What you&apos;ll <span className="accent">learn</span>.
          </h2>
          <div style={{ marginTop: 32, display: "grid", gap: 16 }}>
            {COURSE_VIEWER_SEMESTERS.map((sem) => (
              <div
                key={sem.id}
                style={{
                  background: "#fff",
                  border: "1px solid #E5E5E5",
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: "0 1px 3px 0 rgba(21,42,36,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-heading)",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#152A24",
                    }}
                  >
                    {sem.title}
                  </h3>
                  <Badge tone="archive">{sem.subjects.length} subjects</Badge>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {sem.subjects.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#FAFAFA",
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        color: "#41574A",
                      }}
                    >
                      <Icon name="play-circle" size={14} />
                      {s.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
