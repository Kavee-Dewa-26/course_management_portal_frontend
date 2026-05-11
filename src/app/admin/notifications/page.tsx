"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { ADMIN_NOTIFS } from "@/lib/mock/notifications";

export default function AdminNotificationsPage() {
  const router = useRouter();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <div className="greeting">
            Incoming approval requests and platform alerts.
          </div>
        </div>
      </div>

      <div className="activity">
        {ADMIN_NOTIFS.map((n, i) => (
          <button
            key={i}
            className="row"
            style={{
              background: "transparent",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: n.link ? "pointer" : "default",
            }}
            onClick={() => n.link && router.push(n.link)}
          >
            <div className="ico">
              <Icon name={n.ico} size={16} />
            </div>
            <div className="body">
              <div className="title">{n.title}</div>
              <div className="meta">{n.body}</div>
            </div>
            <span className="when">{n.when}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
