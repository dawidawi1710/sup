"use client";

import { useState, useTransition, useEffect, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import NewSupplementModal from "./NewSupplementModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import CalendarModal from "./CalendarModal";
import {
  updateSupplementPerson,
  updatePackageUnits,
  updateDeductionTime,
  reorderSupplements,
  createPerson,
  deletePerson,
  renamePerson,
  deductAllForPerson,
  revertAllForPerson,
} from "./actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type Person = { id: number; name: string };

type SupplementPerson = {
  id: number;
  personId: number;
  supplementId: number;
  takingDaily: boolean;
  unitsPerDay: number | null;
  person: Person;
};

type Supplement = {
  id: number;
  activeIngredient: string;
  dosePerUnit: string;
  amountOfUnits: number;
  amountOfPackages: number;
  brand: string;
  source: string;
  costPerPackage: number;
  unitsLeft: number | null;
  packageUnits: string | null;
  createdAt: string;
  persons: SupplementPerson[];
};

type SkippedIntake = { date: string; personId: number; supplementId: number };

type DeductedEntry = {
  personId: number;
  supplementId: number;
  unitsDeducted: number;
};

type DeductionLogEntry = {
  date: string;
  personId: number;
  supplementId: number;
  source: string;
  reversed: boolean;
  unitsDeducted: number;
};

// ── Decorative dots motif ─────────────────────────────────────────────────────

function Dots({ style }: { style?: React.CSSProperties }) {
  return (
    <span
      className="pointer-events-none select-none"
      aria-hidden
      style={{
        position: "relative",
        display: "inline-block",
        width: 24,
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: -4,
          left: 2,
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#0a0a0a",
          opacity: 0.18,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 14,
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#0a0a0a",
          opacity: 0.12,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: -2,
          left: 20,
          width: 3,
          height: 3,
          borderRadius: "50%",
          background: "#0a0a0a",
          opacity: 0.2,
        }}
      />
    </span>
  );
}

// ── PersonToggle ──────────────────────────────────────────────────────────────

function PersonToggle({
  personId,
  supplementId,
  value,
}: {
  personId: number;
  supplementId: number;
  value: boolean;
}) {
  const [optimistic, setOptimistic] = useState(value);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setOptimistic(value);
  }, [value]);

  function handleToggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(() =>
      updateSupplementPerson(personId, supplementId, { takingDaily: next }),
    );
  }

  return (
    <button
      onClick={handleToggle}
      aria-label="Toggle taking daily"
      className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-200 focus:outline-none active:scale-95 ${
        optimistic
          ? "border-[#0a0a0a] bg-[#0a0a0a]"
          : "border-[#0a0a0a] bg-white"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${
          optimistic
            ? "translate-x-4 bg-white shadow-sm"
            : "translate-x-0.5 bg-[#c8c8c8]"
        }`}
      />
    </button>
  );
}

// ── PersonRow ─────────────────────────────────────────────────────────────────

function PersonRow({
  sp,
  costPerUnit,
}: {
  sp: SupplementPerson;
  costPerUnit: number;
}) {
  const [display, setDisplay] = useState(sp.unitsPerDay?.toString() ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setDisplay(sp.unitsPerDay?.toString() ?? "");
  }, [sp.unitsPerDay]);

  function saveUnits() {
    const val = display === "" ? null : Math.max(0, parseInt(display) || 0);
    const coerced = val === null ? "" : String(val);
    setDisplay(coerced);
    startTransition(() =>
      updateSupplementPerson(sp.personId, sp.supplementId, {
        unitsPerDay: val,
      }),
    );
  }

  const costPerDay =
    sp.takingDaily && sp.unitsPerDay ? costPerUnit * sp.unitsPerDay : null;

  return (
    <div className="flex items-center gap-3">
      <PersonToggle
        personId={sp.personId}
        supplementId={sp.supplementId}
        value={sp.takingDaily}
      />
      <span
        className={`w-16 truncate text-sm font-medium ${sp.takingDaily ? "text-[#0a0a0a]" : "text-[#a3a3a3]"}`}
      >
        {sp.person.name}
      </span>
      <input
        type="number"
        min={0}
        value={display}
        placeholder="—"
        onChange={(e) => setDisplay(e.target.value)}
        onBlur={saveUnits}
        onKeyDown={(e) => e.key === "Enter" && saveUnits()}
        style={{ width: `${Math.max((display || "—").length, 1) + 2}ch` }}
        className={`h-9 rounded-lg border px-1 text-center text-sm transition-colors duration-150 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          sp.takingDaily
            ? "border-[#e5e5e5] text-[#0a0a0a] focus:border-[#0a0a0a]"
            : "border-[#f0f0f0] text-[#a3a3a3] focus:border-[#d4d4d4]"
        }`}
      />
      <span
        className={`text-sm ${sp.takingDaily ? "text-[#737373]" : "text-[#d4d4d4]"}`}
      >
        /day
      </span>
      {costPerDay != null && (
        <span className="ml-auto text-sm font-semibold text-[#0a0a0a]">
          {costPerDay.toFixed(2)}€/day
        </span>
      )}
    </div>
  );
}

// ── PackageInputs ─────────────────────────────────────────────────────────────

function PackageInputs({
  id,
  packageUnits,
  amountOfUnits,
  combinedUnitsPerDay,
}: {
  id: number;
  packageUnits: number[];
  amountOfUnits: number;
  combinedUnitsPerDay: number;
}) {
  const [display, setDisplay] = useState(packageUnits.map(String));
  const [, startTransition] = useTransition();

  useEffect(() => {
    setDisplay(packageUnits.map(String));
  }, [packageUnits]);

  function handleChange(i: number, raw: string) {
    setDisplay(display.map((v, idx) => (idx === i ? raw : v)));
  }

  function handleBlur(i: number) {
    const coerced = display.map((v, idx) => {
      if (idx !== i) return v;
      return String(Math.max(0, Math.min(parseInt(v) || 0, amountOfUnits)));
    });
    setDisplay(coerced);
    startTransition(() =>
      updatePackageUnits(
        id,
        coerced.map((v) => parseInt(v) || 0),
      ),
    );
  }

  const values = display.map((v) => parseInt(v) || 0);
  const total = values.reduce((a, b) => a + b, 0);
  const maxTotal = amountOfUnits * packageUnits.length;
  const daysLeft =
    combinedUnitsPerDay > 0 ? Math.floor(total / combinedUnitsPerDay) : null;
  const pct =
    daysLeft != null
      ? Math.min(daysLeft / 30, 1)
      : maxTotal > 0
        ? Math.min(total / maxTotal, 1)
        : 0;
  const isLowStock = daysLeft !== null ? daysLeft < 14 : pct < 0.3;
  const barFill =
    pct === 0 ? "bg-[#ef4444]" : isLowStock ? "bg-amber-400" : "bg-[#0a0a0a]";

  return (
    <div className="border-t border-[#f0f0f0] pt-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {display.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            {display.length > 1 && (
              <span className="text-xs font-medium text-[#737373]">
                Pkg {i + 1}:
              </span>
            )}
            {display.length === 1 && (
              <span className="text-xs text-[#737373]">Units left:</span>
            )}
            {display.length > 1 && (
              <div className="h-1 w-16 overflow-hidden rounded-full bg-[#f0f0f0]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barFill}`}
                  style={{
                    width: `${Math.min(((parseInt(v) || 0) / amountOfUnits) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
            <input
              type="number"
              min={0}
              max={amountOfUnits}
              value={v}
              onChange={(e) => handleChange(i, e.target.value)}
              onBlur={() => handleBlur(i)}
              onKeyDown={(e) => e.key === "Enter" && handleBlur(i)}
              style={{ width: `${Math.max(v.length, 1) + 2}ch` }}
              className="h-8 rounded-lg border border-[#e5e5e5] px-1 text-center text-sm text-[#0a0a0a] transition-colors duration-150 focus:border-[#0a0a0a] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-sm text-[#a3a3a3]">/ {amountOfUnits}</span>
            {display.length > 1 && (
              <button
                onClick={() => {
                  const nextDisplay = display.filter((_, idx) => idx !== i);
                  setDisplay(nextDisplay);
                  startTransition(() =>
                    updatePackageUnits(
                      id,
                      nextDisplay.map((v) => parseInt(v) || 0),
                    ),
                  );
                }}
                className="text-[#d4d4d4] transition-colors hover:text-[#ef4444]"
                aria-label={`Delete package ${i + 1}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {display.length > 1 && (
          <span className="text-sm font-medium text-[#525252]">
            = {total} units
          </span>
        )}
        {daysLeft != null && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isLowStock
                ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                : "bg-[#fafafa] text-[#0a0a0a] ring-1 ring-[#f0f0f0]"
            }`}
          >
            {daysLeft} days left
          </span>
        )}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barFill}`}
          style={{ width: pct === 0 ? "100%" : `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Intake file generation ────────────────────────────────────────────────────

function buildIntakeText(person: Person, supplements: Supplement[]): string {
  const date = new Date().toISOString().split("T")[0];
  const active = supplements.flatMap((s) => {
    const sp = s.persons.find((sp) => sp.personId === person.id);
    if (!sp?.takingDaily || !sp.unitsPerDay) return [];
    return [{ s, sp }];
  });

  const lines = [
    `SUPPLEMENT INTAKE REPORT`,
    `Person : ${person.name}`,
    `Date   : ${date}`,
    ``,
  ];

  if (active.length === 0) {
    lines.push(`No active supplements.`);
  } else {
    lines.push(`Active supplements: ${active.length}`);
    for (const { s, sp } of active) {
      const numMatch = s.dosePerUnit.match(/^([\d.]+)\s*(.+)$/);
      const upd = sp.unitsPerDay!;
      const dailyDose = numMatch
        ? `${parseFloat(numMatch[1]) * upd} ${numMatch[2]}`
        : `${upd} x ${s.dosePerUnit}`;
      lines.push(``);
      lines.push(`  Ingredient  : ${s.activeIngredient}`);
      lines.push(`  Brand       : ${s.brand}`);
      lines.push(`  Dose/unit   : ${s.dosePerUnit}`);
      lines.push(`  Units/day   : ${sp.unitsPerDay}`);
      lines.push(`  Daily dose  : ${dailyDose}`);
    }
  }

  return lines.join("\n");
}

function downloadIntakeFile(person: Person, supplements: Supplement[]) {
  const text = buildIntakeText(person, supplements);
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${person.name.toLowerCase().replace(/\s+/g, "-")}-supplements.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PersonManager ─────────────────────────────────────────────────────────────

function PersonManager({
  persons,
  supplements,
  deductedToday,
  deductionTime,
}: {
  persons: Person[];
  supplements: Supplement[];
  deductedToday: DeductedEntry[];
  deductionTime: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function handleAdd() {
    const name = newName.trim();
    if (!name) {
      setAdding(false);
      return;
    }
    setAdding(false);
    setNewName("");
    startTransition(() => createPerson(name));
  }

  function handleRename(id: number) {
    const name = editName.trim();
    setEditingId(null);
    if (name) startTransition(() => renamePerson(id, name));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {persons.map((p) => {
        const hasActiveSups = supplements.some((s) =>
          s.persons.some(
            (sp) => sp.personId === p.id && sp.takingDaily && sp.unitsPerDay,
          ),
        );
        const takenToday = deductedToday.some((d) => d.personId === p.id);
        const dotColor = takenToday
          ? "#10b981"
          : hasActiveSups
            ? "#f59e0b"
            : "#d4d4d4";

        return editingId === p.id ? (
          <input
            key={p.id}
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => handleRename(p.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename(p.id);
              if (e.key === "Escape") setEditingId(null);
            }}
            className="h-8 w-24 rounded-full border border-[#0a0a0a] px-3 text-sm focus:outline-none"
          />
        ) : (
          <span
            key={p.id}
            className={`group flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
              takenToday
                ? "border border-[#0a0a0a] bg-white text-[#0a0a0a]"
                : "bg-[#f5f5f5] text-[#525252]"
            }`}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <button
              onClick={() => {
                setEditingId(p.id);
                setEditName(p.name);
              }}
              className="hover:opacity-70 transition-opacity"
            >
              {p.name}
            </button>
            {hasActiveSups &&
              (takenToday ? (
                <>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#10b981]">
                    TAKEN
                  </span>
                  <button
                    onClick={() =>
                      startTransition(() => revertAllForPerson(p.id))
                    }
                    className="text-xs text-[#a3a3a3] underline transition-colors hover:text-[#0a0a0a]"
                    title="Undo today's deduction"
                  >
                    undo
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    startTransition(() => deductAllForPerson(p.id))
                  }
                  className="rounded-full bg-[#0a0a0a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-70"
                  title={`Deduct all supplements for ${p.name} · auto-deducts at ${deductionTime}`}
                >
                  Take
                </button>
              ))}
            <button
              onClick={() => downloadIntakeFile(p, supplements)}
              className="text-[#d4d4d4] transition-colors hover:text-[#737373]"
              aria-label={`Download intake report for ${p.name}`}
              title="Download intake report"
            >
              ↓
            </button>
            {persons.length > 1 && (
              <button
                onClick={() => setDeletingId(p.id)}
                className="text-[#d4d4d4] transition-colors hover:text-[#ef4444]"
                aria-label={`Delete ${p.name}`}
              >
                ×
              </button>
            )}
          </span>
        );
      })}
      {adding ? (
        <input
          ref={inputRef}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleAdd}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") {
              setAdding(false);
              setNewName("");
            }
          }}
          placeholder="Name…"
          className="h-8 w-24 rounded-full border border-[#0a0a0a] px-3 text-sm focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-full border border-dashed border-[#d4d4d4] px-4 py-1.5 text-sm font-medium text-[#737373] transition-all hover:border-solid hover:border-[#737373] hover:text-[#0a0a0a]"
        >
          + Add person
        </button>
      )}

      {deletingId !== null &&
        (() => {
          const person = persons.find((p) => p.id === deletingId)!;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-[20px] bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.08)]">
                <h2 className="mb-2 text-lg font-semibold text-[#0a0a0a]">
                  Delete {person.name}?
                </h2>
                <p className="mb-8 text-sm text-[#737373]">
                  This will permanently remove {person.name} and all their
                  supplement associations.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingId(null);
                      startTransition(() => deletePerson(deletingId));
                    }}
                    className="h-13 w-full rounded-xl bg-[#ef4444] text-sm font-semibold text-white transition-shadow hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(null)}
                    className="text-sm text-[#737373] transition-colors hover:text-[#0a0a0a]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// ── SupplementsClient ─────────────────────────────────────────────────────────

export default function SupplementsClient({
  user,
  persons,
  supplements,
  skippedIntakes,
  deductionTime,
  deductedToday,
  allDeductionLogs,
}: {
  user: { name: string | null; image: string | null };
  persons: Person[];
  supplements: Supplement[];
  skippedIntakes: SkippedIntake[];
  deductionTime: string;
  deductedToday: DeductedEntry[];
  allDeductionLogs: DeductionLogEntry[];
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Supplement | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [timeDisplay, setTimeDisplay] = useState(deductionTime);
  const [editingTime, setEditingTime] = useState(false);
  const [, startTimeTransition] = useTransition();
  const [orderedSupplements, setOrderedSupplements] = useState(supplements);
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [, startReorderTransition] = useTransition();

  useEffect(() => {
    setOrderedSupplements(supplements);
  }, [supplements]);

  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    const [h, m] = deductionTime.split(":").map(Number);
    const now = new Date();
    const next = new Date(now);
    next.setHours(h, m, 5, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const ms = next.getTime() - now.getTime();
    const timeout = setTimeout(() => router.refresh(), ms);
    return () => clearTimeout(timeout);
  }, [deductionTime, router]);

  const personCosts = persons.map((person) => {
    const cost = supplements.reduce((sum, s) => {
      const sp = s.persons.find((sp) => sp.personId === person.id);
      if (!sp?.takingDaily || !sp.unitsPerDay) return sum;
      return sum + (s.costPerPackage / s.amountOfUnits) * sp.unitsPerDay;
    }, 0);
    return { person, cost };
  });
  const totalCostPerDay = personCosts.reduce((sum, { cost }) => sum + cost, 0);

  return (
    <>
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 flex h-20 w-full items-center border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto flex w-full max-w-none items-center justify-between px-8">
          {/* Wordmark + dots */}
          <div className="relative flex items-center gap-1">
            <span className="text-xl font-semibold tracking-tight text-[#0a0a0a]">
              SUPPLEMENT TRACKER
            </span>
            <Dots />
          </div>

          {/* Avatar + sign out */}
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="flex items-center gap-2 rounded-full p-1 transition-opacity hover:opacity-70"
          >
            {user.image ? (
              <img src={user.image} alt={user.name ?? "User"} className="h-9 w-9 rounded-full" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5] text-sm font-medium text-[#525252]">
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto w-full max-w-none px-8 py-8">
        {/* Persons row */}
        <div className="mb-6">
          <PersonManager
            persons={persons}
            supplements={supplements}
            deductedToday={deductedToday}
            deductionTime={deductionTime}
          />
        </div>

        {/* Cost summary + action bar */}
        <div className="mb-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreating(true)}
              className="h-11 rounded-xl bg-[#0a0a0a] px-5 text-sm font-semibold text-white transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            >
              New supplement
            </button>
            <button
              onClick={() => setShowCalendar(true)}
              className="h-11 rounded-xl border border-[#e5e5e5] bg-white px-5 text-sm text-[#0a0a0a] transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
            >
              Calendar
            </button>
            <button
              onClick={() => {
                setReordering((r) => !r);
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              className={`h-11 rounded-xl border px-5 text-sm transition-all duration-150 ${
                reordering
                  ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                  : "border-[#e5e5e5] bg-white text-[#0a0a0a] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
              }`}
            >
              {reordering ? "Done" : "Reorder"}
            </button>
            {/* Auto-deduct time pill */}
            <div className="flex items-center gap-2 rounded-full bg-[#f5f5f5] px-4 py-2 text-sm text-[#525252]">
              <svg
                className="h-4 w-4 shrink-0 text-[#737373]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  d="M12 7v5l3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {editingTime ? (
                <input
                  type="time"
                  value={timeDisplay}
                  autoFocus
                  onChange={(e) => setTimeDisplay(e.target.value)}
                  onBlur={() => {
                    setEditingTime(false);
                    startTimeTransition(() => updateDeductionTime(timeDisplay));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") {
                      setTimeDisplay(deductionTime);
                      setEditingTime(false);
                    }
                  }}
                  className="w-20 rounded border border-[#0a0a0a] bg-transparent px-1 text-sm focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setEditingTime(true)}
                  className="font-medium text-[#0a0a0a] transition-opacity hover:opacity-60"
                >
                  {timeDisplay}
                </button>
              )}
            </div>
          </div>

          {/* Cost summary panel */}
          {totalCostPerDay > 0 && (
            <div className="flex items-center gap-6 rounded-xl border border-[#f0f0f0] bg-white px-6 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              {personCosts
                .filter(({ cost }) => cost > 0)
                .map(({ person, cost }) => (
                  <Fragment key={person.id}>
                    <div className="text-center">
                      <p className="text-xs text-[#737373]">{person.name}</p>
                      <p className="text-lg font-semibold leading-tight text-[#0a0a0a]">
                        €{cost.toFixed(2)}
                        <span className="text-xs font-normal text-[#737373]">
                          /day
                        </span>
                      </p>
                      <p className="text-xs text-[#737373]">
                        €{(cost * 30).toFixed(2)}/mo
                      </p>
                    </div>
                    <div className="h-8 w-px bg-[#e5e5e5]" />
                  </Fragment>
                ))}
              <div className="text-center">
                <p className="text-xs text-[#737373]">
                  {persons.length > 1 ? "Total" : "Daily"}
                </p>
                <p className="text-lg font-semibold leading-tight text-[#0a0a0a]">
                  €{totalCostPerDay.toFixed(2)}
                  <span className="text-xs font-normal text-[#737373]">
                    /day
                  </span>
                </p>
                <p className="text-xs text-[#737373]">
                  €{(totalCostPerDay * 30).toFixed(2)}/mo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Supplements section */}
        {orderedSupplements.length > 0 && (
          <section>
            <div className="relative mb-10 flex items-center gap-2">
              <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">
                Supplements
              </h2>
              <Dots style={{ top: -6 }} />
            </div>
            <div
              className="grid gap-5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
              }}
            >
              {orderedSupplements.map((s, index) => {
                const pkgUnits: number[] = s.packageUnits
                  ? JSON.parse(s.packageUnits)
                  : Array(s.amountOfPackages).fill(s.amountOfUnits);

                const combinedUnitsPerDay = s.persons
                  .filter((sp) => sp.takingDaily && sp.unitsPerDay)
                  .reduce((sum, sp) => sum + (sp.unitsPerDay ?? 0), 0);

                const totalUnits = pkgUnits.reduce((a, b) => a + b, 0);
                const daysLeft =
                  combinedUnitsPerDay > 0
                    ? Math.floor(totalUnits / combinedUnitsPerDay)
                    : null;
                const isLowStock = daysLeft !== null && daysLeft < 14;

                const isDragging = dragIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={s.id}
                    draggable={reordering}
                    onDragStart={
                      reordering
                        ? (e) => {
                            setDragIndex(index);
                            e.dataTransfer.effectAllowed = "move";
                          }
                        : undefined
                    }
                    onDragOver={
                      reordering
                        ? (e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverIndex !== index)
                              setDragOverIndex(index);
                          }
                        : undefined
                    }
                    onDragLeave={
                      reordering ? () => setDragOverIndex(null) : undefined
                    }
                    onDrop={
                      reordering
                        ? (e) => {
                            e.preventDefault();
                            if (dragIndex === null || dragIndex === index) {
                              setDragIndex(null);
                              setDragOverIndex(null);
                              return;
                            }
                            const next = [...orderedSupplements];
                            const [moved] = next.splice(dragIndex, 1);
                            next.splice(index, 0, moved);
                            setOrderedSupplements(next);
                            setDragIndex(null);
                            setDragOverIndex(null);
                            startReorderTransition(() =>
                              reorderSupplements(next.map((s) => s.id)),
                            );
                          }
                        : undefined
                    }
                    onDragEnd={
                      reordering
                        ? () => {
                            setDragIndex(null);
                            setDragOverIndex(null);
                          }
                        : undefined
                    }
                    className={`group rounded-2xl bg-white transition-all duration-150 ${
                      isLowStock
                        ? "border border-[#f5f5f5] border-l-2 border-l-amber-400"
                        : "border border-[#f5f5f5]"
                    } shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] ${
                      reordering
                        ? "cursor-grab"
                        : "hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)]"
                    } ${isDragging ? "opacity-40" : ""} ${isDragOver ? "ring-2 ring-[#0a0a0a] ring-offset-2" : ""}`}
                  >
                    <div className="p-6">
                      {/* Card header */}
                      <div className="flex items-start gap-3">
                        {/* Drag handle — only visible in reorder mode */}
                        <div
                          className={`mt-1 shrink-0 select-none text-[#a3a3a3] transition-all duration-150 ${
                            reordering
                              ? "opacity-100"
                              : "opacity-0 pointer-events-none"
                          }`}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <circle cx="5" cy="4" r="1.5" />
                            <circle cx="11" cy="4" r="1.5" />
                            <circle cx="5" cy="8" r="1.5" />
                            <circle cx="11" cy="8" r="1.5" />
                            <circle cx="5" cy="12" r="1.5" />
                            <circle cx="11" cy="12" r="1.5" />
                          </svg>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold tracking-[-0.01em] text-[#0a0a0a]">
                                  {s.activeIngredient}
                                </h3>
                                {isLowStock && (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600 ring-1 ring-amber-200">
                                    Low stock
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-sm text-[#737373]">
                                {s.brand} · {s.dosePerUnit} · {s.amountOfUnits}{" "}
                                units · {s.costPerPackage}€/pkg
                                {s.source.startsWith("http") && (
                                  <>
                                    {" · "}
                                    <a
                                      href={s.source}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline-offset-2 transition-opacity hover:underline hover:opacity-70"
                                    >
                                      Reorder ↗
                                    </a>
                                  </>
                                )}
                                {!s.source.startsWith("http") && s.source && (
                                  <> · {s.source}</>
                                )}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <button
                                onClick={() => setEditing(s)}
                                className="text-sm font-medium text-[#737373] transition-colors hover:text-[#0a0a0a]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleting(s.id)}
                                className="text-lg leading-none text-[#d4d4d4] transition-colors hover:text-[#ef4444]"
                                aria-label="Delete supplement"
                              >
                                ×
                              </button>
                            </div>
                          </div>

                          {/* Per-person rows */}
                          <div className="mt-5 flex flex-col gap-4 border-t border-[#f5f5f5] pt-4">
                            {persons.map((person) => {
                              const sp = s.persons.find(
                                (sp) => sp.personId === person.id,
                              );
                              const defaultSp: SupplementPerson = {
                                id: 0,
                                personId: person.id,
                                supplementId: s.id,
                                takingDaily: false,
                                unitsPerDay: null,
                                person,
                              };
                              return (
                                <PersonRow
                                  key={person.id}
                                  sp={sp ?? defaultSp}
                                  costPerUnit={
                                    s.costPerPackage / s.amountOfUnits
                                  }
                                />
                              );
                            })}
                          </div>

                          {/* Progress / package inputs */}
                          <div className="mt-4">
                            <PackageInputs
                              id={s.id}
                              packageUnits={pkgUnits}
                              amountOfUnits={s.amountOfUnits}
                              combinedUnitsPerDay={combinedUnitsPerDay}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      {creating && <NewSupplementModal onClose={() => setCreating(false)} />}
      {editing && (
        <NewSupplementModal
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting !== null && (
        <DeleteConfirmModal id={deleting} onClose={() => setDeleting(null)} />
      )}
      {showCalendar && (
        <CalendarModal
          persons={persons}
          supplements={supplements}
          skippedIntakes={skippedIntakes}
          deductionLogs={allDeductionLogs}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </>
  );
}
