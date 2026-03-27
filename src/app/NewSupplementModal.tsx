"use client";

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
  async function handleSubmit(formData: FormData) {
    if (initial) {
      await updateSupplement(initial.id, formData);
    } else {
      await createSupplement(formData);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">{initial ? "Edit Supplement" : "New Supplement"}</h2>
        <form action={handleSubmit} className="flex flex-col gap-3">
          <Field label="Active ingredient" name="activeIngredient" type="text" defaultValue={initial?.activeIngredient} required />
          <Field label="Dose per unit" name="dosePerUnit" type="text" defaultValue={initial?.dosePerUnit} required />
          <Field label="Amount of units" name="amountOfUnits" type="number" defaultValue={initial?.amountOfUnits?.toString()} required />
          <Field label="Amount of packages" name="amountOfPackages" type="number" defaultValue={initial?.amountOfPackages?.toString()} required />
          <Field label="Brand" name="brand" type="text" defaultValue={initial?.brand} required />
          <Field label="Source / buy URL" name="source" type="text" defaultValue={initial?.source} placeholder="https://… or store name" required />
          <Field label="Cost per package" name="costPerPackage" type="number" step="0.01" defaultValue={initial?.costPerPackage?.toString()} required />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              {initial ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="rounded-md border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}
