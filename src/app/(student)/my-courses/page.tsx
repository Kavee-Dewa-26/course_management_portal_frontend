"use client";

import { useRouter } from "next/navigation";
import { CourseCover } from "@/components/ui/CourseCover";
import { Icon } from "@/components/ui/Icon";
import {
  STUDENT_ENROLLED_NOT_STARTED,
  STUDENT_IN_PROGRESS,
  type CourseSummary,
} from "@/lib/mock/courses";

const ALL: CourseSummary[] = [...STUDENT_IN_PROGRESS, ...STUDENT_ENROLLED_NOT_STARTED];

export default function MyCoursesPage() {
  const router = useRouter();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <div className="greeting">
            <b style={{ color: "#152A24" }}>{ALL.length}</b> enrolled —{" "}
            {STUDENT_IN_PROGRESS.length} in progress.
          </div>
        </div>
      </div>

      <div className="my-grid">
        {ALL.map((c) => (
          <article
            key={c.id}
            className="course-card my-card"
            onClick={() => router.push(`/my-courses/${c.id}`)}
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
            </div>
            <div className="progress-cap">
              <div className="bar">
                <i style={{ width: (c.progress ?? 0) + "%" }} />
              </div>
              <span className="pct">{c.progress ?? 0}%</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
