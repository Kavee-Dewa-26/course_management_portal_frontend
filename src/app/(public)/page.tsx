"use client";

/* eslint-disable @next/next/no-img-element */
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
import { FEATURED_COURSES } from "@/lib/mock/courses";
import { avatarUrl } from "@/lib/kit";

const FEATURES = [
  { ico: "layers", title: "Structured Course Plans", body: "Multi-module roadmaps with clear topic ordering — no guesswork on what to learn next." },
  { ico: "trending-up", title: "Track Your Progress", body: "Module-level completion shown across every course so you always know where you stand." },
  { ico: "shield-check", title: "Verified Materials", body: "Lessons, code labs and project briefs curated by working software and data engineers." },
  { ico: "terminal", title: "Hands-on Labs", body: "Browser-based notebooks and sandboxes — write real code and run real queries from lesson one." },
  { ico: "video", title: "Lecture Recordings", body: "Watch on demand — every lesson stays available throughout your subscription." },
  { ico: "smartphone", title: "Learn on Any Device", body: "The platform works across desktop, tablet and phone with no install required." },
];

const STEPS = [
  { n: "01", title: "Create Your Account", body: "Sign up in under a minute — no credit card required.", active: true },
  { n: "02", title: "Pick Your Course Plan", body: "Browse module-by-module tracks built around your engineering goals." },
  { n: "03", title: "Start Learning", body: "Watch lessons, complete labs and track progress across every module." },
];

const FAQS = [
  { q: "Do I need a CS degree to start?", a: "No. Foundation courses assume only basic familiarity with a programming language. Our SQL and analytics tracks have no prerequisites at all." },
  { q: "How long does each course take?", a: "Most modules are designed for 5–12 hours of focused study, plus labs. A full programme typically takes 3–6 months at part-time pace." },
  { q: "Can I switch courses later?", a: "Yes. You can request any published course at any time. Your progress is saved per-module — switching tracks never resets your work." },
  { q: "What about the labs — do I need to install anything?", a: "No. Every lab runs in your browser. Notebooks, terminals and databases are spun up on demand and persist between sessions." },
];

export default function PublicHomePage() {
  const router = useRouter();
  const goLogin = () => router.push("/login");
  const goRegister = () => router.push("/register");

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
              Multi-module course programmes in software, ML and analytics — real instructor
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
              and ship — in one place.
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
            Three simple steps — sign up, choose your plan, start learning at your own pace.
          </p>
          <div className="process-grid">
            <div className="steps">
              {STEPS.map((s) => (
                <div key={s.n} className={"step" + (s.active ? " active" : "")}>
                  <div className="num">{s.n}</div>
                  <div>
                    <h4>{s.title}</h4>
                    <p>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="process-img">
              <img
                src="https://images.unsplash.com/photo-1488998427799-e3362cec87c3?w=800&q=80"
                alt=""
              />
            </div>
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
            {FEATURED_COURSES.map((c) => (
              <article
                key={c.title}
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
            {FAQS.map((f, i) => (
              <details key={f.q} className="faq" open={i === 0}>
                <summary>
                  <span className="ico">
                    <Icon name={i === 0 ? "minus" : "plus"} size={18} />
                  </span>
                  {f.q}
                </summary>
                <div className="body">{f.a}</div>
              </details>
            ))}
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
