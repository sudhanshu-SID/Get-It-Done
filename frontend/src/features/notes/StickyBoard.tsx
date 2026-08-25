import React, { useEffect, useState } from 'react';
import { StickyNote } from './StickyNote';
import { Note } from '../../types';
import { apiService } from '../../services/api';
import { Plus } from 'lucide-react';

interface StickyBoardProps {
  projectId?: string; // If undefined, it acts as the Today board
}

export const StickyBoard: React.FC<StickyBoardProps> = ({ projectId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const fetchedNotes = await apiService.getNotes(projectId);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    try {
      const newNote = await apiService.createNote({
        content: '',
        color: 'yellow',
        position: {
          x: window.innerWidth / 2 - 100 + (Math.random() * 40 - 20),
          y: window.innerHeight / 2 - 100 + (Math.random() * 40 - 20)
        },
        projectId: projectId || null
      });
      setNotes([...notes, newNote]);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    // Optimistic UI update
    setNotes(current => current.map(n => n._id === id ? { ...n, ...updates } : n));
    try {
      await apiService.updateNote(id, updates);
    } catch (error) {
      console.error('Failed to update note:', error);
      // Revert on fail
      fetchNotes();
    }
  };

  const handleDeleteNote = async (id: string) => {
    // Optimistic UI update
    setNotes(current => current.filter(n => n._id !== id));
    try {
      await apiService.deleteNote(id);
    } catch (error) {
      console.error('Failed to delete note:', error);
      fetchNotes();
    }
  };

  if (isLoading && notes.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" style={{ height: '100vh', width: '100vw' }}>
      {notes.map(note => (
        <StickyNote
          key={note._id}
          note={note}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
        />
      ))}
      
      {/* Floating Add Note Button */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <button
          onClick={handleAddNote}
          className="flex items-center justify-center w-12 h-12 bg-[#fef3c7] border-2 border-amber-900 text-amber-900 rounded-full shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(120,53,15,1)] transition-all cursor-pointer"
          title="Add Sticky Note"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};
