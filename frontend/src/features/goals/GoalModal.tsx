import React, { useState, useEffect } from 'react';
import { X, Target } from 'lucide-react';
import { Goal, GoalType } from '../../types/index';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Partial<Goal>) => Promise<void>;
  initialGoal?: Goal | null;
  categories: string[];
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGoal,
  categories
}) => {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const defaultEndDate = nextMonth.toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>('task_count');
  const [targetValue, setTargetValue] = useState(30);
  const [currentValue, setCurrentValue] = useState(0);
  const [unit, setUnit] = useState('problems');
  const [category, setCategory] = useState(categories[0] || 'DSA');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setDescription(initialGoal.description || '');
      setType(initialGoal.type);
      setTargetValue(initialGoal.targetValue);
      setCurrentValue(initialGoal.currentValue);
      setUnit(initialGoal.unit);
      setCategory(initialGoal.category || categories[0] || 'DSA');
      setStartDate(initialGoal.startDate);
      setEndDate(initialGoal.endDate);
    } else {
      setTitle('');
      setDescription('');
      setType('task_count');
      setTargetValue(30);
      setCurrentValue(0);
      setUnit('problems');
      setCategory(categories[0] || 'DSA');
      setStartDate(today);
      setEndDate(defaultEndDate);
    }
  }, [initialGoal, isOpen, categories, today, defaultEndDate]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: GoalType) => {
    setType(newType);
    if (newType === 'task_count') setUnit('problems/tasks');
    else if (newType === 'time_spent') setUnit('hours');
    else if (newType === 'streak') setUnit('days');
    else if (newType === 'completion_rate') setUnit('%');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        type,
        targetValue: Number(targetValue) || 1,
        currentValue: Number(currentValue) || 0,
        unit: unit.trim() || 'units',
        category,
        startDate,
        endDate
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
            <Target className="h-4 w-4 text-[#141414]" />
            <h2 className="text-base font-mono font-black uppercase tracking-wider text-[#141414]">
              {initialGoal ? 'EDIT GOAL DIRECTIVE' : 'NEW GOAL DIRECTIVE'}
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
              Goal Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. DSA: 30 Graph & Tree Problems"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Metric Type
              </label>
              <select
                value={type}
                onChange={e => handleTypeChange(e.target.value as GoalType)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                <option value="task_count">Task / Problem Count</option>
                <option value="time_spent">Time Spent (Hours)</option>
                <option value="streak">Daily Streak (Days)</option>
                <option value="completion_rate">Completion Rate (%)</option>
                <option value="custom">Custom Metric</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Linked Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Target Value
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={targetValue}
                onChange={e => setTargetValue(Number(e.target.value))}
                className="mt-1 w-full border border-[#141414] bg-white px-2.5 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Current Value
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={currentValue}
                onChange={e => setCurrentValue(Number(e.target.value))}
                className="mt-1 w-full border border-[#141414] bg-white px-2.5 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Unit Label
              </label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="problems / hrs"
                className="mt-1 w-full border border-[#141414] bg-white px-2.5 py-1.5 text-xs font-mono text-[#141414] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Target Deadline
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Description / Accountability Metric
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Why does this goal matter? What standard will be used to judge completion?"
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
              {isSubmitting ? 'Saving...' : initialGoal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
