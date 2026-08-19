import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Key,
  Shield,
  Terminal,
  Activity,
  Copy,
  Check,
  RefreshCw,
  Send,
  Lock,
  Unlock,
  Clock
} from 'lucide-react';
import { UserSettings, AccountabilityLog } from '../../types/index';
import { apiService } from '../../services/api';

interface AgentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  onRegenerateKey: () => Promise<string>;
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  isOpen,
  onClose,
  userSettings,
  onUpdateSettings,
  onRegenerateKey
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'logs' | 'permissions'>('overview');
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [logs, setLogs] = useState<AccountabilityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Simulator state
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/agent/today');
  const [simulatedResponse, setSimulatedResponse] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulatedError, setSimulatedError] = useState<string | null>(null);

  // Permissions state
  const [permissions, setPermissions] = useState(userSettings.agentPermissions);

  useEffect(() => {
    setPermissions(userSettings.agentPermissions);
  }, [userSettings]);

  useEffect(() => {
    if (isOpen && activeTab === 'logs') {
      loadLogs();
    }
  }, [isOpen, activeTab]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await apiService.getAgentLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load agent logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(userSettings.agentApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleTogglePermission = async (key: keyof typeof permissions) => {
    const updated = {
      ...permissions,
      [key]: !permissions[key]
    };
    setPermissions(updated);
    await onUpdateSettings({ agentPermissions: updated });
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimulatedError(null);
    setSimulatedResponse(null);
    try {
      const res = await apiService.simulateAgentQuery(selectedEndpoint, userSettings.agentApiKey);
      setSimulatedResponse(res);
    } catch (err: any) {
      setSimulatedError(err.message || 'Simulation error');
    } finally {
      setSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl border-2 border-[#141414] bg-white text-[#141414] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center border border-[#141414] bg-[#E4E3E0] text-[#141414]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-mono font-black uppercase tracking-wider">JARVIS AGENT INTEGRATION</h2>
                <span className="border border-[#141414] bg-green-200 px-2 py-0.5 text-[10px] font-mono font-bold text-green-900 uppercase">
                  ONLINE · AUTH READY
                </span>
              </div>
              <p className="text-xs font-mono opacity-60">
                REST API SOURCE OF TRUTH FOR EXTERNAL AI ACCOUNTABILITY AGENT.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 font-mono font-bold hover:bg-[#141414] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex border-b-2 border-[#141414] space-x-1 font-mono text-xs font-bold uppercase">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-neutral-200'
            }`}
          >
            API Status
          </button>
          <button
            onClick={() => {
              setActiveTab('simulator');
              if (!simulatedResponse) handleRunSimulation();
            }}
            className={`px-3 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-neutral-200'
            }`}
          >
            Endpoint Simulator
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-neutral-200'
            }`}
          >
            Accountability Logs
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-[#141414] text-white'
                : 'text-[#141414] hover:bg-neutral-200'
            }`}
          >
            RBAC Permissions
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4 min-h-[300px]">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* API Key Box */}
              <div className="border-2 border-[#141414] bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-[#141414]" />
                    <span className="text-xs font-mono font-bold uppercase">Agent API Bearer Key</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Regenerate Agent API key? Jarvis will need the new key.')) {
                        await onRegenerateKey();
                      }
                    }}
                    className="flex items-center space-x-1 text-[11px] font-mono font-bold uppercase opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 border border-[#141414] bg-[#E4E3E0] px-3 py-1.5 font-mono text-xs text-[#141414] font-bold">
                    {showKey
                      ? userSettings.agentApiKey
                      : userSettings.agentApiKey.substring(0, 14) + '••••••••••••••••'}
                  </div>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="border border-[#141414] bg-transparent px-2.5 py-1.5 text-xs font-mono font-bold uppercase hover:bg-neutral-200 cursor-pointer"
                  >
                    {showKey ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    onClick={handleCopyKey}
                    className="flex items-center space-x-1 border border-[#141414] bg-[#141414] px-3 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-mono opacity-70 leading-normal">
                  Pass as <code className="font-bold font-mono">Authorization: Bearer &lt;KEY&gt;</code> on all <code className="font-bold font-mono">/api/agent/*</code> calls.
                </p>
              </div>

              {/* Endpoints Quick Guide */}
              <div className="border-2 border-[#141414] bg-white p-4 text-xs">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider opacity-60">
                  AUTHORITATIVE JARVIS ENDPOINTS
                </span>
                <div className="mt-3 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between border border-[#141414] bg-[#E4E3E0] px-2.5 py-1.5">
                    <span className="font-bold uppercase">GET /api/agent/today</span>
                    <span className="opacity-75 text-[10px] uppercase">Daily commitments & timer</span>
                  </div>
                  <div className="flex items-center justify-between border border-[#141414] bg-[#E4E3E0] px-2.5 py-1.5">
                    <span className="font-bold uppercase">GET /api/agent/current-state</span>
                    <span className="opacity-75 text-[10px] uppercase">Project state & next steps</span>
                  </div>
                  <div className="flex items-center justify-between border border-[#141414] bg-[#E4E3E0] px-2.5 py-1.5">
                    <span className="font-bold uppercase">GET /api/agent/accountability</span>
                    <span className="opacity-75 text-[10px] uppercase">Strikes & unlockable rewards</span>
                  </div>
                  <div className="flex items-center justify-between border border-[#141414] bg-[#E4E3E0] px-2.5 py-1.5">
                    <span className="font-bold uppercase">POST /api/agent/log</span>
                    <span className="opacity-75 text-[10px] uppercase">Log check-in entry to history</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <select
                  value={selectedEndpoint}
                  onChange={e => setSelectedEndpoint(e.target.value)}
                  className="flex-1 border-2 border-[#141414] bg-white px-3 py-1.5 font-mono text-xs uppercase font-bold text-[#141414] focus:outline-none cursor-pointer"
                >
                  <option value="/api/agent/today">GET /api/agent/today (Daily Status & Timer)</option>
                  <option value="/api/agent/yesterday">GET /api/agent/yesterday (Prior Accomplishments)</option>
                  <option value="/api/agent/current-state">GET /api/agent/current-state (Projects Left-off)</option>
                  <option value="/api/agent/goals">GET /api/agent/goals (Goal Targets & %)</option>
                  <option value="/api/agent/accountability">GET /api/agent/accountability (Strikes & Penalties)</option>
                </select>
                <button
                  onClick={handleRunSimulation}
                  disabled={simulating}
                  className="flex items-center space-x-1.5 border-2 border-[#141414] bg-[#141414] px-3.5 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{simulating ? 'Querying...' : 'Test Request'}</span>
                </button>
              </div>

              {simulatedError && (
                <div className="border-2 border-red-600 bg-red-100 p-3 text-xs font-mono font-bold text-red-800 uppercase">
                  {simulatedError}
                </div>
              )}

              {simulatedResponse && (
                <div className="relative border-2 border-[#141414] bg-[#141414] text-white p-3">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-700 text-[10px] font-mono opacity-75 uppercase">
                    <span>STATUS: 200 OK</span>
                    <span>FORMAT: JSON</span>
                  </div>
                  <pre className="max-h-64 overflow-auto font-mono text-[11px] text-green-400 leading-relaxed scrollbar-thin">
                    {JSON.stringify(simulatedResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase">
                  AI ACCOUNTABILITY LOGS
                </span>
                <button
                  onClick={loadLogs}
                  disabled={loadingLogs}
                  className="text-xs font-mono font-bold uppercase opacity-70 hover:opacity-100 flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingLogs ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="border border-dashed border-[#141414] bg-white p-6 text-center text-xs font-mono opacity-60">
                  NO AI AGENT AUDIT LOGS RECORDED YET.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {logs.map(log => (
                    <div
                      key={log._id}
                      className="border border-[#141414] bg-white p-3 text-xs text-[#141414]"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-1.5 font-mono font-bold">
                          <span
                            className={`border border-[#141414] px-1.5 py-0.5 text-[9px] font-mono uppercase ${
                              log.actor === 'Jarvis'
                                ? 'bg-green-200 text-green-900'
                                : 'bg-[#E4E3E0] text-[#141414]'
                            }`}
                          >
                            {log.actor}
                          </span>
                          <span className="uppercase">{log.action}</span>
                        </div>
                        <span className="font-mono opacity-60 text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1.5 font-mono text-[11px] opacity-80 leading-normal">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <p className="text-xs font-mono opacity-60 uppercase">
                Control what external assistant Jarvis can read or modify via Agent REST endpoints:
              </p>

              <div className="divide-y-2 divide-[#141414] border-2 border-[#141414] bg-white">
                {Object.entries(permissions).map(([key, enabled]) => {
                  const labelMap: Record<string, { label: string; desc: string }> = {
                    read_tasks: { label: 'Read Tasks & Commitments', desc: 'Allows Jarvis to check daily tasks and active timer' },
                    read_projects: { label: 'Read Project States', desc: 'Allows Jarvis to inspect where you left off and next actions' },
                    read_goals: { label: 'Read Goals & Targets', desc: 'Allows Jarvis to check progress towards measurable goals' },
                    read_history: { label: 'Read History & Strikes', desc: 'Allows Jarvis to audit yesterday and past strike count' },
                    read_analytics: { label: 'Read Analytics Data', desc: 'Allows Jarvis to review time distribution and streaks' },
                    update_tasks: { label: 'Update Task Metadata', desc: 'Allows Jarvis to update task status or reschedule when instructed' },
                    complete_tasks: { label: 'Mark Tasks Completed', desc: 'Allows Jarvis to mark a commitment verified when finished' },
                    create_logs: { label: 'Create Accountability Logs', desc: 'Allows Jarvis to log daily checks and observations' }
                  };
                  const meta = labelMap[key] || { label: key, desc: '' };

                  return (
                    <div key={key} className="flex items-center justify-between p-3">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase">{meta.label}</span>
                        <p className="text-[11px] font-mono opacity-60">{meta.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(key as any)}
                        className={`border-2 border-[#141414] px-3 py-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                          enabled ? 'bg-[#141414] text-white' : 'bg-[#E4E3E0] text-[#141414]'
                        }`}
                      >
                        {enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t-2 border-[#141414] pt-4">
          <button
            onClick={onClose}
            className="border-2 border-[#141414] bg-[#141414] px-4 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
