import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trash2, Edit2, Check } from 'lucide-react';
import { Note } from '../../types';

interface StickyNoteProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

const COLOR_MAP = {
  yellow: 'bg-[#fef3c7] text-amber-900 border-amber-300',
  pink: 'bg-[#fce7f3] text-pink-900 border-pink-300',
  blue: 'bg-[#e0f2fe] text-sky-900 border-sky-300',
  green: 'bg-[#dcfce7] text-emerald-900 border-emerald-300',
};

export const StickyNote: React.FC<StickyNoteProps> = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [isHovered, setIsHovered] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleDragEnd = (event: any, info: any) => {
    const newX = Math.max(0, note.position.x + info.offset.x);
    const newY = Math.max(0, note.position.y + info.offset.y);
    onUpdate(note._id, { position: { x: newX, y: newY } });
  };

  const handleSave = () => {
    setIsEditing(false);
    if (content !== note.content) {
      onUpdate(note._id, { content });
    }
  };

  const colorClass = COLOR_MAP[note.color] || COLOR_MAP.yellow;

  // Determine if we should show the full note or the shrunken version
  const isExpanded = isHovered || isEditing || content.length === 0;

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={{ x: note.position.x, y: note.position.y }}
      animate={{ 
        x: note.position.x, 
        y: note.position.y,
        width: isExpanded ? 220 : 120,
        height: isExpanded ? 220 : 40,
        opacity: isExpanded ? 1 : 0.8
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ position: 'absolute' }}
      className={`absolute shadow-lg border-2 flex flex-col overflow-hidden pointer-events-auto cursor-grab active:cursor-grabbing ${colorClass} z-40`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => { if (!isHovered) setIsHovered(true) }}
    >
      {/* Header/Drag Handle */}
      <div className="h-8 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition-opacity bg-black/5 shrink-0">
        <div className="flex gap-1">
          {['yellow', 'pink', 'blue', 'green'].map(c => (
            <button 
              key={c}
              onClick={(e) => { e.stopPropagation(); onUpdate(note._id, { color: c as any }); }}
              className={`w-3 h-3 rounded-full border border-black/20 ${c === note.color ? 'ring-2 ring-black/50' : ''}`}
              style={{ backgroundColor: c === 'yellow' ? '#fde68a' : c === 'pink' ? '#fbcfe8' : c === 'blue' ? '#bae6fd' : '#bbf7d0' }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
             <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="p-1 hover:bg-black/10 rounded cursor-pointer"><Check size={14} /></button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 hover:bg-black/10 rounded cursor-pointer"><Edit2 size={14} /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(note._id); }} className="p-1 hover:bg-red-500/20 text-red-700 rounded cursor-pointer"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-hidden relative">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => { if (e.key === 'Escape') handleSave(); }}
            className="w-full h-full bg-transparent resize-none outline-none font-sans text-sm"
            placeholder="Type a note..."
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()} // Stop drag when clicking inside textarea
          />
        ) : (
          <div 
            className="w-full h-full font-sans text-sm whitespace-pre-wrap overflow-hidden"
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          >
            {isExpanded ? content || <span className="opacity-50 italic text-xs">Double click to edit...</span> : <span className="font-bold truncate block">{content.substring(0, 20) || 'New Note...'}</span>}
          </div>
        )}
      </div>
      
      {/* Tape effect on top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/40 -translate-y-2 rotate-2 shadow-sm border border-black/5" />
    </motion.div>
  );
};
