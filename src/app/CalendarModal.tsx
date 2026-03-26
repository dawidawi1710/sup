"use client";

import { useState } from "react";

type Person = { id: number; name: string };

type SupplementPerson = {
  personId: number;
  takingDaily: boolean;
  unitsPerDay: number | null;
};

type Supplement = {
  id: number;
  activeIngredient: string;
  dosePerUnit: string;
  startDate: string | null;
  persons: SupplementPerson[];
};

type Props = {
  persons: Person[];
  supplements: Supplement[];
  onClose: () => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function intakeForPersonOnDay(
  person: Person,
  supplements: Supplement[],
  date: Date
): { id: number; activeIngredient: string; dosePerUnit: string; unitsPerDay: number }[] {
  const result = [];
  for (const s of supplements) {
    const sp = s.persons.find((sp) => sp.personId === person.id);
    if (!sp?.takingDaily || !sp.unitsPerDay) continue;
    if (!s.startDate) continue;
    const start = new Date(s.startDate);
    start.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d >= start) {
      result.push({
        id: s.id,
        activeIngredient: s.activeIngredient,
        dosePerUnit: s.dosePerUnit,
        unitsPerDay: sp.unitsPerDay,
      });
    }
  }
  return result;
}

function hasAnyIntake(persons: Person[], supplements: Supplement[], date: Date) {
  return persons.some((p) => intakeForPersonOnDay(p, supplements, date).length > 0);
}

function formatDailyDose(dosePerUnit: string, unitsPerDay: number): string {
  const m = dosePerUnit.match(/^([\d.]+)\s*(.+)$/);
  return m ? `${parseFloat(m[1]) * unitsPerDay} ${m[2]}` : `${unitsPerDay} × ${dosePerUnit}`;
}

export default function CalendarModal({ persons, supplements, onClose }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date>(today);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // Build Monday-first grid
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedIntake = persons
    .map((p) => ({ person: p, items: intakeForPersonOnDay(p, supplements, selected) }))
    .filter(({ items }) => items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">Supplement calendar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <div className="flex gap-0 divide-x">

          {/* Calendar */}
          <div className="flex-1 p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500">‹</button>
              <span className="text-sm font-medium">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500">›</button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((date, i) => {
                if (!date) return <div key={i} />;
                const isToday = sameDay(date, today);
                const isSel = sameDay(date, selected);
                const hasIntake = hasAnyIntake(persons, supplements, date);
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(date)}
                    className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                      isSel
                        ? "bg-blue-600 text-white font-medium"
                        : isToday
                        ? "text-blue-600 font-semibold hover:bg-blue-50"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {date.getDate()}
                    {hasIntake && !isSel && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-green-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day detail */}
          <div className="w-52 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              {selected.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>

            {selectedIntake.length === 0 ? (
              <p className="text-xs text-gray-400">No supplements tracked for this day.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedIntake.map(({ person, items }) => (
                  <div key={person.id}>
                    <p className="mb-1.5 text-xs font-semibold text-gray-700">{person.name}</p>
                    <ul className="flex flex-col gap-1">
                      {items.map((item) => (
                        <li key={item.id} className="flex flex-col text-xs">
                          <span className="font-medium text-gray-800">{item.activeIngredient}</span>
                          <span className="text-gray-400">{formatDailyDose(item.dosePerUnit, item.unitsPerDay)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
