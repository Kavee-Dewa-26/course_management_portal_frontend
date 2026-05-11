"use client";

import { useRouter } from "next/navigation";
import { CourseEditor, type CoursePayload } from "@/components/course/CourseEditor";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";

export default function NewCoursePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const back = () => router.push("/admin/courses");
  const save = (publish: boolean) => (p: CoursePayload) => {
    dispatch(
      pushToast({
        tone: "success",
        title: publish ? "Course published" : "Draft saved",
        message: p.title,
      }),
    );
    setTimeout(back, 600);
  };

  return (
    <CourseEditor
      onCancel={back}
      onSave={save(false)}
      onPublish={save(true)}
    />
  );
}
