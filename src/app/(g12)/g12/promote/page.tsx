"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Typeahead, type TypeaheadEntry } from "@/components/ui/Typeahead";
import { RoleBadgeStack } from "@/components/user/RoleBadgeStack";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { TCCR_DIRECTORY } from "@/lib/mock/tccrDirectory";

export default function G12PromotePage() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  // Invite form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"leader" | "g12">("leader");

  const directory = useMemo<TypeaheadEntry[]>(
    () => TCCR_DIRECTORY.map((d) => ({ id: d.id, name: d.name, avatar: d.avatar, roles: d.roles })),
    [],
  );

  // Promotable list — members who don't already hold leader/g12
  const promotable = useMemo(
    () => TCCR_DIRECTORY.filter((d) => !d.roles.includes("g12")),
    [],
  );

  const onPromote = (id: string, name: string, to: "leader" | "g12") => {
    dispatch(
      pushToast({
        tone: "success",
        title: `Promoted to ${to === "leader" ? "Cell Leader" : "G12 Leader"}`,
        message: `${name} now has the ${to} role.`,
      }),
    );
  };

  const onInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    dispatch(
      pushToast({
        tone: "success",
        title: "Invite sent",
        message: `${firstName} ${lastName} will receive a sign-up email.`,
      }),
    );
    setFirstName("");
    setLastName("");
    setEmail("");
    setShowInvite(false);
  };

  return (
    <div className="page">
      <header
        className="page-header"
        style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
            Promote a member
          </h1>
          <p style={{ margin: "8px 0 0", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body-green)" }}>
            Find an existing TCCR member or invite a new one to take on a leadership role.
          </p>
        </div>
        <Button variant={showInvite ? "ghost" : "secondary-light"} icon={showInvite ? "x" : "user-plus"} onClick={() => setShowInvite((v) => !v)}>
          {showInvite ? "Close invite" : "Invite new user"}
        </Button>
      </header>

      <div className="role-banner" style={{ marginBottom: 20 }}>
        <div className="ico">
          <Icon name="info" size={20} />
        </div>
        <div className="b-body">
          <h3>Search before inviting</h3>
          <p>Many promotable members are already registered. Use the search to avoid duplicate invites.</p>
        </div>
      </div>

      <div style={{ marginBottom: 18, maxWidth: 480 }}>
        <Typeahead
          label="Find a TCCR member"
          placeholder="Search by name…"
          directory={directory}
          value={search}
          onChange={setSearch}
          onPick={(p) => setSearch(p.name)}
          onAddUnregistered={(name) => {
            setShowInvite(true);
            const [f, ...rest] = name.split(" ");
            setFirstName(f ?? "");
            setLastName(rest.join(" "));
          }}
        />
      </div>

      {showInvite && (
        <form
          onSubmit={onInvite}
          style={{ background: "#fff", border: "1px solid var(--color-stroke)", borderRadius: 18, padding: 22, marginBottom: 20, maxWidth: 720 }}
        >
          <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-heading)", fontSize: 16, color: "var(--color-primary)" }}>
            Invite a new user
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div style={{ marginTop: 12 }}>
            <label className="label" style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--color-body-green)", marginBottom: 8 }}>
              Role to assign on sign-up
            </label>
            <div className="rf-yesno">
              <label className={inviteRole === "leader" ? "on" : ""}>
                <input type="radio" checked={inviteRole === "leader"} onChange={() => setInviteRole("leader")} /> Cell Leader
              </label>
              <label className={inviteRole === "g12" ? "on" : ""}>
                <input type="radio" checked={inviteRole === "g12"} onChange={() => setInviteRole("g12")} /> G12 Leader
              </label>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button type="submit" icon="send">Send invite</Button>
          </div>
        </form>
      )}

      <h2 style={{ margin: "12px 0 12px", fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 600, color: "var(--color-primary)" }}>
        Latest TCCR members
      </h2>

      <div>
        {promotable.map((u) => {
          const isLeader = u.roles.includes("leader");
          return (
            <div key={u.id} className="promote-row">
              <Avatar src={u.avatar} name={u.name} />
              <div className="b-body">
                <div className="name">{u.name}</div>
                <div className="meta">
                  <RoleBadgeStack roles={u.roles} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!isLeader && (
                  <Button size="sm" variant="ghost" onClick={() => onPromote(u.id, u.name, "leader")}>
                    Promote to Leader
                  </Button>
                )}
                <Button size="sm" onClick={() => onPromote(u.id, u.name, "g12")}>
                  Promote to G12
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
