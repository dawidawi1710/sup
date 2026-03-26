"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import NewSupplementModal from "./NewSupplementModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import CalendarModal from "./CalendarModal";
import {
  updateSupplementPerson,
  setAllTakingDaily,
  updatePackageUnits,
  createPerson,
  deletePerson,
  renamePerson,
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
  startDate: string | null;
  createdAt: string;
  persons: SupplementPerson[];
};

type SkippedIntake = { date: string; personId: number; supplementId: number };

// ── PersonToggle ──────────────────────────────────────────────────────────────

function PersonToggle({
  personId, supplementId, value,
}: {
  personId: number; supplementId: number; value: boolean;
}) {
  const [optimistic, setOptimistic] = useState(value);
  const [, startTransition] = useTransition();

  useEffect(() => { setOptimistic(value); }, [value]);

  function handleToggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(() => updateSupplementPerson(personId, supplementId, { takingDaily: next }));
  }

  return (
    <button
      onClick={handleToggle}
      aria-label="Toggle taking daily"
      className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        optimistic ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
        optimistic ? "translate-x-3.5" : "translate-x-0.5"
      }`} />
    </button>
  );
}

// ── PersonRow ─────────────────────────────────────────────────────────────────

function PersonRow({
  sp, costPerUnit,
}: {
  sp: SupplementPerson; costPerUnit: number;
}) {
  const [display, setDisplay] = useState(sp.unitsPerDay?.toString() ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => { setDisplay(sp.unitsPerDay?.toString() ?? ""); }, [sp.unitsPerDay]);

  function save() {
    const val = display === "" ? null : Math.max(0, parseInt(display) || 0);
    const coerced = val === null ? "" : String(val);
    setDisplay(coerced);
    startTransition(() =>
      updateSupplementPerson(sp.personId, sp.supplementId, { unitsPerDay: val })
    );
  }

  const costPerDay = sp.takingDaily && sp.unitsPerDay
    ? costPerUnit * sp.unitsPerDay
    : null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <PersonToggle personId={sp.personId} supplementId={sp.supplementId} value={sp.takingDaily} />
      <span className={`w-20 truncate ${sp.takingDaily ? "text-gray-800 font-medium" : "text-gray-400"}`}>
        {sp.person.name}
      </span>
      <input
        type="number"
        min={0}
        value={display}
        placeholder="—"
        onChange={(e) => setDisplay(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className={`w-14 rounded border px-1.5 py-0.5 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
          sp.takingDaily ? "border-gray-300 text-gray-800" : "border-gray-200 text-gray-400"
        }`}
      />
      <span className={`text-xs ${sp.takingDaily ? "text-gray-400" : "text-gray-300"}`}>units/day</span>
      {costPerDay != null && (
        <span className="ml-auto text-gray-500">{costPerDay.toFixed(2)}€/day</span>
      )}
    </div>
  );
}

// ── PackageInputs ─────────────────────────────────────────────────────────────

function applyDailyDeduction(
  storedUnits: number[],
  startDate: string | null,
  totalDailyUnits: number,
  skippedUnits: number,
): number[] {
  if (!startDate || totalDailyUnits <= 0) return storedUnits;
  const now = new Date();
  const cutoff = new Date(startDate);
  cutoff.setHours(22, 0, 0, 0);
  if (now <= cutoff) return storedUnits;
  const daysDeducted = Math.floor((now.getTime() - cutoff.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  let toDeduct = Math.max(0, daysDeducted * totalDailyUnits - skippedUnits);
  return storedUnits.map((units) => {
    if (toDeduct <= 0) return units;
    const taken = Math.min(toDeduct, units);
    toDeduct -= taken;
    return units - taken;
  });
}

function PackageInputs({
  id, packageUnits, amountOfUnits, combinedUnitsPerDay, startDate, skippedUnits,
}: {
  id: number; packageUnits: number[]; amountOfUnits: number; combinedUnitsPerDay: number; startDate: string | null; skippedUnits: number;
}) {
  const computed = applyDailyDeduction(packageUnits, startDate, combinedUnitsPerDay, skippedUnits);
  const [display, setDisplay] = useState(computed.map(String));
  const [, startTransition] = useTransition();

  useEffect(() => {
    setDisplay(applyDailyDeduction(packageUnits, startDate, combinedUnitsPerDay, skippedUnits).map(String));
  }, [packageUnits, startDate, combinedUnitsPerDay, skippedUnits]);

  function handleChange(i: number, raw: string) {
    setDisplay(display.map((v, idx) => (idx === i ? raw : v)));
  }

  function handleBlur(i: number) {
    const coerced = display.map((v, idx) => {
      if (idx !== i) return v;
      return String(Math.max(0, Math.min(parseInt(v) || 0, amountOfUnits)));
    });
    setDisplay(coerced);
    startTransition(() => updatePackageUnits(id, coerced.map((v) => parseInt(v) || 0)));
  }

  const values = display.map((v) => parseInt(v) || 0);
  const total = values.reduce((a, b) => a + b, 0);
  const maxTotal = amountOfUnits * packageUnits.length;
  const daysLeft = combinedUnitsPerDay > 0 ? Math.floor(total / combinedUnitsPerDay) : null;
  const pct = daysLeft != null
    ? Math.min(daysLeft / 30, 1)
    : maxTotal > 0 ? Math.min(total / maxTotal, 1) : 0;
  const barColor = pct > 0.5 ? "bg-green-400" : pct > 0.2 ? "bg-yellow-400" : "bg-red-400";
  const barWidth = pct === 0 ? "100%" : `${pct * 100}%`;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {display.map((v, i) => (
          <div key={i} className="flex items-center gap-1 text-xs text-gray-500">
            {display.length > 1 && <span className="w-8">Pkg {i + 1}:</span>}
            {display.length === 1 && <span>Units left:</span>}
            <input
              type="number"
              min={0}
              max={amountOfUnits}
              value={v}
              onChange={(e) => handleChange(i, e.target.value)}
              onBlur={() => handleBlur(i)}
              onKeyDown={(e) => e.key === "Enter" && handleBlur(i)}
              className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <span className="text-gray-400">/ {amountOfUnits}</span>
            {display.length > 1 && (
              <button
                onClick={() => {
                  const nextDisplay = display.filter((_, idx) => idx !== i);
                  setDisplay(nextDisplay);
                  startTransition(() =>
                    updatePackageUnits(id, nextDisplay.map((v) => parseInt(v) || 0))
                  );
                }}
                className="ml-1 text-gray-300 hover:text-red-400"
                aria-label={`Delete package ${i + 1}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {display.length > 1 && <span className="text-xs text-gray-400">= {total} units</span>}
        {daysLeft != null && (
          <span className="text-xs font-medium text-gray-600">{daysLeft} days left</span>
        )}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-b-lg bg-gray-200">
        <div className={`h-full transition-all ${barColor}`} style={{ width: barWidth }} />
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

