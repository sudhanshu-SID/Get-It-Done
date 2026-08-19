import React, { useState } from 'react';
import { Settings, Save, Key, Bot, Plus, X, Check } from 'lucide-react';
import { UserSettings } from '../../types/index';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  onOpenAgentInspector: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenAgentInspector
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [defaultTaskDuration, setDefaultTaskDuration] = useState(settings.defaultTaskDuration);
  const [strikeThreshold, setStrikeThreshold] = useState(settings.strikeThreshold);
  const [categories, setCategories] = useState(settings.customCategories);
  const [newCatInput, setNewCatInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleAddCategory = () => {
    if (!newCatInput.trim() || categories.includes(newCatInput.trim())) return;
    const updated = [...categories, newCatInput.trim()];
    setCategories(updated);
    setNewCatInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) return;
    setCategories(categories.filter(c => c !== catToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateSettings({
        userName: userName.trim(),
        timezone: timezone.trim(),
        defaultTaskDuration: Number(defaultTaskDuration) || 45,
        strikeThreshold: Number(strikeThreshold) || 10,
        customCategories: categories
      });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {/* Header */}
      <div className="border-b-2 border-[#141414] pb-4">
        <h1 className="text-xl font-black uppercase tracking-tight text-[#141414]">System Settings & Rule Engine</h1>
        <p className="text-xs font-mono opacity-60">
          SYSTEM PREFERENCES, AUTHORITATIVE TIMEZONE, ACCOUNTABILITY LIMITS, AND AGENT SECURITY.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Identity & Timezone */}
        <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
          <h2 className="text-xs font-mono font-black uppercase tracking-wider">
            USER IDENTITY & TIME ZONE
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase">
                Preferred Name / Handle
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono text-[#141414] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase">
                Authoritative Timezone
              </label>
              <input
                type="text"
                required
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Kolkata or America/Los_Angeles"
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Task & Strike Rules */}
        <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
          <h2 className="text-xs font-mono font-black uppercase tracking-wider">
            ACCOUNTABILITY & DURATION LIMITS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase">
                Default Target Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={defaultTaskDuration}
                onChange={e => setDefaultTaskDuration(Number(e.target.value))}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase">
                Penalty Strike Threshold
              </label>
              <input
                type="number"
                min="3"
                value={strikeThreshold}
                onChange={e => setStrikeThreshold(Number(e.target.value))}
                className="mt-1 w-full border border-[#141414] bg-white px-3 py-1.5 text-xs text-[#141414] font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Custom Categories Manager */}
        <div className="border-2 border-[#141414] bg-white p-5 space-y-4 text-[#141414]">
          <h2 className="text-xs font-mono font-black uppercase tracking-wider">
            TASK CATEGORIES
          </h2>

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <span
                key={cat}
                className="inline-flex items-center space-x-1.5 border border-[#141414] bg-[#E4E3E0] px-2.5 py-1 text-xs font-mono font-bold uppercase"
              >
                <span>{cat}</span>
                {categories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="opacity-50 hover:text-red-600 hover:opacity-100 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newCatInput}
              onChange={e => setNewCatInput(e.target.value)}
              placeholder="New category name (e.g. System Design, College)..."
              className="flex-1 border border-[#141414] bg-white px-3 py-1.5 text-xs font-mono text-[#141414] placeholder:opacity-50 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="flex items-center space-x-1 border border-[#141414] bg-[#141414] px-3 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-black cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Jarvis Agent Integration Banner */}
        <div className="border-2 border-[#141414] bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[#141414]">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center border border-[#141414] bg-[#E4E3E0] shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-black uppercase">Jarvis AI Personal Assistant Integration</h3>
              <p className="text-[11px] font-mono opacity-60">
                Configure bearer tokens, API permissions, and live query simulator.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAgentInspector}
            className="border-2 border-[#141414] bg-[#E4E3E0] px-3.5 py-1.5 text-xs font-mono font-bold uppercase hover:bg-neutral-300 cursor-pointer"
          >
            Open Jarvis Inspector
          </button>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {savedFeedback && (
            <span className="text-xs font-mono font-bold text-green-800 uppercase">
              Settings Saved Successfully ✓
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-1.5 border-2 border-[#141414] bg-[#141414] px-4 py-2 text-xs font-mono font-bold uppercase text-white hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
