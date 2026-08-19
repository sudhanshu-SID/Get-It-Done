import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Strike, Consequence } from '../../types/index';

interface StrikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Strike>) => Promise<void>;
  consequences: Consequence[];
}

export const StrikeModal: React.FC<StrikeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  consequences
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [reason, setReason] = useState('');
  const [date, setDate] = useState(today);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [consequenceId, setConsequenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReason('');
    setDate(today);
    setSeverity('medium');
    setConsequenceId('');
    setNotes('');
  }, [isOpen, today]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const selectedCon = consequences.find(c => c._id === consequenceId);

    setIsSubmitting(true);
    try {
      await onSave({
        reason: reason.trim(),
        date,
        severity,
        consequenceId: consequenceId || undefined,
        consequenceTitle: selectedCon?.title,
        consequenceValue: selectedCon?.value,
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
      <div className="w-full max-w-md border-2 border-[#141414] bg-white text-[#141414] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="text-base font-mono font-black uppercase tracking-wider">LOG STRIKE PENALTY</h2>
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
              Reason for Strike <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Missed daily DSA graph problem commitment"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Date of Infraction
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Severity
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
              >
                <option value="low">Low (1st reminder)</option>
                <option value="medium">Medium (Required task skipped)</option>
                <option value="high">High (Multiple days skipped)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Triggered Consequence (Optional)
            </label>
            <select
              value={consequenceId}
              onChange={e => setConsequenceId(e.target.value)}
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
            >
              <option value="">No immediate penalty</option>
              {consequences.map(c => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Recovery / Accountability Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What led to this and how will it be addressed tomorrow?"
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
              className="border-2 border-[#141414] bg-red-600 px-4 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Logging...' : 'Record Strike'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