function PersonManager({ persons, supplements }: { persons: Person[]; supplements: Supplement[] }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  function handleAdd() {
    const name = newName.trim();
    if (!name) { setAdding(false); return; }
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
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">People:</span>
      {persons.map((p) =>
        editingId === p.id ? (
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
            className="w-24 rounded border border-blue-400 px-2 py-0.5 text-xs focus:outline-none"
          />
        ) : (
          <span
            key={p.id}
            className="group flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
          >
            <button
              onClick={() => { setEditingId(p.id); setEditName(p.name); }}
              className="hover:text-gray-900"
            >
              {p.name}
            </button>
            <button
              onClick={() => downloadIntakeFile(p, supplements)}
              className="text-gray-300 hover:text-blue-400"
              aria-label={`Download intake report for ${p.name}`}
              title="Download intake report"
            >
              ↓
            </button>
            {persons.length > 1 && (
              <button
                onClick={() => setDeletingId(p.id)}
                className="text-gray-300 hover:text-red-400"
                aria-label={`Delete ${p.name}`}
              >
                ×
              </button>
            )}
          </span>
        )
      )}
      {adding ? (
        <input
          ref={inputRef}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleAdd}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") { setAdding(false); setNewName(""); }
          }}
          placeholder="Name…"
          className="w-24 rounded border border-blue-400 px-2 py-0.5 text-xs focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600"
        >
          + Add person
        </button>
      )}

      {deletingId !== null && (() => {
        const person = persons.find((p) => p.id === deletingId)!;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-2 text-lg font-semibold">Delete {person.name}?</h2>
              <p className="mb-6 text-sm text-gray-500">
                This will permanently remove {person.name} and all their supplement associations.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingId(null);
                    startTransition(() => deletePerson(deletingId));
                  }}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  Delete
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
  persons,
  supplements,
  skippedIntakes,
}: {
  persons: Person[];
  supplements: Supplement[];
  skippedIntakes: SkippedIntake[];
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Supplement | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Per-person daily cost
  const personCosts = persons.map((person) => {
    const cost = supplements.reduce((sum, s) => {
      const sp = s.persons.find((sp) => sp.personId === person.id);
      if (!sp?.takingDaily || !sp.unitsPerDay) return sum;
      return sum + (s.costPerPackage / s.amountOfUnits) * sp.unitsPerDay;
    }, 0);
    return { person, cost };
  });
  const totalCostPerDay = personCosts.reduce((sum, { cost }) => sum + cost, 0);

  const allTakingDaily = supplements.length > 0 &&
    supplements.every((s) => s.persons.every((sp) => sp.takingDaily));

  return (
    <>
      {/* Top bar */}
      <div className="flex w-full max-w-2xl flex-col gap-3">
        <PersonManager persons={persons} supplements={supplements} />

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setCreating(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              New supplement
            </button>
            {supplements.length > 0 && (
              <button
                onClick={() => setAllTakingDaily(!allTakingDaily)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                {allTakingDaily ? "Deselect all" : "Select all"}
              </button>
            )}
            <button
              onClick={() => setShowCalendar(true)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Calendar
            </button>
          </div>

          {totalCostPerDay > 0 && (
            <div className="text-right text-xs">
              <div className="mb-1 flex justify-end gap-4 text-gray-400 font-medium uppercase tracking-wide">
                <span>/ day</span>
                <span>/ 30 days</span>
              </div>
              {personCosts.filter(({ cost }) => cost > 0).map(({ person, cost }) => (
                <div key={person.id} className="flex justify-between gap-4 text-gray-500">
                  <span className="font-medium text-gray-700">{person.name}</span>
                  <span className="flex gap-4">
                    <span className="w-16 text-right">{cost.toFixed(2)}€</span>
                    <span className="w-16 text-right">{(cost * 30).toFixed(2)}€</span>
                  </span>
                </div>
              ))}
              {persons.length > 1 && (
                <div className="flex justify-between gap-4 font-medium text-gray-800 border-t border-gray-200 mt-1 pt-1">
                  <span>Total</span>
                  <span className="flex gap-4">
                    <span className="w-16 text-right">{totalCostPerDay.toFixed(2)}€</span>
                    <span className="w-16 text-right">{(totalCostPerDay * 30).toFixed(2)}€</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {creating && <NewSupplementModal onClose={() => setCreating(false)} />}
      {editing && <NewSupplementModal initial={editing} onClose={() => setEditing(null)} />}
      {deleting !== null && <DeleteConfirmModal id={deleting} onClose={() => setDeleting(null)} />}
      {showCalendar && (
        <CalendarModal
          persons={persons}
          supplements={supplements}
          skippedIntakes={skippedIntakes}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {supplements.length > 0 && (
        <section className="mt-6 w-full max-w-2xl">
          <h2 className="mb-3 text-lg font-semibold">Existing supplements</h2>
          <div className="flex flex-col gap-3">
            {supplements.map((s) => {
              const pkgUnits: number[] = s.packageUnits
                ? JSON.parse(s.packageUnits)
                : Array(s.amountOfPackages).fill(s.amountOfUnits);

              const combinedUnitsPerDay = s.persons
                .filter((sp) => sp.takingDaily && sp.unitsPerDay)
                .reduce((sum, sp) => sum + (sp.unitsPerDay ?? 0), 0);

              const anyTakingDaily = s.persons.some((sp) => sp.takingDaily);

              // Sum of units not taken on skipped days for this supplement
              const startKey = s.startDate ? s.startDate.split("T")[0] : null;
              const todayKey = new Date().toISOString().split("T")[0];
              const skippedUnits = startKey
                ? skippedIntakes
                    .filter((si) => si.supplementId === s.id && si.date >= startKey && si.date <= todayKey)
                    .reduce((sum, si) => {
                      const sp = s.persons.find((p) => p.personId === si.personId);
                      return sum + (sp?.unitsPerDay ?? 0);
                    }, 0)
                : 0;

              return (
                <div
                  key={s.id}
                  className={`rounded-lg border text-sm transition-colors ${
                    anyTakingDaily ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 p-4 pb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{s.activeIngredient} — {s.brand}</p>
                      <p className="text-gray-600">
                        {s.dosePerUnit} · {s.amountOfUnits} units · {s.amountOfPackages} pkg · {s.costPerPackage}€/pkg
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {s.source.startsWith("http") ? (
                          <a
                            href={s.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline hover:text-blue-600"
                          >
                            Reorder ↗
                          </a>
                        ) : (
                          <>Source: {s.source}</>
                        )}
                      </p>

                      {/* Per-person rows */}
                      <div className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-2">
                        {persons.map((person) => {
                          const sp = s.persons.find((sp) => sp.personId === person.id);
                          const defaultSp: SupplementPerson = {
                            id: 0, personId: person.id, supplementId: s.id,
                            takingDaily: false, unitsPerDay: null, person,
                          };
                          return (
                            <PersonRow
                              key={person.id}
                              sp={sp ?? defaultSp}
                              costPerUnit={s.costPerPackage / s.amountOfUnits}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setEditing(s)}
                        className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(s.id)}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="px-4 pb-0">
                    <PackageInputs
                      id={s.id}
                      packageUnits={pkgUnits}
                      amountOfUnits={s.amountOfUnits}
                      combinedUnitsPerDay={combinedUnitsPerDay}
                      startDate={s.startDate}
                      skippedUnits={skippedUnits}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
