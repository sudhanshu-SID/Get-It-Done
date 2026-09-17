import React, { useState } from 'react';
import { Compass, Plus, Calendar, CheckCircle2, Circle, Edit3, Trash2, Check, Clock } from 'lucide-react';
import { Quest } from '../../types/index';

interface QuestListProps {
  quests: Quest[];
  onOpenQuestModal: (quest?: Quest) => void;
  onCompleteQuest: (questId: string) => Promise<void>;
  onDeleteQuest: (questId: string) => Promise<void>;
}

export const QuestList: React.FC<QuestListProps> = ({
  quests,
  onOpenQuestModal,
  onCompleteQuest,
  onDeleteQuest
}) => {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'due' | 'upcoming'>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const dueQuests = quests.filter(q => q.status === 'active' && q.nextDueDate <= todayStr);
  const upcomingQuests = quests.filter(q => q.status === 'active' && q.nextDueDate > todayStr);

  const displayedQuests = quests.filter(q => {
    if (q.status === 'archived') return false;
    if (filter === 'due') return q.nextDueDate <= todayStr;
    if (filter === 'upcoming') return q.nextDueDate > todayStr;
    return true;
  });

  const handleComplete = async (questId: string) => {
    setCompletingId(questId);
    try {
      await onCompleteQuest(questId);
    } finally {
      setCompletingId(null);
    }
  };

  const getDaysDiffText = (dueDateStr: string) => {
    const dueMs = new Date(dueDateStr).getTime();
    const todayMs = new Date(todayStr).getTime();
    const diffDays = Math.floor((dueMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="border border-red-600 bg-red-50 text-red-700 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
          {Math.abs(diffDays)}d Overdue
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="border border-blue-600 bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
          Due Today
        </span>
      );
    }
    return (
      <span className="border border-black/20 bg-neutral-100 text-[#141414] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
        In {diffDays} days
      </span>
    );
  };

  const formatSchedule = (quest: Quest) => {
    const interval = quest.repeatInterval === 'yearly' ? 'Yearly' : quest.repeatInterval === 'quarterly' ? 'Quarterly' : 'Monthly';
    if (quest.scheduleType === 'fixed_date') {
      return `${interval} · Exact ${quest.targetDayOfMonth || 1}th of month`;
    }
    return `${interval} · Flexible (After Completion)`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#141414] pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="h-5 w-5 text-[#141414]" />
            <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">
              Recurring Milestones & Quests
            </h1>
          </div>
          <p className="text-xs font-mono opacity-60 mt-1">
            LONG-HORIZON FORCING FUNCTIONS (MONTHLY, QUARTERLY, YEARLY). NON-PUNITIVE & STREAK-SAFE.
          </p>
        </div>
        <button
          onClick={() => onOpenQuestModal()}
          className="flex items-center space-x-1.5 bg-[#141414] px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-black transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Quest</span>
        </button>
      </div>

      {/* Overview Stats & Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[#141414] bg-white p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-neutral-100'
            }`}
          >
            All Quests ({quests.length})
          </button>
          <button
            onClick={() => setFilter('due')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              filter === 'due'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-neutral-100'
            }`}
          >
            Due Now ({dueQuests.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              filter === 'upcoming'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-neutral-100'
            }`}
          >
            Upcoming ({upcomingQuests.length})
          </button>
        </div>

        <div className="text-[11px] font-mono opacity-60">
          Streak-Safe: Quests never trigger strikes or break daily streaks.
        </div>
      </div>

      {/* Quests Grid */}
      {displayedQuests.length === 0 ? (
        <div className="border border-dashed border-[#141414] bg-white p-8 text-center text-xs font-mono">
          <div className="max-w-md mx-auto space-y-2">
            <p className="font-bold uppercase text-[#141414]">No Quests Found</p>
            <p className="opacity-60 text-[11px]">
              {filter === 'all'
                ? "You haven't set up any recurring quests yet. Add your first quest (like updating your resume every month) to force yourself to learn continuously!"
                : `No quests matching the "${filter}" filter.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => onOpenQuestModal()}
                className="mt-2 bg-[#141414] text-white px-3 py-1 text-xs font-mono font-bold uppercase hover:bg-black cursor-pointer"
              >
                + Create First Quest
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedQuests.map(quest => {
            const isDue = quest.nextDueDate <= todayStr;
            const isCompleting = completingId === quest._id;
            const completionsCount = quest.completionHistory?.length || 0;

            return (
              <div
                key={quest._id}
                className={`border-2 border-[#141414] bg-white p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow text-[#141414] ${
                  isDue ? 'border-l-6 border-l-[#141414]' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="border border-[#141414] bg-[#E4E3E0] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
                        {quest.category}
                      </span>
                      {getDaysDiffText(quest.nextDueDate)}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onOpenQuestModal(quest)}
                        className="p-1 hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
                        title="Edit Quest"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteQuest(quest._id)}
                        className="p-1 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                        title="Delete Quest"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-2 text-sm font-mono font-black uppercase tracking-wider">
                    {quest.title}
                  </h3>

                  {quest.description && (
                    <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed font-sans line-clamp-3">
                      {quest.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t border-black/10">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="opacity-65">Schedule:</span>
                    <span className="font-bold">{formatSchedule(quest)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="opacity-65 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Next Due:</span>
                    </span>
                    <span className="font-bold">{quest.nextDueDate}</span>
                  </div>

                  {quest.lastCompletedAt && (
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="opacity-65 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last Completed:</span>
                      </span>
                      <span>{quest.lastCompletedAt}</span>
                    </div>
                  )}

                  {completionsCount > 0 && (
                    <div className="flex items-center justify-between text-[10px] font-mono opacity-75">
                      <span>Total Cycles Completed:</span>
                      <span className="font-bold">{completionsCount}x</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleComplete(quest._id)}
                    disabled={isCompleting}
                    className={`w-full py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      isDue
                        ? 'bg-[#141414] text-white hover:bg-black shadow-[2px_2px_0px_0px_#999]'
                        : 'border border-[#141414] bg-white text-[#141414] hover:bg-neutral-100'
                    }`}
                  >
                    {isCompleting ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 animate-spin text-green-400" />
                        <span>RECORDING...</span>
                      </>
                    ) : isDue ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>MARK COMPLETED</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-3.5 w-3.5 opacity-50" />
                        <span>COMPLETE EARLY</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
