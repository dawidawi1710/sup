"use client";

import { useState, useTransition } from "react";
import { skipIntake, unskipIntake } from "./actions";

type Person = { id: number; name: string };

type SupplementPerson = {
  personId: number;
  takingDaily: boolean;
  unitsPerDay: number | null;
  startDate: string | null;
};

type Supplement = {
  id: number;
  activeIngredient: string;
  dosePerUnit: string;
  persons: SupplementPerson[];
};

type SkippedIntake = { date: string; personId: number; supplementId: number };

type Props = {
  persons: Person[];
  supplements: Supplement[];
  skippedIntakes: SkippedIntake[];
  onClose: () => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return localDateKey(a) === localDateKey(b);
}

function formatDailyDose(dosePerUnit: string, unitsPerDay: number): string {
  const m = dosePerUnit.match(/^([\d.]+)\s*(.+)$/);
  return m ? `${parseFloat(m[1]) * unitsPerDay} ${m[2]}` : `${unitsPerDay} × ${dosePerUnit}`;
}

function scheduledItems(
  person: Person,
  supplements: Supplement[],
  date: Date,
  skippedIntakes: SkippedIntake[],
) {
  const dateKey = localDateKey(date);
  return supplements.flatMap((s) => {
    const sp = s.persons.find((sp) => sp.personId === person.id);
    if (!sp?.takingDaily || !sp.unitsPerDay) return [];
    if (sp.startDate && dateKey < sp.startDate.split("T")[0]) return [];
    const isSkipped = skippedIntakes.some(
      (si) => si.date === dateKey && si.personId === person.id && si.supplementId === s.id,
    );
    return [{ supplement: s, unitsPerDay: sp.unitsPerDay, isSkipped }];
  });
}

export default function CalendarModal({ persons, supplements, skippedIntakes, onClose }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date>(today);
  const [, startTransition] = useTransition();

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // Monday-first grid
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Dot state per day: none | partial | all-skipped | active
  function dayDotState(date: Date): "none" | "active" | "partial" | "skipped" {
    const dateKey = localDateKey(date);
    let total = 0;
    let skipped = 0;
    for (const person of persons) {
      for (const s of supplements) {
        const sp = s.persons.find((sp) => sp.personId === person.id);
        if (!sp?.takingDaily || !sp.unitsPerDay) continue;
        if (sp.startDate && dateKey < sp.startDate.split("T")[0]) continue;
        total++;
        if (skippedIntakes.some((si) => si.date === dateKey && si.personId === person.id && si.supplementId === s.id)) {
          skipped++;
        }
      }
    }
    if (total === 0) return "none";
    if (skipped === 0) return "active";
    if (skipped === total) return "skipped";
    return "partial";
  }

  const selectedKey = localDateKey(selected);
  const personRows = persons
    .map((p) => ({ person: p, items: scheduledItems(p, supplements, selected, skippedIntakes) }))
    .filter(({ items }) => items.length > 0);

  function handleToggle(personId: number, supplementId: number, isSkipped: boolean) {
    startTransition(() => {
      if (isSkipped) unskipIntake(selectedKey, personId, supplementId);
      else skipIntake(selectedKey, personId, supplementId);
    });
  }

  function handleSkipAll(personId: number, items: ReturnType<typeof scheduledItems>) {
    startTransition(() => {
      for (const { supplement } of items.filter((i) => !i.isSkipped)) {
        skipIntake(selectedKey, personId, supplement.id);
      }
    });
  }

  function handleRestoreAll(personId: number, items: ReturnType<typeof scheduledItems>) {
    startTransition(() => {
      for (const { supplement } of items.filter((i) => i.isSkipped)) {
        unskipIntake(selectedKey, personId, supplement.id);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">Supplement calendar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex divide-x">

          {/* Calendar */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg">‹</button>
              <span className="text-sm font-semibold">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-lg">›</button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((date, i) => {
                if (!date) return <div key={i} />;
                const isToday = sameDay(date, today);
                const isSel = sameDay(date, selected);
                const dot = dayDotState(date);
                const dotColor =
                  dot === "active" ? "bg-green-400" :
                  dot === "partial" ? "bg-amber-400" :
                  dot === "skipped" ? "bg-gray-300" : "";
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(date)}
                    className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                      isSel
                        ? "bg-blue-600 text-white font-medium"
                        : isToday
                        ? "text-blue-600 font-semibold hover:bg-blue-50"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {date.getDate()}
                    {dot !== "none" && !isSel && (
                      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${dotColor}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-400" /> Taken</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Partially skipped</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gray-300" /> All skipped</span>
            </div>
          </div>

          {/* Day detail */}
          <div className="w-64 p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {selected.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </p>

            {personRows.length === 0 ? (
              <p className="text-xs text-gray-400">No supplements scheduled for this day.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {personRows.map(({ person, items }) => {
                  const allSkipped = items.every((i) => i.isSkipped);
                  const anySkipped = items.some((i) => i.isSkipped);
                  return (
                    <div key={person.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700">{person.name}</p>
                        <button
                          onClick={() => allSkipped || !anySkipped
                            ? allSkipped ? handleRestoreAll(person.id, items) : handleSkipAll(person.id, items)
                            : handleSkipAll(person.id, items)
                          }
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          {allSkipped ? "Restore all" : "Skip all"}
                        </button>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {items.map(({ supplement, unitsPerDay, isSkipped }) => (
                          <li key={supplement.id} className="flex items-start justify-between gap-2">
                            <div className={isSkipped ? "opacity-40 line-through" : ""}>
                              <p className="text-xs font-medium text-gray-800 leading-tight">{supplement.activeIngredient}</p>
                              <p className="text-xs text-gray-400">{formatDailyDose(supplement.dosePerUnit, unitsPerDay)}</p>
                            </div>
                            <button
                              onClick={() => handleToggle(person.id, supplement.id, isSkipped)}
                              title={isSkipped ? "Mark as taken" : "Mark as skipped"}
                              className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs transition-colors ${
                                isSkipped
                                  ? "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600"
                                  : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"
                              }`}
                            >
                              {isSkipped ? "↩" : "×"}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
