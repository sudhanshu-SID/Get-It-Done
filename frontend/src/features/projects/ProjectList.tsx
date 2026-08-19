import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Play
} from 'lucide-react';
import { Project, Task, ActiveTimer } from '../../types/index';

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  activeTimer: ActiveTimer | null;
  onOpenProjectModal: (project?: Project) => void;
  onOpenContextEditModal: (project: Project) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onStartTimer: (taskId: string) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  tasks,
  activeTimer,
  onOpenProjectModal,
  onOpenContextEditModal,
  onDeleteProject,
  onStartTimer,
  onCompleteTask
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?._id || '');

  const activeProject = projects.find(p => p._id === selectedProjectId) || projects[0];
  const projectTasks = activeProject ? tasks.filter(t => t.projectId === activeProject._id) : [];

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
          <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">Projects & State Context</h1>
          <p className="text-xs font-mono opacity-60">
            CONTINUOUS WORKFLOW CONTEXT, LEFT-OFF MILESTONES, AND UNFINISHED PHASES.
          </p>
        </div>
        <button
          onClick={() => onOpenProjectModal()}
          className="flex items-center space-x-1.5 bg-[#141414] px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-black transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="border border-dashed border-[#141414] bg-white p-8 text-center text-xs font-mono opacity-60">
          NO ACTIVE PROJECTS LOGGED. ADD A PROJECT TO TRACK CONTINUOUS STATE.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Projects Sidebar List (4 cols) */}
          <div className="lg:col-span-4 border-2 border-[#141414] bg-white divide-y divide-black/10">
            {projects.map(proj => {
              const isSelected = activeProject?._id === proj._id;
              return (
                <div
                  key={proj._id}
                  onClick={() => setSelectedProjectId(proj._id)}
                  className={`cursor-pointer p-3.5 transition-colors ${
                    isSelected
                      ? 'bg-[#141414] text-white'
                      : 'hover:bg-neutral-100 text-[#141414]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider">{proj.name}</h3>
                      <span className="text-[10px] font-mono opacity-70 block mt-0.5">
                        {proj.currentPhase}
                      </span>
                    </div>
                    <span
                      className={`border border-current px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                        proj.status === 'active'
                          ? isSelected ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                          : 'opacity-60'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono opacity-80">
                    <span>
                      TASKS: {proj.tasksCount?.completed || 0}/{proj.tasksCount?.total || 0}
                    </span>
                    <span>LOGGED: {formatMinutes(proj.totalTimeMinutes || 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Project Details & "WHERE I LEFT OFF" Context (8 cols) */}
          {activeProject && (
            <div className="lg:col-span-8 space-y-5">
              {/* Context Card */}
              <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
                <div className="flex items-start justify-between border-b-2 border-[#141414] pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-mono font-black uppercase tracking-tight">{activeProject.name}</h2>
                      <span className="border border-[#141414] bg-[#E4E3E0] px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                        {activeProject.currentPhase}
                      </span>
                    </div>
                    {activeProject.description && (
                      <p className="mt-1 text-xs opacity-75">
                        {activeProject.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onOpenContextEditModal(activeProject)}
                      className="flex items-center space-x-1 border-2 border-[#141414] bg-[#141414] px-3 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Update Context</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete project "${activeProject.name}"?`)) {
                          onDeleteProject(activeProject._id);
                        }
                      }}
                      className="p-1.5 border border-transparent hover:border-red-600 hover:bg-red-50 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Left Off Hierarchy */}
                <div className="space-y-3">
                  <div className="border border-[#141414] bg-[#E4E3E0] p-3.5 space-y-1">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase opacity-60 block">
                      Last Completed Milestone
                    </span>
                    <p className="text-xs font-mono text-[#141414]">
                      {activeProject.lastCompleted || 'No completed steps recorded yet.'}
                    </p>
                  </div>

                  <div className="border border-[#141414] bg-[#E4E3E0] p-3.5 space-y-1">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase opacity-60 block">
                      Where I Left Off (Current State)
                    </span>
                    <p className="text-xs font-mono text-[#141414] leading-relaxed">
                      {activeProject.currentState || 'Initial setup phase.'}
                    </p>
                  </div>

                  <div className="border-2 border-[#141414] bg-[#141414] text-white p-3.5 space-y-1">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-300 flex items-center space-x-1">
                      <span>Immediate Next Action</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                    <p className="text-xs font-mono leading-relaxed">
                      {activeProject.nextAction || 'Define next action step.'}
                    </p>
                  </div>
                </div>

                {activeProject.notes && (
                  <div className="border-t border-[#141414] pt-3 text-xs font-mono opacity-80">
                    <span className="font-bold">Project Notes: </span>
                    {activeProject.notes}
                  </div>
                )}
              </div>

              {/* Project Associated Tasks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]">
                    Assigned Tasks ({projectTasks.filter(t => t.status === 'completed').length}/{projectTasks.length})
                  </h3>
                </div>

                {projectTasks.length === 0 ? (
                  <div className="border border-dashed border-[#141414] bg-white p-4 text-xs font-mono opacity-60">
                    No tasks assigned to this project yet. Link tasks from the Commitments tab.
                  </div>
                ) : (
                  <div className="border-2 border-[#141414] bg-white divide-y divide-black/10">
                    {projectTasks.map(t => {
                      const isCompleted = t.status === 'completed';
                      return (
                        <div
                          key={t._id}
                          className="flex items-center justify-between p-3 text-xs hover:bg-[#141414] hover:text-white transition-colors group"
                        >
                          <div className="flex items-center space-x-2.5">
                            <button
                              onClick={() => onCompleteTask(t._id)}
                              className="opacity-70 group-hover:opacity-100 cursor-pointer shrink-0"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-700 group-hover:text-green-300" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>
                            <span className={`font-mono text-xs ${isCompleted ? 'line-through opacity-50' : 'font-bold'}`}>
                              {t.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 font-mono text-[10px] opacity-80">
                            <span>{t.actualMinutes}m / {t.estimatedMinutes}m</span>
                            {!isCompleted && activeTimer?.taskId !== t._id && (
                              <button
                                onClick={() => onStartTimer(t._id)}
                                className="flex items-center space-x-1 border border-current px-2 py-0.5 text-[10px] font-mono font-bold uppercase hover:bg-white hover:text-black transition-colors cursor-pointer"
                              >
                                <Play className="h-2.5 w-2.5 fill-current text-green-700 group-hover:text-green-300" />
                                <span>Start</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
