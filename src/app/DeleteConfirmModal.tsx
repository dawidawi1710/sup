"use client";

import { deleteSupplement } from "./actions";

type Props = {
  id: number;
  onClose: () => void;
};

export default function DeleteConfirmModal({ id, onClose }: Props) {
  async function handleDelete() {
    await deleteSupplement(id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold">Are you sure?</h2>
        <p className="mb-6 text-sm text-gray-500">This supplement will be permanently deleted.</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
