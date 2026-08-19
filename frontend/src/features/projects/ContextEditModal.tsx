import React, { useState, useEffect } from 'react';
import { X, CornerDownRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { Project } from '../../types/index';

interface ContextEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSaveContext: (
    projectId: string,
    context: {
      currentPhase: string;
      currentState: string;
      lastCompleted: string;
      nextAction: string;
      notes?: string;
    }
  ) => Promise<void>;
}

export const ContextEditModal: React.FC<ContextEditModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveContext
}) => {
  const [currentPhase, setCurrentPhase] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [lastCompleted, setLastCompleted] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setCurrentPhase(project.currentPhase || '');
      setCurrentState(project.currentState || '');
      setLastCompleted(project.lastCompleted || '');
      setNextAction(project.nextAction || '');
      setNotes(project.notes || '');
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveContext(project._id, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg border-2 border-[#141414] bg-white text-[#141414] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
              STATE CONTEXT
            </span>
            <h2 className="text-base font-mono font-black uppercase tracking-tight text-[#141414]">{project.name}</h2>
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
              Current Phase
            </label>
            <input
              type="text"
              required
              value={currentPhase}
              onChange={e => setCurrentPhase(e.target.value)}
              placeholder="e.g. Phase 3 - Memory & Retrieval"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Where I Left Off (Current State & Blockers)
            </label>
            <textarea
              rows={2}
              required
              value={currentState}
              onChange={e => setCurrentState(e.target.value)}
              placeholder="e.g. Memory retrieval testing is incomplete; need to verify latency."
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Last Completed Action
            </label>
            <input
              type="text"
              required
              value={lastCompleted}
              onChange={e => setLastCompleted(e.target.value)}
              placeholder="e.g. Memory persistence and embeddings sync"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414] flex items-center space-x-1">
              <span>Next Action (Immediate Next Step)</span>
              <ArrowRight className="h-3 w-3" />
            </label>
            <input
              type="text"
              required
              value={nextAction}
              onChange={e => setNextAction(e.target.value)}
              placeholder="e.g. Create 10 evaluation test cases"
              className="mt-1 w-full border-2 border-[#141414] bg-white px-3 py-1.5 text-xs font-mono font-bold text-[#141414] placeholder:opacity-50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase opacity-70">
              Internal Architecture Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Deterministic constraints, tech stack notes..."
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:outline-none"
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
              {isSubmitting ? 'Saving Context...' : 'Update Where I Left Off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
