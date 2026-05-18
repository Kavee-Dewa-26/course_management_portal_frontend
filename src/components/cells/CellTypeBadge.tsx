import type { CellType } from "@/lib/mock/cells";

const LABEL: Record<CellType, string> = {
  g12: "G12",
  care: "Care",
  children: "Children",
  outreach: "Outreach",
};

interface Props {
  type: CellType;
}

export function CellTypeBadge({ type }: Props) {
  return <span className={`cell-type ${type}`}>{LABEL[type]}</span>;
}
