"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { CourseCover } from "@/components/ui/CourseCover";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { useCourses } from "@/application/hooks/useCourses";
import { avatarUrl } from "@/lib/kit";

const FEATURES = [
  { ico: "layers", title: "Structured Course Plans", body: "Multi-module roadmaps with clear topic ordering. No guesswork on what to learn next." },
  { ico: "trending-up", title: "Track Your Progress", body: "Module-level completion shown across every course so you always know where you stand." },
  { ico: "shield-check", title: "Verified Materials", body: "Lessons, code labs and project briefs curated by working software and data engineers." },
  { ico: "terminal", title: "Hands-on Labs", body: "Browser-based notebooks and sandboxes. Write real code and run real queries from lesson one." },
  { ico: "video", title: "Lecture Recordings", body: "Watch on demand. Every lesson stays available throughout your subscription." },
  { ico: "smartphone", title: "Learn on Any Device", body: "The platform works across desktop, tablet and phone with no install required." },
];

const STEPS = [
  { n: "01", title: "Create Your Account", body: "Submit your registration and wait for admin approval. Once approved you can sign in and get started.", ico: "user-plus" },
  { n: "02", title: "Pick Your Course Plan", body: "Browse module-by-module tracks built around your engineering goals.", ico: "layers" },
  { n: "03", title: "Start Learning", body: "Watch lessons, complete labs and track progress across every module.", ico: "play-circle" },
];

const FAQS = [
  { q: "Do I need a CS degree to start?", a: "No. Foundation courses assume only basic familiarity with a programming language. Our SQL and analytics tracks have no prerequisites at all." },
  { q: "How long does each course take?", a: "Most modules are designed for 5–12 hours of focused study, plus labs. A full programme typically takes 3–6 months at part-time pace." },
  { q: "Can I switch courses later?", a: "Yes. You can request any published course at any time. Your progress is saved per-module. Switching tracks never resets your work." },
  { q: "What about the labs? Do I need to install anything?", a: "No. Every lab runs in your browser. Notebooks, terminals and databases are spun up on demand and persist between sessions." },
];

