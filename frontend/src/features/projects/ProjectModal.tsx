import React, { useState, useEffect } from 'react';
import { X, FolderKanban } from 'lucide-react';
import { Project, ProjectStatus, TaskPriority } from '../../types/index';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
  initialProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [currentPhase, setCurrentPhase] = useState('Phase 1 - Inception');
  const [currentState, setCurrentState] = useState('Initial setup & architecture');
  const [lastCompleted, setLastCompleted] = useState('Project initialization');
  const [nextAction, setNextAction] = useState('Define core specification');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description || '');
      setStatus(initialProject.status);
      setPriority(initialProject.priority);
      setCurrentPhase(initialProject.currentPhase || '');
      setCurrentState(initialProject.currentState || '');
      setLastCompleted(initialProject.lastCompleted || '');
      setNextAction(initialProject.nextAction || '');
      setNotes(initialProject.notes || '');
    } else {
      setName('');
      setDescription('');
      setStatus('active');
      setPriority('high');
      setCurrentPhase('Phase 1 - Architecture');
      setCurrentState('Initial setup & scaffolding');
      setLastCompleted('Project kickoff');
      setNextAction('Build core functionality');
      setNotes('');
    }
  }, [initialProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        status,
        priority,
        currentPhase: currentPhase.trim(),
        currentState: currentState.trim(),
        lastCompleted: lastCompleted.trim(),
        nextAction: nextAction.trim(),
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
            {initialProject ? 'EDIT PROJECT' : 'NEW PROJECT'}
          </h2>
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
              Project Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. AI Personal Assistant"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What are you building and why?"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ProjectStatus)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
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
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="border border-[#141414] bg-[#E4E3E0] p-3 space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              INITIAL WHERE I LEFT OFF STATE
            </span>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#141414]">
                Current Phase
              </label>
              <input
                type="text"
                value={currentPhase}
                onChange={e => setCurrentPhase(e.target.value)}
                placeholder="e.g. Phase 3 - Memory Persistence"
                className="mt-1 w-full border border-[#141414] bg-white px-2.5 py-1 text-xs font-mono text-[#141414] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#141414]">
                Where I Left Off
              </label>
              <input
                type="text"
                value={currentState}
                onChange={e => setCurrentState(e.target.value)}
                placeholder="e.g. Completed storage layer, now testing recall"
                className="mt-1 w-full border border-[#141414] bg-white px-2.5 py-1 text-xs font-mono text-[#141414] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#141414]">
                Last Completed Action
              </label>
              <input
                type="text"
                value={lastCompleted}
                onChange={e => setLastCompleted(e.target.value)}
                placeholder="e.g. Project initialization"
                className="mt-1 w-full border border-[#141414] bg-white px-2.5 py-1 text-xs font-mono text-[#141414] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#141414]">
                Next Action
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                placeholder="e.g. Write 10 integration test cases"
                className="mt-1 w-full border-2 border-[#141414] bg-white px-2.5 py-1 text-xs font-mono font-bold text-[#141414] focus:outline-none"
              />
            </div>
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
              {isSubmitting ? 'Saving...' : initialProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
