"use client";

import { useState, useTransition, useEffect } from "react";
import NewSupplementModal from "./NewSupplementModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { setTakingDaily, setAllTakingDaily, updatePackageUnits } from "./actions";

type Supplement = {
  id: number;
  activeIngredient: string;
  dosePerUnit: string;
  amountOfUnits: number;
  amountOfPackages: number;
  brand: string;
  source: string;
  costPerPackage: number;
  unitsPerDay: number | null;
  unitsLeft: number | null;
  packageUnits: string | null;
  takingDaily: boolean;
};

function Toggle({ id, value }: { id: number; value: boolean }) {
  const [optimistic, setOptimistic] = useState(value);
  const [, startTransition] = useTransition();

  useEffect(() => { setOptimistic(value); }, [value]);

  function handleToggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(() => setTakingDaily(id, next));
  }

  return (
    <button
      onClick={handleToggle}
      aria-label="Toggle taking daily"
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        optimistic ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        optimistic ? "translate-x-4" : "translate-x-0.5"
      }`} />
    </button>
  );
}

function PackageInputs({
  id, packageUnits, amountOfUnits, unitsPerDay,
}: {
  id: number;
  packageUnits: number[];
  amountOfUnits: number;
  unitsPerDay: number | null;
}) {
  const [values, setValues] = useState(packageUnits);
  const [, startTransition] = useTransition();

  useEffect(() => { setValues(packageUnits); }, [packageUnits]);

  function handleChange(i: number, raw: string) {
    const n = Math.max(0, Math.min(parseInt(raw) || 0, amountOfUnits));
    const next = values.map((v, idx) => (idx === i ? n : v));
    setValues(next);
  }

  function save() {
    startTransition(() => updatePackageUnits(id, values));
  }

  const total = values.reduce((a, b) => a + b, 0);
  const maxTotal = amountOfUnits * packageUnits.length;
  const pct = maxTotal > 0 ? Math.min(total / maxTotal, 1) : 0;
  const barColor = pct > 0.5 ? "bg-green-400" : pct > 0.2 ? "bg-yellow-400" : "bg-red-400";
  const daysLeft = unitsPerDay && unitsPerDay > 0 ? Math.floor(total / unitsPerDay) : null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {values.map((v, i) => (
          <label key={i} className="flex items-center gap-1 text-xs text-gray-500">
            {values.length > 1 && <span className="w-8">Pkg {i + 1}:</span>}
            {values.length === 1 && <span>Units left:</span>}
            <input
              type="number"
              min={0}
              max={amountOfUnits}
              value={v}
              onChange={(e) => handleChange(i, e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <span className="text-gray-400">/ {amountOfUnits}</span>
          </label>
        ))}
        {values.length > 1 && (
          <span className="text-xs text-gray-400">= {total} units</span>
        )}
        {daysLeft != null && (
          <span className="text-xs font-medium text-gray-600">{daysLeft} days left</span>
        )}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-b-lg bg-gray-200">
        <div className={`h-full transition-all ${barColor}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

export default function SupplementsClient({ supplements }: { supplements: Supplement[] }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Supplement | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const daily = supplements.filter((s) => s.takingDaily);
  const allSelected = supplements.length > 0 && daily.length === supplements.length;
  const totalCostPerDay = daily.reduce((sum, s) => {
    if (s.unitsPerDay == null) return sum;
    return sum + (s.costPerPackage / s.amountOfUnits) * s.unitsPerDay;
  }, 0);

  return (
    <>
      <div className="flex w-full max-w-2xl items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            New supplement
          </button>
          {supplements.length > 0 && (
            <button
              onClick={() => setAllTakingDaily(!allSelected)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          )}
        </div>

        {daily.length > 0 && (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{daily.length}</span> taken daily
            {totalCostPerDay > 0 && (
              <> · <span className="font-medium text-gray-800">{totalCostPerDay.toFixed(2)}€</span>/day</>
            )}
          </p>
        )}
      </div>

      {creating && <NewSupplementModal onClose={() => setCreating(false)} />}
      {editing && <NewSupplementModal initial={editing} onClose={() => setEditing(null)} />}
      {deleting !== null && <DeleteConfirmModal id={deleting} onClose={() => setDeleting(null)} />}

      {supplements.length > 0 && (
        <section className="mt-6 w-full max-w-2xl">
          <h2 className="mb-3 text-lg font-semibold">Existing supplements</h2>
          <div className="flex flex-col gap-3">
            {supplements.map((s) => {
              const pkgUnits: number[] = s.packageUnits
                ? JSON.parse(s.packageUnits)
                : Array(s.amountOfPackages).fill(s.amountOfUnits);

              return (
                <div
                  key={s.id}
                  className={`rounded-lg border text-sm transition-colors ${
                    s.takingDaily ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 p-4 pb-2">
                    <div className="flex items-start gap-3">
                      <Toggle id={s.id} value={s.takingDaily} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{s.activeIngredient} — {s.brand}</p>
                        <p className="text-gray-600">{s.dosePerUnit} · {s.amountOfUnits} units · {s.amountOfPackages} pkg · {s.costPerPackage}€/pkg</p>
                        {s.unitsPerDay != null && (
                          <p className="text-gray-600">
                            {s.unitsPerDay} units/day · {(s.costPerPackage / s.amountOfUnits * s.unitsPerDay).toFixed(2)}€/day
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">Source: {s.source}</p>
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
                      unitsPerDay={s.unitsPerDay}
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
