"use client";

import { Icon } from "@/components/ui/Icon";
import { STUDENT_NOTIFS } from "@/lib/mock/notifications";

const TONE_COLOR: Record<string, string> = {
  success: "#3DB55F",
  warning: "#D97706",
  info: "#152A24",
  error: "#DC2626",
};

export default function StudentNotificationsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <div className="greeting">
            <b style={{ color: "#152A24" }}>
              {STUDENT_NOTIFS.filter((n) => !n.read).length}
            </b>{" "}
            unread.
          </div>
        </div>
      </div>

      <div className="activity">
        {STUDENT_NOTIFS.map((n, i) => (
          <div className="row" key={i}>
            <div
              className="ico"
              style={{ color: TONE_COLOR[n.tone] }}
            >
              <Icon name={n.ico} size={16} />
            </div>
            <div className="body">
              <div className="title">{n.title}</div>
              <div className="meta">{n.body}</div>
            </div>
            <span className="when">{n.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
