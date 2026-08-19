import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { Task } from '../../types/index';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onReschedule: (taskId: string, newDate: string, notes?: string) => Promise<void>;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  task,
  onReschedule
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultNextDate = tomorrow.toISOString().split('T')[0];

  const [newDate, setNewDate] = useState(defaultNextDate);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    setIsSubmitting(true);
    try {
      await onReschedule(task._id, newDate, reason.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md border-2 border-[#141414] bg-white text-[#141414] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-[#141414]" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider">Reschedule Commitment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 font-mono font-bold hover:bg-[#141414] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 border border-[#141414] bg-[#E4E3E0] p-3 text-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
            COMMITMENT TARGET
          </span>
          <p className="mt-0.5 font-bold text-[#141414]">{task.title}</p>
          <div className="mt-2 flex items-center space-x-3 text-[10px] font-mono opacity-80">
            <span>CURRENT: {task.scheduledDate}</span>
            {task.rescheduleCount && task.rescheduleCount > 0 ? (
              <span className="font-bold text-amber-700">
                (RESCHEDULED {task.rescheduleCount}X)
              </span>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              New Scheduled Date
            </label>
            <input
              type="date"
              required
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Accountability Reason (Optional Note)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Why is this commitment being pushed? (e.g. Blocked on review, reprioritized for exam)"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t-2 border-[#141414]">
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-[#141414] bg-transparent px-3.5 py-1.5 text-xs font-mono font-bold uppercase text-[#141414] hover:bg-neutral-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="border-2 border-[#141414] bg-[#141414] px-4 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
