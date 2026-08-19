import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-lg border border-[#262b32] bg-[#121417] p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            {isDestructive && (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-red-950/40 border border-red-800/40 text-red-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-[#1a1d21] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-neutral-300">{description}</p>

        <div className="mt-6 flex items-center justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="rounded border border-[#2d3238] bg-[#17191d] px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:bg-[#202328] hover:text-white"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded px-4 py-1.5 text-xs font-medium text-white shadow-xs ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
