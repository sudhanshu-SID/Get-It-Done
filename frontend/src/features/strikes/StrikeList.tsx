import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Trash2,
  DollarSign,
  Ban,
  Check
} from 'lucide-react';
import { Strike, Consequence } from '../../types/index';

interface StrikeListProps {
  strikes: Strike[];
  consequences: Consequence[];
  onOpenStrikeModal: () => void;
  onResolveStrike: (id: string, notes?: string) => Promise<void>;
  onDeleteStrike: (id: string) => Promise<void>;
}

export const StrikeList: React.FC<StrikeListProps> = ({
  strikes,
  consequences,
  onOpenStrikeModal,
  onResolveStrike,
  onDeleteStrike
}) => {
  const [resolveStrikeId, setResolveStrikeId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const openStrikes = strikes.filter(s => s.status === 'open');
  const resolvedStrikes = strikes.filter(s => s.status === 'resolved');

  const handleConfirmResolve = async () => {
    if (!resolveStrikeId) return;
    setIsResolving(true);
    try {
      await onResolveStrike(resolveStrikeId, resolveNote.trim());
      setResolveStrikeId(null);
      setResolveNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#141414] pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">Infraction Protocol & Strike Log</h1>
            {openStrikes.length > 0 && (
              <span className="border border-[#141414] bg-red-500 px-2 py-0.5 text-xs font-mono font-bold text-white uppercase">
                {openStrikes.length} ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs font-mono opacity-60">
            DETERMINISTIC PENALTIES FOR MISSED COMMITMENTS. TRANSPARENT DISCIPLINE WITHOUT GUILT.
          </p>
        </div>
        <button
          onClick={onOpenStrikeModal}
          className="flex items-center space-x-1.5 border-2 border-[#141414] bg-red-600 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Strike</span>
        </button>
      </div>

      {/* Rules & Consequences Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-[#141414] bg-white p-4 space-y-1.5 text-[#141414]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
            Active Strikes
          </span>
          <div className="text-2xl font-bold font-mono">
            {openStrikes.length} <span className="text-xs opacity-60 font-normal">/ 10 THRESHOLD</span>
          </div>
          <p className="text-[11px] font-mono opacity-75">
            10 active strikes triggers financial accountability penalty.
          </p>
        </div>

        <div className="border-2 border-[#141414] bg-white p-4 space-y-1.5 text-[#141414]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
            Total Historic Strikes
          </span>
          <div className="text-2xl font-bold font-mono">{strikes.length}</div>
          <p className="text-[11px] font-mono opacity-75">
            {resolvedStrikes.length} resolved through makeup work.
          </p>
        </div>

        <div className="border-2 border-[#141414] bg-white p-4 space-y-1.5 text-[#141414]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
            Discipline Framework
          </span>
          <div className="text-xs font-mono font-black uppercase">
            Deterministic & Honest
          </div>
          <p className="text-[11px] font-mono opacity-75">
            Only required commitments count towards strikes; optional tasks do not.
          </p>
        </div>
      </div>

      {/* Active Consequences */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-black uppercase tracking-wider text-[#141414]">
          CONFIGURED PENALTIES
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {consequences.map(con => (
            <div
              key={con._id}
              className="border-2 border-[#141414] bg-white p-3.5 flex items-start space-x-3 text-[#141414]"
            >
              <div className="flex h-8 w-8 items-center justify-center border border-[#141414] bg-[#E4E3E0] shrink-0">
                {con.type === 'financial' ? <DollarSign className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-black uppercase">{con.title}</h4>
                  <span className="border border-[#141414] bg-[#E4E3E0] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
                    {con.value}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-mono opacity-75 leading-relaxed">{con.description}</p>
                <div className="mt-2 text-[10px] font-mono opacity-60 uppercase font-bold">
                  TRIGGER: {con.trigger}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strikes List */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-mono font-black uppercase tracking-wider text-[#141414]">
          STRIKE AUDIT LOG
        </h2>

        {strikes.length === 0 ? (
          <div className="border border-dashed border-[#141414] bg-white p-8 text-center text-xs font-mono opacity-60">
            CLEAN RECORD. ZERO STRIKES RECORDED.
          </div>
        ) : (
          <div className="space-y-2">
            {strikes.map(strike => {
              const isOpen = strike.status === 'open';

              return (
                <div
                  key={strike._id}
                  className={`border-2 border-[#141414] p-4 transition-all text-[#141414] ${
                    isOpen
                      ? 'bg-red-50 border-red-600'
                      : 'bg-white opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black uppercase text-red-600">
                          STRIKE #{strike.number}
                        </span>
                        <span className="text-xs opacity-50 font-mono">·</span>
                        <span className="text-xs opacity-75 font-mono">
                          {strike.date}
                        </span>
                        <span
                          className={`border border-[#141414] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                            isOpen
                              ? 'bg-red-200 text-red-900'
                              : 'bg-green-200 text-green-900'
                          }`}
                        >
                          {strike.status.toUpperCase()}
                        </span>
                        {strike.severity === 'high' && (
                          <span className="border border-red-600 bg-red-600 px-1 text-[9px] font-mono font-bold text-white uppercase">
                            HIGH SEVERITY
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-mono font-bold uppercase">{strike.reason}</h3>

                      {strike.consequenceTitle && (
                        <p className="text-[11px] font-mono font-bold opacity-80">
                          CONSEQUENCE: {strike.consequenceTitle} ({strike.consequenceValue})
                        </p>
                      )}

                      {strike.notes && (
                        <p className="text-[11px] font-mono opacity-70 italic">
                          Notes: {strike.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isOpen ? (
                        <button
                          onClick={() => setResolveStrikeId(strike._id)}
                          className="flex items-center space-x-1 border border-[#141414] bg-[#141414] px-3 py-1 text-xs font-mono font-bold uppercase text-white hover:bg-black cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Resolve</span>
                        </button>
                      ) : (
                        <span className="text-xs font-mono font-bold text-green-800 uppercase">
                          Resolved ✓
                        </span>
                      )}

                      <button
                        onClick={() => {
                          if (confirm('Delete this strike entry?')) {
                            onDeleteStrike(strike._id);
                          }
                        }}
                        className="p-1 opacity-60 hover:text-red-600 hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolve Strike Dialog */}
      {resolveStrikeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md border-2 border-[#141414] bg-white text-[#141414] p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-mono font-black uppercase tracking-wider">RESOLVE STRIKE</h3>
            <p className="text-xs font-mono opacity-75">
              Record how this infraction was resolved (e.g. Made up 4 DSA problems next morning or served penalty).
            </p>
            <textarea
              rows={2}
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              placeholder="Resolution note..."
              className="w-full border border-[#141414] bg-white px-3 py-2 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#141414]">
              <button
                onClick={() => setResolveStrikeId(null)}
                className="border border-[#141414] bg-transparent px-3 py-1.5 text-xs font-mono font-bold uppercase hover:bg-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={isResolving}
                className="border border-[#141414] bg-[#141414] px-3.5 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black disabled:opacity-50 cursor-pointer"
              >
                {isResolving ? 'Resolving...' : 'Confirm Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
