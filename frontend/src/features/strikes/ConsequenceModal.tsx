import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, DollarSign, Ban, Flame, Check } from 'lucide-react';
import { Consequence, ConsequenceType, ConsequenceStatus } from '../../types/index';

interface ConsequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Consequence>) => Promise<void>;
  initialConsequence?: Consequence | null;
  currentStrikes?: number;
}

export const ConsequenceModal: React.FC<ConsequenceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConsequence,
  currentStrikes = 0,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ConsequenceType>('financial');
  const [strikeThreshold, setStrikeThreshold] = useState<number>(10);
  const [durationDays, setDurationDays] = useState<number>(0);
  const [autoResolveStrikes, setAutoResolveStrikes] = useState<boolean>(true);
  const [value, setValue] = useState('$50');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ConsequenceStatus>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialConsequence) {
      setTitle(initialConsequence.title || '');
      setType(initialConsequence.type || 'financial');
      setValue(initialConsequence.value || '');
      setDescription(initialConsequence.description || '');
      setStatus(initialConsequence.status || 'pending');
      setDurationDays(initialConsequence.durationDays || 0);
      setAutoResolveStrikes(initialConsequence.autoResolveStrikes !== false);

      const match = initialConsequence.trigger?.match(/(\d+)/);
      if (match) {
        setStrikeThreshold(parseInt(match[1], 10));
      } else {
        setStrikeThreshold(10);
      }
    } else {
      setTitle('');
      setType('financial');
      setStrikeThreshold(10);
      setDurationDays(0);
      setAutoResolveStrikes(true);
      setValue('$50');
      setDescription('');
      setStatus('pending');
    }
  }, [initialConsequence, isOpen]);

  if (!isOpen) return null;

  const presetThresholds = [5, 10, 15, 20, 25, 30];
  const presetDurations = [0, 1, 3, 7, 14, 30];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || strikeThreshold <= 0) return;

    setIsSubmitting(true);
    try {
      const willTriggerImmediately = currentStrikes >= strikeThreshold;
      const finalStatus = initialConsequence
        ? status
        : willTriggerImmediately
        ? 'active'
        : 'pending';

      const now = new Date();
      const shouldSetDates = willTriggerImmediately && (!initialConsequence || !initialConsequence.startDate);

      await onSave({
        title: title.trim(),
        type,
        trigger: `${strikeThreshold} strikes`,
        value: value.trim() || 'Penalty',
        description: description.trim(),
        durationDays: Number(durationDays) || 0,
        autoResolveStrikes,
        status: finalStatus,
        ...(shouldSetDates
          ? {
              triggeredAt: now.toISOString(),
              startDate: now.toISOString(),
              endDate:
                durationDays > 0
                  ? new Date(now.getTime() + durationDays * 86400000).toISOString()
                  : undefined,
            }
          : {}),
      });
      onClose();
    } catch (err) {
      console.error('Failed to save consequence penalty', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg border-2 border-[#141414] bg-white text-[#141414] p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <div>
              <h2 className="text-base font-mono font-black uppercase tracking-wider text-[#141414]">
                {initialConsequence ? 'EDIT PENALTY PROTOCOL' : 'NEW PENALTY RULE'}
              </h2>
              <p className="text-[10px] font-mono opacity-60 uppercase">
                DETERMINISTIC STRIKE CONSEQUENCE ENFORCEMENT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 font-mono font-bold hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Penalty Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Donate $50 to Charity or Forfeit Gaming Weekend"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Trigger Threshold */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Strike Threshold Trigger <span className="text-red-600">*</span>
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <input
                type="number"
                min={1}
                required
                value={strikeThreshold}
                onChange={e => setStrikeThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-28 border border-[#141414] bg-white px-3 py-2 text-xs font-mono font-bold text-[#141414] focus:ring-1 focus:ring-black focus:outline-none"
              />
              <span className="text-xs font-mono font-bold uppercase opacity-80">STRIKES</span>
            </div>

            {/* Quick Threshold Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono opacity-60 uppercase self-center mr-1">
                Presets:
              </span>
              {presetThresholds.map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setStrikeThreshold(preset)}
                  className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border transition-colors cursor-pointer ${
                    strikeThreshold === preset
                      ? 'border-[#141414] bg-[#141414] text-white'
                      : 'border-[#141414]/30 bg-neutral-100 hover:bg-neutral-200 text-[#141414]'
                  }`}
                >
                  {preset} Strikes
                </button>
              ))}
            </div>

            {/* Helper status text */}
            <div className="mt-2 p-2 bg-[#F4F3EF] border border-[#141414]/20 text-[11px] font-mono">
              {currentStrikes >= strikeThreshold ? (
                <span className="text-red-700 font-bold">
                  ⚠️ Current active strikes ({currentStrikes}) &ge; {strikeThreshold}. This penalty will activate immediately!
                </span>
              ) : (
                <span className="opacity-80">
                  Current active strikes: <strong>{currentStrikes}</strong>. Triggers when you reach{' '}
                  <strong>{strikeThreshold} strikes</strong> ({strikeThreshold - currentStrikes} more strikes).
                </span>
              )}
            </div>
          </div>

          {/* Penalty Type */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Penalty Type <span className="text-red-600">*</span>
            </label>
            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('financial');
                  if (!value || value === '7 Days' || value === 'Immediate') setValue('$50');
                }}
                className={`flex flex-col items-center justify-center p-3 border-2 text-center transition-all cursor-pointer ${
                  type === 'financial'
                    ? 'border-[#141414] bg-[#141414] text-white font-bold'
                    : 'border-[#141414]/40 bg-white hover:bg-neutral-50 text-[#141414]'
                }`}
              >
                <DollarSign className="h-5 w-5 mb-1" />
                <span className="text-[11px] font-mono uppercase">Financial</span>
                <span className="text-[9px] font-mono opacity-70">Fine / Donation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('restriction');
                  if (!value || value.startsWith('$')) setValue('3 Days');
                }}
                className={`flex flex-col items-center justify-center p-3 border-2 text-center transition-all cursor-pointer ${
                  type === 'restriction'
                    ? 'border-[#141414] bg-[#141414] text-white font-bold'
                    : 'border-[#141414]/40 bg-white hover:bg-neutral-50 text-[#141414]'
                }`}
              >
                <Ban className="h-5 w-5 mb-1" />
                <span className="text-[11px] font-mono uppercase">Restriction</span>
                <span className="text-[9px] font-mono opacity-70">App / Media Lock</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('custom');
                  if (!value || value.startsWith('$')) setValue('100 Pushups');
                }}
                className={`flex flex-col items-center justify-center p-3 border-2 text-center transition-all cursor-pointer ${
                  type === 'custom'
                    ? 'border-[#141414] bg-[#141414] text-white font-bold'
                    : 'border-[#141414]/40 bg-white hover:bg-neutral-50 text-[#141414]'
                }`}
              >
                <Flame className="h-5 w-5 mb-1" />
                <span className="text-[11px] font-mono uppercase">Custom</span>
                <span className="text-[9px] font-mono opacity-70">Discipline Task</span>
              </button>
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Value / Penalty Cost
            </label>
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="e.g. $50, $100, 3 Days, or 50 Burpees"
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
              Description & Enforcement Terms
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Transfer $50 to Wikipedia/charity upon reaching 10 strikes or delete social apps for 3 days."
              className="mt-1 w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Penalty Duration (Days) */}
          <div className="pt-2 border-t border-[#141414]/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase text-[#141414]">
                Penalty Duration (Live Countdown)
              </label>
              <span className="text-[10px] font-mono opacity-60 uppercase">
                {durationDays > 0 ? `${durationDays} Days Active Restriction` : 'One-Time / Immediate'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={0}
                value={durationDays}
                onChange={e => setDurationDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-24 border border-[#141414] bg-white px-3 py-2 text-xs font-mono font-bold text-[#141414] focus:ring-1 focus:ring-black focus:outline-none"
              />
              <span className="text-xs font-mono font-bold uppercase opacity-80">DAYS</span>
            </div>

            {/* Duration Presets */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono opacity-60 uppercase self-center mr-1">
                Presets:
              </span>
              {presetDurations.map(days => (
                <button
                  type="button"
                  key={days}
                  onClick={() => setDurationDays(days)}
                  className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border transition-colors cursor-pointer ${
                    durationDays === days
                      ? 'border-[#141414] bg-[#141414] text-white'
                      : 'border-[#141414]/30 bg-neutral-100 hover:bg-neutral-200 text-[#141414]'
                  }`}
                >
                  {days === 0 ? 'No Timer (0d)' : `${days} Days`}
                </button>
              ))}
            </div>

            <p className="text-[11px] font-mono opacity-70">
              {durationDays > 0 ? (
                <span>
                  ⏳ When triggered at {strikeThreshold} strikes, a live countdown for{' '}
                  <strong>{durationDays} days</strong> begins automatically on your dashboard.
                </span>
              ) : (
                <span>
                  Immediate action penalty (e.g. pay fine or one-time workout). No multi-day timer.
                </span>
              )}
            </p>
          </div>

          {/* Automatic Strike Debt Settlement */}
          <div className="pt-2 border-t border-[#141414]/20">
            <label className="flex items-start space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoResolveStrikes}
                onChange={e => setAutoResolveStrikes(e.target.checked)}
                className="mt-0.5 h-4 w-4 border-[#141414] rounded-none accent-[#141414] cursor-pointer"
              />
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#141414] block">
                  Automatic Strike Resolution ({strikeThreshold} Strikes)
                </span>
                <span className="text-[11px] font-mono opacity-70 block mt-0.5 leading-tight">
                  Automatically clear and resolve the {strikeThreshold} strikes that triggered this penalty once the penalty is served.
                </span>
              </div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-[#141414]">
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-[#141414] bg-transparent px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center space-x-1.5 border-2 border-[#141414] bg-[#141414] px-4 py-2 text-xs font-mono font-bold uppercase text-white hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Saving...' : initialConsequence ? 'Save Changes' : 'Create Penalty'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
