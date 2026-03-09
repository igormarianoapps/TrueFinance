import React from 'react';
import { Plus } from 'lucide-react';

export const Fab = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="fixed bottom-6 right-6 bg-[var(--primary)] text-white p-4 rounded-full shadow-lg hover:bg-[var(--primary)] transition-all active:scale-95 z-40"
  >
    <Plus size={24} />
  </button>
);