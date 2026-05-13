/* eslint-disable @next/next/no-img-element */
import { Icon } from "./Icon";
import { coverGradient, type CoverKind } from "@/lib/kit";

interface CourseCoverProps {
  /** Real image URL from API. Falls back to gradient when null/empty. */
  imageUrl?: string | null;
  /** Gradient style when no image is available. */
  kind?: CoverKind;
  /** Watermark icon used in the gradient fallback. */
  emblem?: string;
  /** Optional pill tag rendered in the top-left corner. */
  tag?: string;
  /** Alt text when imageUrl is used. */
  alt?: string;
}

export function CourseCover({ imageUrl, kind = "gen", emblem, tag, alt }: CourseCoverProps) {
  if (imageUrl) {
    return (
      <div className="cover">
        <img
          src={imageUrl}
          alt={alt ?? tag ?? "Course cover"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {tag && <span className="tag">{tag}</span>}
      </div>
    );
  }

  return (
    <div className="cover" style={{ background: coverGradient(kind) }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(188,233,85,0.18)",
          pointerEvents: "none",
        }}
      >
        {emblem && <Icon name={emblem} size={120} strokeWidth={1.25} />}
      </div>
      {tag && <span className="tag">{tag}</span>}
    </div>
  );
}
