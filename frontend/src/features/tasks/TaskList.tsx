import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  Square,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  RotateCcw,
  Edit3,
  Trash2,
  History
} from 'lucide-react';
import { Task, Project, ActiveTimer, TaskSession } from '../../types/index';
import { apiService } from '../../services/api';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  categories: string[];
  activeTimer: ActiveTimer | null;
  onCompleteTask: (id: string) => Promise<void>;
  onStartTimer: (id: string) => Promise<void>;
  onStopTimer: () => void;
  onOpenTaskModal: (task?: Task) => void;
  onOpenRescheduleModal: (task: Task) => void;
  onDeleteTask: (id: string) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  projects,
  categories,
  activeTimer,
  onCompleteTask,
  onStartTimer,
  onStopTimer,
  onOpenTaskModal,
  onOpenRescheduleModal,
  onDeleteTask
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [inspectingSessionsTaskId, setInspectingSessionsTaskId] = useState<string | null>(null);
  const [taskSessions, setTaskSessions] = useState<TaskSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const handleInspectSessions = async (taskId: string) => {
    setInspectingSessionsTaskId(taskId);
    setLoadingSessions(true);
    try {
      const data = await apiService.getTaskSessions(taskId);
      setTaskSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    return matchesSearch && matchesCat && matchesStatus && matchesPriority;
  });

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#141414] pb-4 gap-3">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">Commitment Directory</h1>
          <p className="text-xs font-mono opacity-60">
            PERSONAL BACKLOG, RECURRING COMMITMENTS, AND WORK LOGS.
          </p>
        </div>
        <button
          onClick={() => onOpenTaskModal()}
          className="flex items-center space-x-1.5 bg-[#141414] px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-black transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Commitment</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search commitments by title or description..."
            className="w-full border border-[#141414] bg-white pl-8 pr-3 py-1.5 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:ring-1 focus:ring-black focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="border border-[#141414] bg-white px-2.5 py-1.5 text-xs font-mono text-[#141414] focus:outline-none uppercase font-bold cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="border border-[#141414] bg-white px-2.5 py-1.5 text-xs font-mono text-[#141414] focus:outline-none uppercase font-bold cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={selectedPriority}
          onChange={e => setSelectedPriority(e.target.value)}
          className="border border-[#141414] bg-white px-2.5 py-1.5 text-xs font-mono text-[#141414] focus:outline-none uppercase font-bold cursor-pointer"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="border border-dashed border-[#141414] bg-white p-8 text-center text-xs font-mono opacity-70">
          NO COMMITMENTS MATCH FILTER CONDITIONS.
        </div>
      ) : (
        <div className="border-2 border-[#141414] bg-white divide-y divide-black/10">
          {filteredTasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isCurrentActive = activeTimer?.taskId === task._id;

            return (
              <div
                key={task._id}
                className={`p-3.5 transition-colors ${
                  isCurrentActive
                    ? 'bg-[#DCDAD7] text-[#141414] border-l-4 border-l-[#141414]'
                    : isCompleted
                    ? 'opacity-60 bg-neutral-50'
                    : 'hover:bg-[#141414] hover:text-white group'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => onCompleteTask(task._id)}
                      className="mt-0.5 opacity-60 group-hover:opacity-100 cursor-pointer shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-700 group-hover:text-green-300" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isCompleted ? 'line-through opacity-50' : ''
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`border border-current px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                            task.commitmentLevel === 'required'
                              ? 'bg-amber-100 text-amber-900 group-hover:bg-amber-900 group-hover:text-amber-100'
                              : 'opacity-70'
                          }`}
                        >
                          {task.commitmentLevel === 'required' ? 'Required' : 'Optional'}
                        </span>

                        {task.priority === 'high' && (
                          <span className="border border-red-600 bg-red-50 text-red-700 group-hover:bg-red-900 group-hover:text-red-200 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase">
                            High
                          </span>
                        )}

                        {task.recurrence && task.recurrence !== 'none' && (
                          <span className="border border-blue-600 bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-blue-200 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase">
                            ↻ {task.recurrence}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="mt-0.5 text-[11px] opacity-75 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] font-mono opacity-80">
                        <span className="border border-current px-1 py-0.2 uppercase font-bold">
                          {task.category}
                        </span>

                        {task.projectName && (
                          <span>
                            {task.projectName}
                          </span>
                        )}

                        <span>DATE: {task.scheduledDate}</span>

                        <span>EST: {task.estimatedMinutes}m</span>

                        {task.actualMinutes > 0 && (
                          <span className="font-bold text-green-700 group-hover:text-green-300">
                            TRACKED: {task.actualMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {!isCompleted && (
                      <>
                        {isCurrentActive ? (
                          <button
                            onClick={onStopTimer}
                            className="flex items-center space-x-1 bg-red-600 text-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            <Square className="h-3 w-3 fill-current" />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onStartTimer(task._id)}
                            className="flex items-center space-x-1 border border-current px-2 py-0.5 text-[10px] font-mono font-bold uppercase hover:bg-white hover:text-black transition-colors cursor-pointer"
                          >
                            <Play className="h-3 w-3 fill-current text-green-700 group-hover:text-green-300" />
                            <span>Start</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenRescheduleModal(task)}
                          title="Reschedule"
                          className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleInspectSessions(task._id)}
                      title="View Time Sessions"
                      className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      <History className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenTaskModal(task)}
                      title="Edit"
                      className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete commitment "${task.title}"?`)) {
                          onDeleteTask(task._id);
                        }
                      }}
                      title="Delete"
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

      {/* Task Sessions Modal */}
      {inspectingSessionsTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md border-2 border-[#141414] bg-white text-[#141414] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-[#141414]" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider">Session Audit Log</h3>
              </div>
              <button
                onClick={() => setInspectingSessionsTaskId(null)}
                className="font-mono text-sm font-bold hover:bg-[#141414] hover:text-white px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              {loadingSessions ? (
                <p className="text-xs font-mono opacity-70">Querying database records...</p>
              ) : taskSessions.length === 0 ? (
                <p className="text-xs font-mono opacity-60 py-4 text-center">
                  No discrete sessions recorded for this task yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {taskSessions.map((s, idx) => (
                    <div
                      key={s._id || idx}
                      className="flex items-center justify-between border border-[#141414] bg-[#E4E3E0] p-2.5 text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold">SESSION {taskSessions.length - idx}</span>
                        <span className="text-[10px] opacity-60 block">
                          {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'active'}
                        </span>
                      </div>
                      <span className="font-bold text-green-700">
                        {Math.round(s.durationSeconds / 60)} MIN
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setInspectingSessionsTaskId(null)}
                className="border-2 border-[#141414] bg-[#141414] px-4 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
