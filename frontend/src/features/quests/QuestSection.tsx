import React, { useState } from 'react';
import { Compass, CheckCircle2, Circle, Plus, Calendar, Edit3, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Quest } from '../../types/index';

interface QuestSectionProps {
  quests: Quest[];
  onOpenQuestModal: (quest?: Quest) => void;
  onCompleteQuest: (questId: string) => Promise<void>;
  onDeleteQuest: (questId: string) => Promise<void>;
}

export const QuestSection: React.FC<QuestSectionProps> = ({
  quests,
  onOpenQuestModal,
  onCompleteQuest,
  onDeleteQuest
}) => {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Partition quests into Due/Overdue and Upcoming
  const dueQuests = quests.filter(q => q.status === 'active' && q.nextDueDate <= todayStr);
  const upcomingQuests = quests.filter(q => q.status === 'active' && q.nextDueDate > todayStr);

  const handleComplete = async (questId: string) => {
    setCompletingId(questId);
    try {
      await onCompleteQuest(questId);
    } finally {
      setCompletingId(null);
    }
  };

  const formatDueBadge = (dueDateStr: string) => {
    if (dueDateStr === todayStr) {
      return (
        <span className="border border-blue-600 bg-blue-50 text-blue-800 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
          Due Today
        </span>
      );
    }
    const dueMs = new Date(dueDateStr).getTime();
    const todayMs = new Date(todayStr).getTime();
    const daysLate = Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24));
    return (
      <span className="border border-amber-600 bg-amber-50 text-amber-900 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
        {daysLate}d Overdue
      </span>
    );
  };

  const formatScheduleLabel = (quest: Quest) => {
    const interval = quest.repeatInterval === 'yearly' ? 'Yearly' : quest.repeatInterval === 'quarterly' ? 'Quarterly' : 'Monthly';
    if (quest.scheduleType === 'fixed_date') {
      return `${interval} · ${quest.targetDayOfMonth || 1}th of month`;
    }
    return `${interval} · Flexible`;
  };

  return (
    <div className="border-2 border-[#141414] bg-white p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#141414] pb-2">
        <div className="flex items-center space-x-2">
          <Compass className="h-4 w-4 text-[#141414]" />
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]">
              Monthly Quests ({dueQuests.length} Due)
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono opacity-60 hidden sm:inline">
            Non-punitive · Strikeless
          </span>
          <button
            onClick={() => onOpenQuestModal()}
            className="flex items-center space-x-1 border border-[#141414] bg-white px-2 py-0.5 text-[11px] font-mono font-bold uppercase hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
            title="Create a new Quest"
          >
            <Plus className="h-3 w-3" />
            <span>New Quest</span>
          </button>
        </div>
      </div>

      {/* Due Quests List */}
      {dueQuests.length > 0 ? (
        <div className="divide-y divide-black/10">
          {dueQuests.map(quest => {
            const isCompleting = completingId === quest._id;
            return (
              <div
                key={quest._id}
                className="group py-3 px-2 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleComplete(quest._id)}
                      disabled={isCompleting}
                      className="mt-0.5 focus:outline-none cursor-pointer shrink-0 text-[#141414] opacity-50 hover:opacity-100 hover:text-green-700 transition-all"
                      title="Mark quest completed for this month"
                    >
                      {isCompleting ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 animate-spin" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#141414]">
                          {quest.title}
                        </span>
                        {formatDueBadge(quest.nextDueDate)}
                        <span className="border border-current px-1 py-0.2 text-[9px] font-mono uppercase font-bold opacity-75">
                          {quest.category}
                        </span>
                      </div>

                      {quest.description && (
                        <p className="mt-1 text-[11px] opacity-75 line-clamp-2">
                          {quest.description}
                        </p>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-mono opacity-80">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatScheduleLabel(quest)}</span>
                        </span>
                        {quest.lastCompletedAt && (
                          <span>
                            · Last done: {quest.lastCompletedAt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpenQuestModal(quest)}
                      title="Edit quest"
                      className="p-1 hover:bg-neutral-200 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteQuest(quest._id)}
                      title="Delete quest"
                      className="p-1 hover:bg-red-100 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-2.5 text-center bg-neutral-50 border border-dashed border-black/20">
          {quests.length === 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-center space-x-1.5 text-xs font-mono font-bold text-[#141414]">
                <Compass className="h-3.5 w-3.5 text-[#141414]" />
                <span>No Quests Active Yet</span>
              </div>
              <p className="text-[11px] opacity-65 font-mono max-w-sm mx-auto">
                Set recurring monthly goals like "Update Resume & Document Learnings" to push yourself to learn every month!
              </p>
              <button
                onClick={() => onOpenQuestModal()}
                className="mt-1 bg-[#141414] text-white px-3 py-1 text-xs font-mono font-bold uppercase hover:bg-black cursor-pointer shadow-[2px_2px_0px_0px_#999]"
              >
                + Create Your First Quest
              </button>
            </div>
          ) : (
            <p className="text-xs font-mono opacity-75">
              All quests are completed for now! Next quest due on{' '}
              <strong>{upcomingQuests[0]?.nextDueDate || 'upcoming date'}</strong>.
            </p>
          )}
        </div>
      )}

      {/* Upcoming Quests Accordion */}
      {upcomingQuests.length > 0 && (
        <div className="border-t border-black/10 pt-2">
          <button
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="flex items-center space-x-1 text-[11px] font-mono font-bold uppercase opacity-75 hover:opacity-100 cursor-pointer"
          >
            {showUpcoming ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <span>Upcoming Quests ({upcomingQuests.length})</span>
          </button>

          {showUpcoming && (
            <div className="mt-2 space-y-2 pl-4 border-l-2 border-black/10">
              {upcomingQuests.map(q => (
                <div key={q._id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#141414]">{q.title}</span>
                    <span className="text-[10px] font-mono opacity-60">
                      ({formatScheduleLabel(q)})
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] font-mono">
                    <span className="opacity-75">Due {q.nextDueDate}</span>
                    <button
                      onClick={() => onOpenQuestModal(q)}
                      className="opacity-40 hover:opacity-100 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
