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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-[20px] bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.08)]">
        <h2 className="mb-2 text-lg font-semibold text-[#0a0a0a]">Delete supplement?</h2>
        <p className="mb-8 text-sm text-[#737373]">This supplement will be permanently deleted.</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="w-full rounded-xl bg-[#ef4444] text-sm font-semibold text-white transition-shadow hover:shadow-[0_4px_12px_rgba(239,68,68,0.25)]"
            style={{ height: 52 }}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[#737373] transition-colors hover:text-[#0a0a0a]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
