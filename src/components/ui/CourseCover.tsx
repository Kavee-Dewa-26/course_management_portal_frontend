import { Icon } from "./Icon";
import { coverGradient, type CoverKind } from "@/lib/kit";

interface CourseCoverProps {
  kind?: CoverKind;
  emblem?: string;
  tag?: string;
}

export function CourseCover({ kind = "gen", emblem, tag }: CourseCoverProps) {
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
