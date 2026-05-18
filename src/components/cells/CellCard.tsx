"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import type { Cell } from "@/lib/mock/cells";

interface Props {
  cell: Cell;
  /** When true, hover effects and click handler are disabled. */
  readonly?: boolean;
  onClick?: () => void;
}

const TYPE_LABEL: Record<Cell["type"], string> = {
  g12: "G12",
  care: "Care",
  children: "Children",
  outreach: "Outreach",
};

/**
 * Cell summary card used in cell grids (member read-only view + leader cells list).
 */
export function CellCard({ cell, readonly, onClick }: Props) {
  const avatars = cell.members.slice(0, 4);
  const Wrapper = readonly ? "div" : "button";

  return (
    <Wrapper
      className={`cell-card${readonly ? " readonly" : ""}`}
      onClick={readonly ? undefined : onClick}
      type={readonly ? undefined : "button"}
    >
      <div className="top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{cell.name}</h3>
          <div className="leader">
            <Avatar src={cell.leaderAvatar} name={cell.leaderName} size="sm" />
            {cell.leaderName}
          </div>
        </div>
        <span className={`cell-type ${cell.type}`}>{TYPE_LABEL[cell.type]}</span>
      </div>

      <div className="members-row">
        <div className="stack">
          {avatars.map((m) => (
            <Avatar key={m.id} src={m.avatar} name={m.name} size="sm" />
          ))}
        </div>
        <span className="members-count">
          {cell.members.length} member{cell.members.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="footer">
        <span className="stat">
          <Icon name="map-pin" size={12} /> {cell.area}
        </span>
        <span className="stat">
          <Icon name="file-text" size={12} /> <b>{cell.reportCount}</b> reports
        </span>
      </div>
    </Wrapper>
  );
}
