import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, Flag, AlertCircle } from 'lucide-react';
import { Task, Project, TaskPriority, CommitmentLevel, RecurrenceType } from '../../types/index';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  initialTask?: Task | null;
  projects: Project[];
  categories: string[];
  defaultDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  projects,
  categories,
  defaultDate
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('DSA');
  const [projectId, setProjectId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [commitmentLevel, setCommitmentLevel] = useState<CommitmentLevel>('required');
  const [scheduledDate, setScheduledDate] = useState(defaultDate || today);
  const [dueDate, setDueDate] = useState(defaultDate || today);
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setCategory(initialTask.category || 'DSA');
      setProjectId(initialTask.projectId || '');
      setPriority(initialTask.priority);
      setCommitmentLevel(initialTask.commitmentLevel);
      setScheduledDate(initialTask.scheduledDate);
      setDueDate(initialTask.dueDate || initialTask.scheduledDate);
      setEstimatedMinutes(initialTask.estimatedMinutes || 45);
      setRecurrence(initialTask.recurrence || 'none');
      setNotes(initialTask.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0] || 'DSA');
      setProjectId('');
      setPriority('high');
      setCommitmentLevel('required');
      setScheduledDate(defaultDate || today);
      setDueDate(defaultDate || today);
      setEstimatedMinutes(45);
      setRecurrence('none');
      setNotes('');
    }
  }, [initialTask, isOpen, defaultDate, categories, today]);

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
        projectId: projectId || undefined,
        priority,
        commitmentLevel,
        scheduledDate,
        dueDate,
        estimatedMinutes: Number(estimatedMinutes) || 45,
        recurrence,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg border-2 border-[#141414] bg-white text-[#141414] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-4">
          <h2 className="text-base font-mono font-black uppercase tracking-wider text-[#141414]">
            {initialTask ? 'EDIT COMMITMENT' : 'NEW COMMITMENT'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 font-mono font-bold hover:bg-[#141414] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Commitment Title <span className="text-red-600">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Solve 2 DSA graph problems (Topological Sort)"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Commitment Level & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Commitment Type
              </label>
              <div className="mt-1 flex border border-[#141414] bg-[#E4E3E0] p-0.5">
                <button
                  type="button"
                  onClick={() => setCommitmentLevel('required')}
                  className={`flex-1 py-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                    commitmentLevel === 'required'
                      ? 'bg-[#141414] text-white'
                      : 'text-[#141414] opacity-70 hover:opacity-100'
                  }`}
                >
                  Required
                </button>
                <button
                  type="button"
                  onClick={() => setCommitmentLevel('optional')}
                  className={`flex-1 py-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                    commitmentLevel === 'optional'
                      ? 'bg-[#141414] text-white'
                      : 'text-[#141414] opacity-70 hover:opacity-100'
                  }`}
                >
                  Optional
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                <option value="high">High (Primary focus)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="low">Low (When time permits)</option>
              </select>
            </div>
          </div>

          {/* Category & Project */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Linked Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                <option value="">No Project</option>
                {projects.map(proj => (
                  <option key={proj._id} value={proj._id}>
                    {proj.name} ({proj.currentPhase})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduled Date, Due Date & Estimated Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Scheduled Date
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-2 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-2 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Est. Minutes
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                className="mt-1 w-full border border-[#141414] bg-white px-2 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Recurrence
            </label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value as RecurrenceType)}
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
            >
              <option value="none">One-time commitment</option>
              <option value="daily">Daily habit / commitment</option>
              <option value="weekdays">Weekdays (Mon - Fri)</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Notes & Context
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What specifically needs to be accomplished to consider this done?"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Actions */}
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
              id="save-task-submit-btn"
              className="border-2 border-[#141414] bg-[#141414] px-4 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : initialTask ? 'Update Commitment' : 'Add Commitment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
