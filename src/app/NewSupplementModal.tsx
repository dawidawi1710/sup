"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createSupplement, updateSupplement } from "./actions";

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
};

type Props = {
  onClose: () => void;
  initial?: Supplement;
};

export default function NewSupplementModal({ onClose, initial }: Props) {
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (initial) {
      await updateSupplement(initial.id, formData);
    } else {
      await createSupplement(formData);
    }
    onClose();
  }

  function handleAttemptClose() {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleAttemptClose}
    >
      {/* Card — stop propagation so clicks inside don't trigger backdrop */}
      <div
        className="w-full max-w-md rounded-[20px] bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-8 text-xl font-semibold tracking-[-0.01em] text-[#0a0a0a]">
          {initial ? "Edit supplement" : "New supplement"}
        </h2>
        <form
          action={handleSubmit}
          className="flex flex-col gap-5"
          onChange={() => setIsDirty(true)}
        >
          <Field label="Active ingredient" name="activeIngredient" type="text" defaultValue={initial?.activeIngredient} required />
          <Field label="Dose per unit" name="dosePerUnit" type="text" defaultValue={initial?.dosePerUnit} required />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Units per package" name="amountOfUnits" type="number" defaultValue={initial?.amountOfUnits?.toString()} required />
            <Field label="Number of packages" name="amountOfPackages" type="number" defaultValue={initial?.amountOfPackages?.toString()} required />
          </div>
          <Field label="Brand" name="brand" type="text" defaultValue={initial?.brand} required />
          <Field label="Source / buy URL" name="source" type="text" defaultValue={initial?.source} placeholder="https://… or store name" required />
          <Field label="Cost per package (€)" name="costPerPackage" type="number" step="0.01" defaultValue={initial?.costPerPackage?.toString()} required />

          <div className="mt-3 flex flex-col gap-3">
            <SubmitButton label={initial ? "Save changes" : "Create supplement"} />
            <button
              type="button"
              onClick={handleAttemptClose}
              className="text-sm text-[#737373] transition-colors hover:text-[#0a0a0a]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Discard confirmation */}
      {showConfirm && (
        <div
          className="absolute inset-0 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-xs rounded-[20px] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.12),0_12px_32px_rgba(0,0,0,0.12)]">
            <h3 className="mb-1 text-base font-semibold text-[#0a0a0a]">Discard changes?</h3>
            <p className="mb-5 text-sm text-[#737373]">You&apos;ve started filling in this form. Your input will be lost.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={onClose}
                className="h-11 w-full rounded-xl bg-[#0a0a0a] text-sm font-semibold text-white transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
              >
                Discard
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm text-[#737373] transition-colors hover:text-[#0a0a0a]"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-13 w-full rounded-xl bg-[#0a0a0a] text-sm font-semibold text-white transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ height: 52 }}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  name,
  type,
  step,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type: string;
  step?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-[#737373]">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="h-12 rounded-lg border border-[#e5e5e5] px-4 text-sm text-[#0a0a0a] transition-colors duration-150 placeholder:text-[#d4d4d4] focus:border-[#0a0a0a] focus:outline-none"
      />
    </label>
  );
}