export default function PublicHomePage() {
  const router = useRouter();
  const goLogin = () => router.push("/login");
  const goRegister = () => router.push("/register");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const featured = useCourses({ limit: 4, authenticated: false });

  return (
    <div className="public">
      <FloatingNav onSignUp={goRegister} />

      {/* HERO */}
      <section className="section section--dark hero">
        <div className="container-x hero-grid">
          <div>
            <Eyebrow dark>★ Trusted by 3,200+ engineers</Eyebrow>
            <h1>
              Engineering &amp; data skills,
              <br />
              on <span className="accent">your schedule</span>.
            </h1>
            <p>
              Multi-module course programmes in software, ML and analytics. Real instructor
              lectures, browser-based labs, and progress tracking that keep you focused from
              your first commit to your final project.
            </p>
            <div className="hero-cta">
              <Button size="lg" iconAfter="arrow-right" onClick={goRegister}>
                Start Learning
              </Button>
              <Button size="lg" variant="secondary-light" icon="log-in" onClick={goLogin}>
                Sign In
              </Button>
            </div>
            <div className="hero-proof">
              <div className="stack">
                {[5, 14, 32, 47].map((n) => (
                  <Avatar key={n} src={avatarUrl(n)} size="sm" name="" />
                ))}
              </div>
              <span>
                <b style={{ color: "#fff" }}>3,200+ learners</b> already on the platform
              </span>
            </div>
          </div>
          <div className="hero-img">
            <img src="/team-working.webp" alt="Students collaborating on a laptop" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section section--white" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="container-x">
          <div className="stats">
            <div className="stat">
              <div className="num">
                3,200<span className="accent">+</span>
              </div>
              <div className="lab">Active Learners</div>
              <div className="sub">Studying every week</div>
            </div>
            <div className="stat">
              <div className="num">
                94<span className="accent">%</span>
              </div>
              <div className="lab">Completion Rate</div>
              <div className="sub">Across published programmes</div>
            </div>
            <div className="stat">
              <div className="num">
                120<span className="accent">+</span>
              </div>
              <div className="lab">Lessons</div>
              <div className="sub">Across every track</div>
            </div>
            <div className="stat">
              <div className="num">
                320<span className="accent">+</span>
              </div>
              <div className="lab">Hands-on Labs</div>
              <div className="sub">Browser-based, auto-graded</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="section section--light" id="why">
        <div className="container-x">
          <div style={{ textAlign: "center" }}>
            <Eyebrow>Why Choose Us</Eyebrow>
            <h2 className="section-title section-title--center">
              Everything you need to <span className="accent">level up</span>
              <br />
              and ship, all in one place.
            </h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="ico">
                  <Icon name={f.ico} size={26} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="section section--deep">
        <div className="container-x">
          <Eyebrow dark>Our Process</Eyebrow>
          <h2 className="section-title">
            How <span className="accent">EduPath</span> works.
          </h2>
          <p className="section-sub">
            Three simple steps: sign up, choose your plan, start learning at your own pace.
          </p>
          <div className="step-cards">
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: "contents" }}>
                <div className="step-card">
                  <div className="step-card-top">
                    <span className="step-card-icon">
                      <Icon name={s.ico} size={18} />
                    </span>
                    <span className="step-card-num">{s.n}</span>
                  </div>
                  <h4 className="step-card-title">{s.title}</h4>
                  <p className="step-card-body">{s.body}</p>
                  <span className="step-card-badge">Step {i + 1}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="step-card-arrow" aria-hidden="true">
                    <span />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="section section--white" id="courses">
        <div className="container-x">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <Eyebrow>Featured Courses</Eyebrow>
              <h2 className="section-title">
                Pick a subject and <span className="accent">start studying</span>.
              </h2>
            </div>
            <Button
              variant="secondary"
              iconAfter="arrow-right"
              onClick={() => router.push("/courses")}
            >
              View All Courses
            </Button>
          </div>
          <div className="course-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {featured.loading && featured.items.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "var(--color-body-green)" }}>
                <Icon name="loader" size={22} />
                <p style={{ marginTop: 10, fontFamily: "var(--font-body)" }}>Loading courses…</p>
              </div>
            )}
            {!featured.loading && featured.items.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "var(--color-body-green)", fontFamily: "var(--font-body)" }}>
                No published courses yet.
              </div>
            )}
            {featured.items.map((c) => (
              <article
                key={c.id}
                className="course-card"
                onClick={() => router.push(`/courses/${c.id}`)}
              >
                <CourseCover imageUrl={c.coverImageUrl} alt={c.title} />
                <div className="body">
                  <div className="meta">
                    <span>
                      <Icon name="layers" size={12} />
                      {c.semesterCount} {c.semesterCount === 1 ? "module" : "modules"}
                    </span>
                    {c.createdByName && (
                      <span>
                        <Icon name="user" size={12} />
                        {c.createdByName}
                      </span>
                    )}
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <ArrowLink>Learn More</ArrowLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section--white" id="faq">
        <div className="container-x">
          <div style={{ textAlign: "center" }}>
            <Eyebrow>Common Questions</Eyebrow>
            <h2 className="section-title section-title--center">
              Frequently asked <span className="accent">questions</span>.
            </h2>
          </div>
          <div className="faq-list">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={f.q} className={`faq${isOpen ? " open" : ""}`}>
                  <button
                    className="faq-summary"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span className="ico">
                      <Icon name={isOpen ? "minus" : "plus"} size={18} />
                    </span>
                    {f.q}
                  </button>
                  {isOpen && <div className="body">{f.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section section--dark final-cta">
        <div className="ring" />
        <Avatar
          src={avatarUrl(7)}
          size="md"
          style={{ position: "absolute", top: "20%", left: "12%", border: "3px solid #BCE955", transform: "rotate(-6deg)" }}
        />
        <Avatar
          src={avatarUrl(15)}
          size="lg"
          style={{ position: "absolute", top: "30%", right: "14%", border: "3px solid #BCE955", transform: "rotate(8deg)" }}
        />
        <Avatar
          src={avatarUrl(22)}
          size="sm"
          style={{ position: "absolute", bottom: "22%", left: "20%", border: "3px solid #BCE955", transform: "rotate(4deg)" }}
        />
        <Avatar
          src={avatarUrl(38)}
          size="md"
          style={{ position: "absolute", bottom: "24%", right: "20%", border: "3px solid #BCE955", transform: "rotate(-3deg)" }}
        />
        <div className="container-x" style={{ position: "relative" }}>
          <Eyebrow dark>Get Started Today</Eyebrow>
          <h2 className="section-title section-title--center" style={{ marginTop: 18 }}>
            Ready to start your <span className="accent">learning journey</span>?
          </h2>
          <p className="section-sub" style={{ margin: "20px auto 28px", textAlign: "center" }}>
            Join thousands of learners who took control of their education with structured plans
            and real progress tracking.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Button size="lg" iconAfter="arrow-right" onClick={goRegister}>
              Start Learning
            </Button>
            <Button size="lg" variant="secondary-light" onClick={goLogin}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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
