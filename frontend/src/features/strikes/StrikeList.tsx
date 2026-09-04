import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Trash2,
  DollarSign,
  Ban,
  Check,
  Flame,
  Edit2,
  Filter,
  Search,
  Clock
} from 'lucide-react';
import { Strike, Consequence } from '../../types/index';
import { ActivePenaltyBanner } from './ActivePenaltyBanner';

interface StrikeListProps {
  strikes: Strike[];
  consequences: Consequence[];
  onOpenStrikeModal: () => void;
  onResolveStrike: (id: string, notes?: string) => Promise<void>;
  onDeleteStrike: (id: string) => Promise<void>;
  onOpenConsequenceModal: (consequence?: Consequence | null) => void;
  onDeleteConsequence: (id: string) => Promise<void>;
  onResolveConsequence: (id: string) => Promise<void>;
}

interface DateGroup {
  dateKey: string;
  formattedDate: string;
  relativeLabel?: 'TODAY' | 'YESTERDAY';
  strikes: Strike[];
  openCount: number;
  resolvedCount: number;
}

export const StrikeList: React.FC<StrikeListProps> = ({
  strikes,
  consequences,
  onOpenStrikeModal,
  onResolveStrike,
  onDeleteStrike,
  onOpenConsequenceModal,
  onDeleteConsequence,
  onResolveConsequence,
}) => {
  const [resolveStrikeId, setResolveStrikeId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Filters for strikes audit log
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const openStrikes = strikes.filter(s => s.status === 'open');
  const resolvedStrikes = strikes.filter(s => s.status === 'resolved');

  // Parse consequence thresholds
  const parsedConsequences = useMemo(() => {
    return consequences.map(con => {
      const match = con.trigger?.match(/(\d+)/);
      const threshold = match ? parseInt(match[1], 10) : 10;
      return {
        ...con,
        numericThreshold: threshold,
      };
    }).sort((a, b) => a.numericThreshold - b.numericThreshold);
  }, [consequences]);

  // Find next upcoming penalty threshold
  const nextConsequence = useMemo(() => {
    return parsedConsequences.find(
      c => c.status === 'pending' && c.numericThreshold > openStrikes.length
    ) || parsedConsequences[0];
  }, [parsedConsequences, openStrikes.length]);

  const nextThreshold = nextConsequence?.numericThreshold || 10;

  // Filter strikes based on UI controls
  const filteredStrikes = useMemo(() => {
    return strikes.filter(strike => {
      if (filterStatus === 'open' && strike.status !== 'open') return false;
      if (filterStatus === 'resolved' && strike.status !== 'resolved') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const reasonMatch = strike.reason?.toLowerCase().includes(q);
        const taskMatch = strike.taskTitle?.toLowerCase().includes(q);
        const noteMatch = strike.notes?.toLowerCase().includes(q);
        if (!reasonMatch && !taskMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [strikes, filterStatus, searchQuery]);

  // Group strikes by date
  const groupedStrikes = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const groupsMap: Record<string, Strike[]> = {};

    filteredStrikes.forEach(strike => {
      let dateKey = strike.date;
      if (!dateKey && strike.createdAt) {
        dateKey = strike.createdAt.split('T')[0];
      }
      if (!dateKey) {
        dateKey = 'Unspecified Date';
      }

      if (!groupsMap[dateKey]) {
        groupsMap[dateKey] = [];
      }
      groupsMap[dateKey].push(strike);
    });

    // Sort date keys descending (newest first)
    const sortedKeys = Object.keys(groupsMap).sort((a, b) => {
      if (a === 'Unspecified Date') return 1;
      if (b === 'Unspecified Date') return -1;
      return b.localeCompare(a);
    });

    return sortedKeys.map(dateKey => {
      const items = groupsMap[dateKey].sort((a, b) => (b.number || 0) - (a.number || 0));
      const openCount = items.filter(s => s.status === 'open').length;
      const resolvedCount = items.filter(s => s.status === 'resolved').length;

      let formattedDate = dateKey;
      let relativeLabel: 'TODAY' | 'YESTERDAY' | undefined = undefined;

      if (dateKey === todayStr) {
        relativeLabel = 'TODAY';
      } else if (dateKey === yesterdayStr) {
        relativeLabel = 'YESTERDAY';
      }

      if (dateKey !== 'Unspecified Date') {
        try {
          const parsed = new Date(dateKey + 'T00:00:00');
          if (!isNaN(parsed.getTime())) {
            formattedDate = parsed.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          }
        } catch {
          formattedDate = dateKey;
        }
      }

      return {
        dateKey,
        formattedDate,
        relativeLabel,
        strikes: items,
        openCount,
        resolvedCount,
      } as DateGroup;
    });
  }, [filteredStrikes]);

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
            <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">
              Infraction Protocol & Strike Log
            </h1>
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenConsequenceModal(null)}
            className="flex items-center space-x-1.5 border-2 border-[#141414] bg-white px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#141414] hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
            <span>Add Penalty</span>
          </button>
          <button
            onClick={onOpenStrikeModal}
            className="flex items-center space-x-1.5 border-2 border-[#141414] bg-red-600 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Strike</span>
          </button>
        </div>
      </div>

      {/* Rules & Consequences Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dynamic threshold card */}
        <div className="border-2 border-[#141414] bg-white p-4 space-y-1.5 text-[#141414]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
            Active Strikes
          </span>
          <div className="text-2xl font-bold font-mono">
            {openStrikes.length}{' '}
            <span className="text-xs opacity-60 font-normal">
              / {nextThreshold} THRESHOLD
            </span>
          </div>
          <p className="text-[11px] font-mono opacity-75 leading-tight">
            {parsedConsequences.length === 0 ? (
              <span>No penalty configured. Click &quot;Add Penalty&quot; to set a 10 or 20 strike rule.</span>
            ) : openStrikes.length >= nextThreshold ? (
              <span className="text-red-700 font-bold">
                ⚠️ Strike threshold reached! Penalty triggered.
              </span>
            ) : (
              <span>
                {nextThreshold - openStrikes.length} more strikes until &quot;{nextConsequence?.title}&quot; triggers.
              </span>
            )}
          </p>
        </div>

        <div className="border-2 border-[#141414] bg-white p-4 space-y-1.5 text-[#141414]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
            Total Historic Strikes
          </span>
          <div className="text-2xl font-bold font-mono">{strikes.length}</div>
          <p className="text-[11px] font-mono opacity-75">
            {resolvedStrikes.length} resolved through makeup work or penalties.
          </p>
        </div>

        <div className="border-2 border-[#141414] bg-white p-4 space-y-1.5 text-[#141414]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
            Discipline Framework
          </span>
          <div className="text-xs font-mono font-black uppercase">
            Deterministic &amp; Honest
          </div>
          <p className="text-[11px] font-mono opacity-75">
            Only required commitments count towards strikes; optional tasks do not.
          </p>
        </div>
      </div>

      {/* Active Penalty Protocol Countdown Banner */}
      {consequences.some(c => c.status === 'active' || openStrikes.length >= (parseInt(c.trigger?.match(/\d+/)?.[0] || '10', 10))) && (
        <ActivePenaltyBanner
          activeConsequences={consequences.filter(c => c.status === 'active' || openStrikes.length >= (parseInt(c.trigger?.match(/\d+/)?.[0] || '10', 10)))}
          onResolveConsequence={onResolveConsequence}
        />
      )}

      {/* Configured Penalties & Consequences Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#141414]/20 pb-2">
          <div>
            <h2 className="text-xs font-mono font-black uppercase tracking-wider text-[#141414] flex items-center space-x-1.5">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <span>Configured Strike Penalties ({parsedConsequences.length})</span>
            </h2>
            <p className="text-[10px] font-mono opacity-60">
              CUSTOM CONSEQUENCES TRIGGERED WHEN YOUR STRIKES REACH PRESET MILESTONES (E.G. 10 OR 20 STRIKES).
            </p>
          </div>
          <button
            onClick={() => onOpenConsequenceModal(null)}
            className="flex items-center space-x-1 self-start sm:self-auto border border-[#141414] bg-[#141414] px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-white hover:bg-black transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add Penalty Rule</span>
          </button>
        </div>

        {parsedConsequences.length === 0 ? (
          <div className="border border-dashed border-[#141414] bg-white p-6 text-center space-y-2">
            <p className="text-xs font-mono opacity-60">
              NO CUSTOM PENALTIES CONFIGURED YET.
            </p>
            <p className="text-[11px] font-mono opacity-50">
              Create rules like &quot;At 10 strikes: Donate $50&quot; or &quot;At 20 strikes: No social media for 1 week&quot;.
            </p>
            <button
              onClick={() => onOpenConsequenceModal(null)}
              className="mt-1 border border-[#141414] bg-[#141414] px-3 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black cursor-pointer"
            >
              + Configure First Penalty
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {parsedConsequences.map(con => {
              const isTriggered = con.status === 'active' || openStrikes.length >= con.numericThreshold;
              const isResolved = con.status === 'resolved';

              return (
                <div
                  key={con._id}
                  className={`border-2 p-3.5 flex flex-col justify-between text-[#141414] transition-all ${
                    isResolved
                      ? 'border-[#141414] bg-neutral-50 opacity-75'
                      : isTriggered
                      ? 'border-red-600 bg-red-50'
                      : 'border-[#141414] bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <div className={`flex h-7 w-7 items-center justify-center border border-[#141414] shrink-0 ${
                          isTriggered ? 'bg-red-600 text-white' : 'bg-[#E4E3E0]'
                        }`}>
                          {con.type === 'financial' ? (
                            <DollarSign className="h-3.5 w-3.5" />
                          ) : con.type === 'restriction' ? (
                            <Ban className="h-3.5 w-3.5" />
                          ) : (
                            <Flame className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-mono font-black uppercase leading-tight">
                            {con.title}
                          </h4>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <span className="text-[9px] font-mono opacity-60 uppercase">
                              {con.type}
                            </span>
                            {con.durationDays !== undefined && con.durationDays > 0 && (
                              <>
                                <span className="text-[9px] opacity-40">·</span>
                                <span className="text-[9px] font-mono font-bold uppercase text-red-700">
                                  ⏳ {con.durationDays}d Duration
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="border border-[#141414] bg-[#E4E3E0] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase shrink-0">
                        {con.value}
                      </span>
                    </div>

                    {/* Description */}
                    {con.description && (
                      <p className="text-[11px] font-mono opacity-75 leading-relaxed">
                        {con.description}
                      </p>
                    )}

                    {/* Threshold Trigger & Progress */}
                    <div className="pt-2 border-t border-[#141414]/15 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold">
                        <span>TRIGGER: {con.numericThreshold} STRIKES</span>
                        <span
                          className={`px-1.5 py-0.2 border text-[9px] ${
                            isResolved
                              ? 'bg-green-100 text-green-800 border-green-700'
                              : isTriggered
                              ? 'bg-red-600 text-white border-red-600 animate-pulse'
                              : 'bg-neutral-100 text-[#141414] border-[#141414]/40'
                          }`}
                        >
                          {isResolved ? 'RESOLVED' : isTriggered ? 'ACTIVE / TRIGGERED' : 'ARMED'}
                        </span>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-neutral-200 h-1.5 border border-[#141414]/30 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isTriggered ? 'bg-red-600' : 'bg-[#141414]'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.round((openStrikes.length / con.numericThreshold) * 100))}%`
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] font-mono opacity-60">
                        <span>Current: {openStrikes.length} strikes</span>
                        <span>
                          {isTriggered
                            ? 'Penalty in effect!'
                            : `${con.numericThreshold - openStrikes.length} strikes remaining`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Penalty Actions */}
                  <div className="mt-3 pt-2 border-t border-[#141414]/15 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {isTriggered && !isResolved && (
                        <button
                          onClick={() => onResolveConsequence(con._id)}
                          className="flex items-center space-x-1 border border-green-700 bg-green-700 px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-white hover:bg-green-800 cursor-pointer shadow-xs"
                        >
                          <Check className="h-3 w-3" />
                          <span>
                            {con.autoResolveStrikes !== false
                              ? `Settle & Clear ${con.numericThreshold} Strikes`
                              : 'Mark Served'}
                          </span>
                        </button>
                      )}
                      {isResolved && (
                        <span className="text-[10px] font-mono font-bold text-green-800 uppercase flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3 inline" />
                          <span>
                            Served {con.strikesResolvedCount ? `(${con.strikesResolvedCount} Strikes Cleared)` : ''}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onOpenConsequenceModal(con)}
                        className="p-1 opacity-60 hover:opacity-100 hover:text-black cursor-pointer"
                        title="Edit Penalty"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete penalty rule "${con.title}"?`)) {
                            onDeleteConsequence(con._id);
                          }
                        }}
                        className="p-1 opacity-60 hover:opacity-100 hover:text-red-600 cursor-pointer"
                        title="Delete Penalty"
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

      {/* Strikes Audit Log Header with Filters */}
      <div className="space-y-3 pt-4 border-t-2 border-[#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xs font-mono font-black uppercase tracking-wider text-[#141414] flex items-center space-x-1.5">
              <Calendar className="h-4 w-4" />
              <span>Strike Audit Log (Separated by Dates)</span>
            </h2>
            <p className="text-[10px] font-mono opacity-60">
              CHRONOLOGICAL RECORD OF INFRACTIONS GROUPED BY DATE.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search strikes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-36 sm:w-44 border border-[#141414] bg-white px-2 py-1 text-xs font-mono placeholder:opacity-50 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1 text-[10px] font-mono opacity-60 hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex border border-[#141414]">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-[#141414] text-white'
                    : 'bg-white hover:bg-neutral-100 text-[#141414]'
                }`}
              >
                All ({strikes.length})
              </button>
              <button
                onClick={() => setFilterStatus('open')}
                className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border-l border-[#141414] transition-colors cursor-pointer ${
                  filterStatus === 'open'
                    ? 'bg-red-600 text-white'
                    : 'bg-white hover:bg-neutral-100 text-[#141414]'
                }`}
              >
                Active ({openStrikes.length})
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border-l border-[#141414] transition-colors cursor-pointer ${
                  filterStatus === 'resolved'
                    ? 'bg-green-700 text-white'
                    : 'bg-white hover:bg-neutral-100 text-[#141414]'
                }`}
              >
                Resolved ({resolvedStrikes.length})
              </button>
            </div>
          </div>
        </div>

        {/* Strikes List Grouped by Date */}
        {groupedStrikes.length === 0 ? (
          <div className="border border-dashed border-[#141414] bg-white p-8 text-center text-xs font-mono opacity-60">
            {strikes.length === 0
              ? 'CLEAN RECORD. ZERO STRIKES RECORDED.'
              : 'NO STRIKES MATCH THE SELECTED FILTER.'}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedStrikes.map(group => (
              <div
                key={group.dateKey}
                className="border-2 border-[#141414] bg-white overflow-hidden shadow-xs"
              >
                {/* Date Group Header */}
                <div className="bg-[#EAE8E3] border-b-2 border-[#141414] px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-[#141414]" />
                    <span className="text-xs font-mono font-black uppercase text-[#141414] tracking-wider">
                      {group.formattedDate}
                    </span>
                    {group.relativeLabel && (
                      <span className="border border-[#141414] bg-[#141414] px-1.5 py-0.2 text-[9px] font-mono font-bold text-white uppercase">
                        {group.relativeLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] font-mono">
                    <span className="border border-[#141414] bg-white px-2 py-0.5 font-bold uppercase">
                      {group.strikes.length} {group.strikes.length === 1 ? 'Strike' : 'Strikes'}
                    </span>
                    {group.openCount > 0 && (
                      <span className="border border-red-600 bg-red-600 px-2 py-0.5 font-bold text-white uppercase">
                        {group.openCount} Active
                      </span>
                    )}
                    {group.resolvedCount > 0 && (
                      <span className="border border-green-700 bg-green-100 text-green-900 px-2 py-0.5 font-bold uppercase">
                        {group.resolvedCount} Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Strike Cards under this date */}
                <div className="p-3 space-y-2 bg-[#FAF9F5]">
                  {group.strikes.map(strike => {
                    const isOpen = strike.status === 'open';

                    return (
                      <div
                        key={strike._id}
                        className={`border-2 p-3 transition-all text-[#141414] ${
                          isOpen
                            ? 'bg-red-50 border-red-600'
                            : 'bg-white opacity-80 border-[#141414]/50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-mono text-xs font-black uppercase text-red-600">
                                STRIKE #{strike.number}
                              </span>
                              <span className="text-xs opacity-40 font-mono">·</span>
                              <span
                                className={`border border-[#141414] px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                                  isOpen
                                    ? 'bg-red-200 text-red-900'
                                    : 'bg-green-200 text-green-900'
                                }`}
                              >
                                {strike.status.toUpperCase()}
                              </span>
                              {strike.severity === 'high' && (
                                <span className="border border-red-600 bg-red-600 px-1 py-0.2 text-[9px] font-mono font-bold text-white uppercase">
                                  HIGH SEVERITY
                                </span>
                              )}
                              {strike.taskTitle && (
                                <span className="text-[10px] font-mono opacity-70 border border-[#141414]/30 px-1 py-0.2 bg-white">
                                  Task: {strike.taskTitle}
                                </span>
                              )}
                            </div>

                            <h3 className="text-xs font-mono font-bold uppercase">
                              {strike.reason}
                            </h3>

                            {strike.consequenceTitle && (
                              <p className="text-[11px] font-mono font-bold opacity-80">
                                CONSEQUENCE: {strike.consequenceTitle}{' '}
                                {strike.consequenceValue ? `(${strike.consequenceValue})` : ''}
                              </p>
                            )}

                            {strike.notes && (
                              <p className="text-[11px] font-mono opacity-70 italic">
                                Note: {strike.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                            {isOpen ? (
                              <button
                                onClick={() => setResolveStrikeId(strike._id)}
                                className="flex items-center space-x-1 border border-[#141414] bg-[#141414] px-3 py-1 text-xs font-mono font-bold uppercase text-white hover:bg-black cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Resolve</span>
                              </button>
                            ) : (
                              <span className="text-xs font-mono font-bold text-green-800 uppercase flex items-center space-x-1">
                                <CheckCircle2 className="h-3.5 w-3.5 inline" />
                                <span>Resolved</span>
                              </span>
                            )}

                            <button
                              onClick={() => {
                                if (confirm(`Delete strike #${strike.number} entry?`)) {
                                  onDeleteStrike(strike._id);
                                }
                              }}
                              className="p-1 opacity-60 hover:text-red-600 hover:opacity-100 cursor-pointer"
                              title="Delete strike"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
