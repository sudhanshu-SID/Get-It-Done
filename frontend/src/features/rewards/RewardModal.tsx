import React, { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import { Reward, RewardStatus, Goal } from '../../types/index';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Reward>) => Promise<void>;
  initialReward?: Reward | null;
  goals: Goal[];
}

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialReward,
  goals
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirement, setRequirement] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<RewardStatus>('locked');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialReward) {
      setTitle(initialReward.title);
      setDescription(initialReward.description);
      setRequirement(initialReward.requirement);
      setLinkedGoalId(initialReward.linkedGoalId || '');
      setValue(initialReward.value);
      setStatus(initialReward.status);
    } else {
      setTitle('');
      setDescription('');
      setRequirement('');
      setLinkedGoalId('');
      setValue('');
      setStatus('locked');
    }
  }, [initialReward, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        requirement: requirement.trim(),
        linkedGoalId: linkedGoalId || undefined,
        value: value.trim() || 'Reward',
        status
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg border-2 border-[#141414] bg-white text-[#141414] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-4">
          <div className="flex items-center space-x-2">
            <Gift className="h-4 w-4 text-[#141414]" />
            <h2 className="text-base font-mono font-black uppercase tracking-wider text-[#141414]">
              {initialReward ? 'EDIT REWARD CRITERIA' : 'NEW REWARD UNLOCK'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 font-mono font-bold hover:bg-[#141414] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Reward Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Dinner at Japanese Izakaya"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Reward Item / Value
            </label>
            <input
              type="text"
              required
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="e.g. Restaurant Meal / Gaming Weekend / Keychron Keyboard"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Unlock Requirement
            </label>
            <input
              type="text"
              required
              value={requirement}
              onChange={e => setRequirement(e.target.value)}
              placeholder="e.g. Maintain 15-day DSA & Dev commitment streak"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Linked Goal (Optional)
              </label>
              <select
                value={linkedGoalId}
                onChange={e => setLinkedGoalId(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                <option value="">None (Independent Streak)</option>
                {goals.map(g => (
                  <option key={g._id} value={g._id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Initial State
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as RewardStatus)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                <option value="locked">Locked (In Progress)</option>
                <option value="unlocked">Unlocked (Earned)</option>
                <option value="redeemed">Redeemed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Description / Celebration Note
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Guilt-free reward to enjoy once milestones are legitimately completed."
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t-2 border-[#141414]">
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-[#141414] bg-transparent px-4 py-1.5 text-xs font-mono font-bold uppercase text-[#141414] hover:bg-neutral-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="border-2 border-[#141414] bg-[#141414] px-4 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : initialReward ? 'Update Reward' : 'Create Reward'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
