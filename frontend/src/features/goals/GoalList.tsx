import React from 'react';
import { Target, Plus, CheckCircle2, Clock, Calendar, Edit3, Trash2 } from 'lucide-react';
import { Goal } from '../../types/index';

interface GoalListProps {
  goals: Goal[];
  onOpenGoalModal: (goal?: Goal) => void;
  onDeleteGoal: (id: string) => Promise<void>;
}

export const GoalList: React.FC<GoalListProps> = ({
  goals,
  onOpenGoalModal,
  onDeleteGoal
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#141414] pb-4 gap-3">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">Milestone Directives & Goals</h1>
          <p className="text-xs font-mono opacity-60">
            QUANTIFIABLE TARGETS FOR PROBLEM SETS, DEEP WORK LOGS, AND SPRINT VELOCITY.
          </p>
        </div>
        <button
          onClick={() => onOpenGoalModal()}
          className="flex items-center space-x-1.5 bg-[#141414] px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-black transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="border border-dashed border-[#141414] bg-white p-8 text-center text-xs font-mono opacity-60">
          NO MEASURABLE GOALS CONFIGURED. INITIALIZE TARGET METRICS TO TRACK PROGRESS.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => {
            const percentage = Math.min(100, Math.round((goal.currentValue / (goal.targetValue || 1)) * 100));
            const isAchieved = goal.status === 'achieved' || percentage >= 100;
            
            let daysRemainingText = null;
            if (goal.endDate && !isAchieved) {
              const end = new Date(goal.endDate);
              const now = new Date();
              // Reset time to properly calculate full days
              end.setHours(0,0,0,0);
              now.setHours(0,0,0,0);
              const diffTime = end.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays < 0) {
                daysRemainingText = <span className="text-red-600 font-bold">EXPIRED</span>;
              } else if (diffDays === 0) {
                daysRemainingText = <span className="text-red-600 font-bold animate-pulse">EXPIRES TODAY</span>;
              } else {
                daysRemainingText = <span className="text-red-600 font-bold">{diffDays} DAYS LEFT</span>;
              }
            }

            return (
              <div
                key={goal._id}
                className="border-2 border-[#141414] bg-white p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow text-[#141414]"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      {goal.category && (
                        <span className="border border-[#141414] bg-[#E4E3E0] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase">
                          {goal.category}
                        </span>
                      )}
                      <h3 className="mt-1.5 text-xs font-mono font-black uppercase tracking-wider">{goal.title}</h3>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onOpenGoalModal(goal)}
                        className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete goal "${goal.title}"?`)) {
                            onDeleteGoal(goal._id);
                          }
                        }}
                        className="p-1 opacity-60 hover:text-red-600 hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="mt-2 text-xs font-mono opacity-75 leading-relaxed">
                      {goal.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t-2 border-[#141414]">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span>
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                    <span className={isAchieved ? 'text-green-700 font-black' : 'opacity-80'}>
                      {percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full border border-[#141414] bg-[#E4E3E0] overflow-hidden p-0.5">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isAchieved ? 'bg-green-700' : 'bg-[#141414]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                    <span className="opacity-70">DEADLINE: {goal.endDate}</span>
                    {isAchieved ? (
                      <span className="text-green-800 font-bold uppercase">ACHIEVED ✓</span>
                    ) : (
                      daysRemainingText
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
