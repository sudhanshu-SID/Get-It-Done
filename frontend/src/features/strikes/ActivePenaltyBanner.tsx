import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, CheckCircle2, ArrowRight, Ban, DollarSign, Flame, Check } from 'lucide-react';
import { Consequence } from '../../types/index';

interface ActivePenaltyBannerProps {
  activeConsequences: Consequence[];
  onResolveConsequence: (id: string) => Promise<void>;
  onNavigateToStrikes?: () => void;
}

export const ActivePenaltyBanner: React.FC<ActivePenaltyBannerProps> = ({
  activeConsequences,
  onResolveConsequence,
  onNavigateToStrikes,
}) => {
  // Trigger state refresh every second for live countdown
  const [now, setNow] = useState(Date.now());
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!activeConsequences || activeConsequences.length === 0) {
    return null;
  }

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await onResolveConsequence(id);
    } catch (err) {
      console.error('Failed to resolve consequence', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {activeConsequences.map(con => {
        const triggerMatch = con.trigger?.match(/(\d+)/);
        const triggerStrikes = triggerMatch ? parseInt(triggerMatch[1], 10) : 10;
        const hasDuration = con.durationDays !== undefined && con.durationDays > 0;

        let isCompleted = false;
        let daysLeft = 0;
        let hoursLeft = 0;
        let minsLeft = 0;
        let secsLeft = 0;
        let progressPercent = 0;
        let currentDayNumber = 1;
        let endDateFormatted = '';

        if (hasDuration) {
          const startTime = new Date(con.startDate || con.triggeredAt || con.createdAt).getTime();
          const durationMs = con.durationDays! * 24 * 60 * 60 * 1000;
          const endTime = con.endDate ? new Date(con.endDate).getTime() : startTime + durationMs;

          endDateFormatted = new Date(endTime).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          const remainingMs = endTime - now;
          if (remainingMs <= 0) {
            isCompleted = true;
            progressPercent = 100;
            currentDayNumber = con.durationDays!;
          } else {
            daysLeft = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
            hoursLeft = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
            minsLeft = Math.floor((remainingMs / (1000 * 60)) % 60);
            secsLeft = Math.floor((remainingMs / 1000) % 60);

            const elapsedMs = Math.max(0, durationMs - remainingMs);
            progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / durationMs) * 100)));
            currentDayNumber = Math.min(con.durationDays!, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1);
          }
        }

        return (
          <div
            key={con._id}
            className={`border-2 border-[#141414] p-4 text-[#141414] shadow-md transition-all ${
              isCompleted
                ? 'bg-green-50 border-green-700'
                : 'bg-red-50 border-red-600'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Left Details */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span
                    className={`flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-white border ${
                      isCompleted
                        ? 'bg-green-700 border-green-800'
                        : 'bg-red-600 border-red-700 animate-pulse'
                    }`}
                  >
                    <ShieldAlert className="h-3 w-3 inline" />
                    <span>{isCompleted ? 'PENALTY SERVED' : 'ACTIVE PENALTY IN EFFECT'}</span>
                  </span>

                  <span className="border border-[#141414] bg-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                    TRIGGERED BY {triggerStrikes} STRIKES
                  </span>

                  <span className="border border-[#141414] bg-[#E4E3E0] px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase">
                    {con.value}
                  </span>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="mt-0.5">
                    {con.type === 'financial' ? (
                      <DollarSign className="h-4 w-4 text-red-600" />
                    ) : con.type === 'restriction' ? (
                      <Ban className="h-4 w-4 text-red-600" />
                    ) : (
                      <Flame className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-black uppercase text-[#141414] tracking-tight">
                      {con.title}
                    </h3>
                    {con.description && (
                      <p className="text-xs font-mono opacity-80 mt-0.5">
                        {con.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Duration Progress & Live Ticker */}
                {hasDuration && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-mono gap-1">
                      <div className="font-bold uppercase text-[#141414] flex items-center space-x-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {isCompleted
                            ? `Completed: ${con.durationDays} of ${con.durationDays} Days Served`
                            : `Day ${currentDayNumber} of ${con.durationDays} Served`}
                        </span>
                        {!isCompleted && endDateFormatted && (
                          <span className="opacity-60 text-[10px] font-normal">
                            (Ends {endDateFormatted})
                          </span>
                        )}
                      </div>

                      {/* Live Ticker Clock */}
                      <div className="font-mono font-black text-sm tracking-wider text-red-700 bg-white border border-[#141414] px-2 py-0.5 self-start sm:self-auto">
                        {isCompleted ? (
                          <span className="text-green-800">00d 00h 00m 00s · SERVED</span>
                        ) : (
                          <span>
                            {String(daysLeft).padStart(2, '0')}d{' '}
                            {String(hoursLeft).padStart(2, '0')}h{' '}
                            {String(minsLeft).padStart(2, '0')}m{' '}
                            {String(secsLeft).padStart(2, '0')}s REMAINING
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white h-2.5 border border-[#141414] overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#141414]/20 pt-3 md:pt-0 md:pl-4">
                <button
                  onClick={() => handleResolve(con._id)}
                  disabled={resolvingId === con._id}
                  className={`flex items-center space-x-1.5 border-2 border-[#141414] px-4 py-2 text-xs font-mono font-bold uppercase transition-all shadow-xs cursor-pointer ${
                    isCompleted
                      ? 'bg-green-700 text-white hover:bg-green-800'
                      : 'bg-[#141414] text-white hover:bg-black'
                  } disabled:opacity-50`}
                >
                  <Check className="h-4 w-4" />
                  <span>
                    {resolvingId === con._id
                      ? 'Settling...'
                      : isCompleted
                      ? `Settle Debt & Clear ${triggerStrikes} Strikes`
                      : con.autoResolveStrikes !== false
                      ? `Mark Served & Clear ${triggerStrikes} Strikes`
                      : 'Mark Penalty Served'}
                  </span>
                </button>

                {onNavigateToStrikes && (
                  <button
                    onClick={onNavigateToStrikes}
                    className="text-[10px] font-mono font-bold uppercase opacity-70 hover:opacity-100 flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    <span>View Strike Log</span>
                    <ArrowRight className="h-3 w-3 inline" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
