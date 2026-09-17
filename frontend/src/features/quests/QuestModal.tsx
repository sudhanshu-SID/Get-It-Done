import React, { useState, useEffect } from 'react';
import { X, Compass, Calendar, HelpCircle } from 'lucide-react';
import { Quest, QuestRepeatInterval, QuestScheduleType } from '../../types/index';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questData: Partial<Quest>) => Promise<void>;
  initialQuest?: Quest | null;
  categories: string[];
}

export const QuestModal: React.FC<QuestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuest,
  categories
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Career');
  const [repeatInterval, setRepeatInterval] = useState<QuestRepeatInterval>('monthly');
  const [scheduleType, setScheduleType] = useState<QuestScheduleType>('flexible');
  const [targetDayOfMonth, setTargetDayOfMonth] = useState<number>(1);
  const [nextDueDate, setNextDueDate] = useState<string>(todayStr);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialQuest) {
      setTitle(initialQuest.title);
      setDescription(initialQuest.description || '');
      setCategory(initialQuest.category || categories[0] || 'Career');
      setRepeatInterval(initialQuest.repeatInterval || 'monthly');
      setScheduleType(initialQuest.scheduleType || 'flexible');
      setTargetDayOfMonth(initialQuest.targetDayOfMonth || 1);
      setNextDueDate(initialQuest.nextDueDate || todayStr);
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories.includes('Career') ? 'Career' : (categories[0] || 'Personal'));
      setRepeatInterval('monthly');
      setScheduleType('flexible');
      setTargetDayOfMonth(new Date().getDate());
      setNextDueDate(todayStr);
    }
  }, [initialQuest, isOpen, categories, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        repeatInterval,
        scheduleType,
        targetDayOfMonth: Number(targetDayOfMonth),
        nextDueDate
      });
      onClose();
    } catch (err) {
      console.error('Failed to save quest:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg border-2 border-[#141414] bg-white p-6 shadow-[4px_4px_0px_0px_#141414]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#141414] pb-3">
          <div className="flex items-center space-x-2">
            <Compass className="h-4 w-4 text-[#141414]" />
            <h2 className="text-base font-mono font-black uppercase tracking-wider text-[#141414]">
              {initialQuest ? 'EDIT QUEST' : 'NEW QUEST'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 font-mono font-bold hover:bg-[#141414] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Quest Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Update Resume & Review Monthly Learnings"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Notes / Checkpoints (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Add newly learned technologies, portfolio projects, or certifications..."
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                {Array.from(new Set(['Career', 'Finance', 'Health', 'Learning', 'Personal', ...categories])).map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Repeat Interval */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                How Often?
              </label>
              <select
                value={repeatInterval}
                onChange={e => setRepeatInterval(e.target.value as QuestRepeatInterval)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                <option value="monthly">Monthly (Every 1 Month)</option>
                <option value="quarterly">Quarterly (Every 3 Months)</option>
                <option value="yearly">Yearly (Every 12 Months)</option>
              </select>
            </div>
          </div>

          {/* Schedule Style */}
          <div className="border border-[#141414] bg-[#f9f9f9] p-3 space-y-2">
            <span className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Schedule Style
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleType('flexible')}
                className={`p-2.5 text-left border cursor-pointer transition-all ${
                  scheduleType === 'flexible'
                    ? 'border-[#141414] bg-[#141414] text-white shadow-[2px_2px_0px_0px_#999]'
                    : 'border-black/20 bg-white text-[#141414] hover:border-black'
                }`}
              >
                <div className="text-xs font-mono font-bold">Flexible Timing</div>
                <div className="text-[10px] opacity-80 mt-0.5">
                  Repeats 1 month after you finish it (great for resume updates)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScheduleType('fixed_date')}
                className={`p-2.5 text-left border cursor-pointer transition-all ${
                  scheduleType === 'fixed_date'
                    ? 'border-[#141414] bg-[#141414] text-white shadow-[2px_2px_0px_0px_#999]'
                    : 'border-black/20 bg-white text-[#141414] hover:border-black'
                }`}
              >
                <div className="text-xs font-mono font-bold">Exact Day of Month</div>
                <div className="text-[10px] opacity-80 mt-0.5">
                  Always due on a specific calendar day (bills, finances, doctor)
                </div>
              </button>
            </div>

            {scheduleType === 'fixed_date' && (
              <div className="pt-2 flex items-center gap-3">
                <label className="text-xs font-mono font-bold text-[#141414]">
                  Day of the Month:
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={targetDayOfMonth}
                  onChange={e => setTargetDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)))}
                  className="w-20 border border-[#141414] bg-white px-2 py-1 text-xs font-mono font-bold text-[#141414] focus:outline-none"
                />
                <span className="text-[10px] font-mono opacity-60">
                  (e.g., 5th of every month)
                </span>
              </div>
            )}
          </div>

          {/* First Due Date */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              First Due Date
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-[#141414]" />
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={e => setNextDueDate(e.target.value)}
                className="w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono text-[#141414] focus:outline-none"
              />
            </div>
          </div>

          {/* Friendly Note */}
          <div className="flex items-start space-x-2 border border-blue-900/20 bg-blue-50/50 p-2 text-[11px] font-mono text-blue-950">
            <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-700" />
            <span>
              Quests appear right in your Today view on their due date. They are non-punitive reminders that <strong>never break your streak</strong> or cause strikes.
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 border-t border-[#141414] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#141414] px-4 py-1.5 text-xs font-mono font-bold uppercase text-[#141414] hover:bg-neutral-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#141414] px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-black cursor-pointer shadow-[2px_2px_0px_0px_#666]"
            >
              {isSubmitting ? 'SAVING...' : initialQuest ? 'UPDATE QUEST' : 'CREATE QUEST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
