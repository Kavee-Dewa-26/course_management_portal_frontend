"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { TccrWordmark } from "@/components/ui/TccrWordmark";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { apiRequest } from "@/infrastructure/api/request";
import { avatarUrl } from "@/lib/kit";

/**
 * TCCR public landing page. Mirrors
 * src/ui_structure/v2/project/tccr-screens-public.jsx (TPublicHomePage):
 *
 *   TopNav · Hero · Stats · Modules · How it works · Why · FAQ · Final CTA · Footer
 *
 * Module copy, feature list, FAQ entries and section labels are lifted verbatim
 * so the production page matches the prototype's content + tone.
 */

const MODULES = [
  {
    variant: "bs" as const,
    title: "Bible School",
    body: "Structured programmes with semester-by-semester learning. Multi-batch intakes, browser-based labs and lecture recordings on every lesson.",
    glyph: "book-open",
  },
  {
    variant: "cg" as const,
    title: "Cell Groups",
    body: "Stay connected to your G12 leader, attend weekly cells, and let your leader file reports in seconds — on web or mobile.",
    glyph: "users",
  },
];

const STEPS = [
  { n: "01", title: "Create your account", body: "Sign up in under a minute — you'll join as a Member straight away.", active: false },
  { n: "02", title: "Pick a course or join a cell", body: "Apply to enrol in a course batch, or wait to be added to your cell.", active: true },
  { n: "03", title: "Learn & connect", body: "Watch lessons, complete labs, attend cells, and grow with your community.", active: false },
];

const FEATURES = [
  { ico: "layers", title: "Course → Batch → Semester", body: "Pick the intake that fits your schedule. Past intakes auto-close so you always join the right cohort." },
  { ico: "calendar-clock", title: "Time-bound semesters", body: "Each semester has a clear start and end date. Once a semester closes, content locks for that cohort." },
  { ico: "shield-check", title: "Approved access", body: "Admins verify each request — for Student role, course enrolment, or leader promotion — within 24 hours." },
  { ico: "clipboard-list", title: "Weekly cell reports", body: "Leaders and G12 leaders file a single, structured weekly report — attendance, subject, follow-ups in one form." },
  { ico: "bar-chart-3", title: "Live analytics", body: "Leader, G12 and admin dashboards refresh weekly with attendance, growth and participation insights." },
  { ico: "languages", title: "සිංහල · தமிழ் · English", body: "Switch language any time. Notifications and emails arrive in your preferred language." },
];

const FAQS = [
  { q: "Do I need to be a student to join a cell?", a: "No — every registered user is a Member by default and can be added to a cell group. Student role is only required to enrol in Bible School courses." },
  { q: "How does a course intake work?", a: "Each course runs as multiple Batches. You apply to a specific Batch that fits your schedule. Past Batches auto-close, so you'll only see future or open intakes when applying." },
  { q: "Who can file a cell report?", a: "Only the cell's Leader or G12 Leader. Members can view past reports of their own cell, but they cannot edit or file new ones." },
  { q: "How do I become a Leader or G12?", a: "Existing G12 Leaders can promote a Member or Leader from their network. Admins and Super Admins can also assign these roles directly." },
];

