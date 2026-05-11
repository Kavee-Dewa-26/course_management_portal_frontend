"use client";

import { useParams, useRouter } from "next/navigation";
import { CourseEditor, type CoursePayload } from "@/components/course/CourseEditor";
import { ADMIN_COURSES_SEED } from "@/lib/mock/courses";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const dispatch = useAppDispatch();

  const id = Number(params.courseId);
  const initial = ADMIN_COURSES_SEED.find((c) => c.id === id);

  const back = () => router.push("/admin/courses");
  const save = (publish: boolean) => (p: CoursePayload) => {
    dispatch(
      pushToast({
        tone: "success",
        title: publish ? "Course published" : "Draft saved",
        message: p.title || initial?.title,
      }),
    );
    setTimeout(back, 600);
  };

  return (
    <CourseEditor
      initial={initial ? { title: initial.title, subject: initial.subject } : undefined}
      onCancel={back}
      onSave={save(false)}
      onPublish={save(true)}
    />
  );
}
