"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/application/hooks/useAppDispatch";
import { pushToast } from "@/application/slices/uiSlice";
import { listBatchesForCourse, createBatch, type Batch, type BatchState } from "@/lib/mock/batches";

/**
 * UI-only "Batches / Intakes" sub-tree for the V2 course editor.
 *
 * In V2 the course hierarchy is Course → Batch → Semester → Subject → Lesson.
 * Each Batch is a time-bound intake with its own open/close window, capacity
 * cap, and lifecycle state (draft / open / closed). The data here is mocked
 * via src/lib/mock/batches.ts — there is no backend integration yet, per the
 * phase-2 UI-only constraint.
 */
interface Props {
  courseId: string;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function batchBadge(state: BatchState) {
  if (state === "open") return <Badge tone="success">Open</Badge>;
  if (state === "closed") return <Badge tone="archive">Closed</Badge>;
  return <Badge tone="warning">Draft</Badge>;
}

export function BatchesSection({ courseId }: Props) {
  const dispatch = useAppDispatch();
  const [tick, setTick] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // Form state for new batch
  const [name, setName] = useState("");
  const [intakeStart, setIntakeStart] = useState("");
  const [intakeEnd, setIntakeEnd] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [state, setState] = useState<BatchState>("draft");

  // Mock batches re-fetched after every save so newly created rows appear.
  const batches = useMemo<Batch[]>(() => {
    void tick;
    return listBatchesForCourse(courseId);
  }, [courseId, tick]);

  const resetForm = () => {
    setName("");
    setIntakeStart("");
    setIntakeEnd("");
    setCapacity("");
    setState("draft");
    setShowForm(false);
  };

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !intakeStart || !intakeEnd) return;
    const created = createBatch({
      courseId,
      name: name.trim(),
      intakeStart,
      intakeEnd,
      state,
      capacity: typeof capacity === "number" ? capacity : 0,
    });
    setTick((t) => t + 1);
    resetForm();
    dispatch(pushToast({ tone: "success", title: "Batch created", message: `${created.name} added to this course.` }));
  };

  return (
    <section className="settings-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2>Batches &amp; intakes</h2>
          <p className="settings-sub">
            Each batch is a separate intake window. Past batches auto-close so students only see future or open intakes when applying.
          </p>
        </div>
        <Button variant={showForm ? "ghost" : "primary"} icon={showForm ? "x" : "plus"} onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? "Close" : "New batch"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={onCreate}
          style={{
            background: "var(--color-stroke-2)",
            border: "1px solid var(--color-stroke)",
            borderRadius: 12,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <Input label="Batch name" placeholder="e.g. Intake 12 · Q2 2026" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Intake opens" type="date" value={intakeStart} onChange={(e) => setIntakeStart(e.target.value)} />
            <Input label="Intake closes" type="date" value={intakeEnd} onChange={(e) => setIntakeEnd(e.target.value)} />
            <Input
              label="Capacity"
              type="number"
              placeholder="60"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <div className="field">
              <label className="label">Initial state</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as BatchState)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--color-stroke)",
                  borderRadius: 10,
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  color: "var(--color-primary)",
                  background: "#fff",
                }}
              >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" icon="check" disabled={!name.trim() || !intakeStart || !intakeEnd}>
              Create batch
            </Button>
          </div>
        </form>
      )}

      {batches.length === 0 ? (
        <div
          style={{
            padding: 24,
            border: "1px dashed var(--color-stroke)",
            borderRadius: 12,
            textAlign: "center",
            color: "var(--color-muted)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
          }}
        >
          No batches yet. Create the first intake so members can apply.
        </div>
      ) : (
        <div className="batches">
          {batches.map((b) => (
            <div key={b.id} className={`batch-row${b.state === "closed" ? " closed" : ""}`}>
              <div className="ico">
                <Icon name={b.state === "closed" ? "x-circle" : "calendar-clock"} size={18} />
              </div>
              <div className="b-body">
                <div className="name">{b.name}</div>
                <div className="window">
                  <span>
                    <Icon name="calendar" size={12} /> {formatDate(b.intakeStart)} → {formatDate(b.intakeEnd)}
                  </span>
                  <span className="sep">·</span>
                  <span>
                    <Icon name="users" size={12} /> {b.enrolled} / {b.capacity || "—"} enrolled
                  </span>
                </div>
              </div>
              {batchBadge(b.state)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