export default function PublicHomePage() {
  const router = useRouter();
  const goLogin = () => router.push("/login");
  const goRegister = () => router.push("/register");
  const goCourses = () => router.push("/courses");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Live stats — backend may or may not respond. Falls back to the static
  // copy from the prototype if either endpoint 401/403s.
  const [stats, setStats] = useState<{ members: number | null; courses: number | null }>({
    members: null,
    courses: null,
  });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [usersRes, coursesRes] = await Promise.allSettled([
        apiRequest<{ total: number }>(`/users?role=student&limit=1`, { auth: false }),
        apiRequest<{ total: number }>(`/courses?state=published&limit=1`, { auth: false }),
      ]);
      if (cancelled) return;
      setStats({
        members: usersRes.status === "fulfilled" ? usersRes.value.total : null,
        courses: coursesRes.status === "fulfilled" ? coursesRes.value.total : null,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="public">
      <FloatingNav onSignUp={goRegister} />

      {/* ─── HERO ───────────────────────────────────────────────────── */}
      <section className="section section--dark hero">
        <div className="container-x hero-grid">
          <div>
            <Eyebrow dark>★ The Christian Center Rathmalana</Eyebrow>
            <h1>
              One community.
              <br />
              <span className="accent">Two ways</span> to grow.
            </h1>
            <p>
              TCCR brings Bible School learning and Cell Group fellowship into a single platform.
              Enrol in structured course batches, gather weekly with your cell, and let leaders
              track every meeting in seconds.
            </p>
            <div className="hero-cta">
              <Button size="lg" iconAfter="arrow-right" onClick={goRegister}>
                Create Account
              </Button>
              <Button size="lg" variant="secondary-light" icon="log-in" onClick={goLogin}>
                Sign In
              </Button>
            </div>
            <div className="hero-proof">
              <div className="stack">
                {[5, 14, 32, 47].map((n) => (
                  <Avatar key={n} src={avatarUrl(n)} size="sm" />
                ))}
              </div>
              <span>
                <b style={{ color: "#fff" }}>3,200+ members</b> across cells &amp; courses
              </span>
            </div>
          </div>
          <div className="hero-img">
            <img src="/team-working.webp" alt="TCCR community" />
            <div className="hero-badge">
              <div>
                <div className="num">4.9</div>
                <div className="stars">★ ★ ★ ★ ★</div>
              </div>
              <div className="lab">
                Avg. cell-meeting
                <br />
                satisfaction
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS strip ────────────────────────────────────────────── */}
      <section className="section section--white" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="container-x">
          <div className="stats">
            <Stat
              num={stats.members == null ? "3,200" : stats.members.toLocaleString()}
              suffix="+"
              label="Members"
              sub="Across cells & courses"
            />
            <Stat num="142" label="Cell Groups" sub="Meeting weekly" />
            <Stat
              num={stats.courses == null ? "21" : stats.courses.toLocaleString()}
              label="Bible School Courses"
              sub="Live in catalog"
            />
            <Stat num="94" suffix="%" label="Avg. attendance" sub="Last 8 weeks" />
          </div>
        </div>
      </section>

      {/* ─── MODULES ────────────────────────────────────────────────── */}
      <section className="section section--light" id="modules">
        <div className="container-x">
          <div style={{ textAlign: "center" }}>
            <Eyebrow>The Platform</Eyebrow>
            <h2 className="section-title section-title--center">
              Two modules,
              <br />
              <span className="accent">one</span> account.
            </h2>
            <p className="section-sub" style={{ margin: "16px auto 0", textAlign: "center" }}>
              Bible School and Cell Groups share a single sign-in. Switch between them in one
              click — and language any time.
            </p>
          </div>
          <div className="module-tiles" style={{ marginTop: 48 }}>
            {MODULES.map((m) => (
              <button key={m.title} type="button" className={`mod-tile ${m.variant}`} onClick={goRegister}>
                <div>
                  <div className="label">Module</div>
                  <h2>{m.title}</h2>
                  <p>{m.body}</p>
                </div>
                <div className="pill-row">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goRegister();
                    }}
                  >
                    Get started <Icon name="arrow-right" size={14} />
                  </button>
                </div>
                <div className="glyph" aria-hidden="true">
                  <Icon name={m.glyph} size={200} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="section section--deep">
        <div className="container-x">
          <Eyebrow dark>Our Process</Eyebrow>
          <h2 className="section-title">
            How <span className="accent">TCCR</span> works.
          </h2>
          <p className="section-sub">
            Three quick steps from sign-up to your first lesson — or your first cell meeting.
          </p>
          <div className="process-grid">
            <div className="steps">
              {STEPS.map((s) => (
                <div key={s.n} className={`step${s.active ? " active" : ""}`}>
                  <div className="num">{s.n}</div>
                  <div>
                    <h4>{s.title}</h4>
                    <p>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hero-img" style={{ aspectRatio: "1/1", borderRadius: 24 }}>
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                alt="Members gathering"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY (V2 feature list) ──────────────────────────────────── */}
      <section className="section section--white" id="why">
        <div className="container-x">
          <div style={{ textAlign: "center" }}>
            <Eyebrow>What&apos;s in v2</Eyebrow>
            <h2 className="section-title section-title--center">
              Everything you need to <span className="accent">learn</span>
              <br />
              and <span className="accent">connect</span> — in one place.
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

      {/* ─── FAQ ───────────────────────────────────────────────────── */}
      <section className="section section--light" id="faq">
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

      {/* ─── FINAL CTA ──────────────────────────────────────────────── */}
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
          <Eyebrow dark>Join TCCR</Eyebrow>
          <h2 className="section-title section-title--center" style={{ marginTop: 18 }}>
            Ready to <span className="accent">be part</span> of the family?
          </h2>
          <p className="section-sub" style={{ margin: "20px auto 28px", textAlign: "center" }}>
            One account, both modules. Sign up takes under a minute.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Button size="lg" iconAfter="arrow-right" onClick={goRegister}>
              Create Account
            </Button>
            <Button size="lg" variant="secondary-light" onClick={goLogin}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="footer footer--minimal">
        <div className="footer-bottom footer-bottom--solo">
          <TccrWordmark variant="reversed" />
          <span>© 2026 The Christian Center Rathmalana. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function Stat({ num, suffix, label, sub }: { num: string; suffix?: string; label: string; sub: string }) {
  return (
    <div className="stat">
      <div className="num">
        {num}
        {suffix && <span className="accent">{suffix}</span>}
      </div>
      <div className="lab">{label}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}
