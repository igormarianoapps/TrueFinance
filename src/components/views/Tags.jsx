import React from 'react';
import { Fab } from '../ui/Fab';
import { Edit2 } from 'lucide-react';

export const Tags = ({ filteredData, openModal }) => {
  return (
    <div className="space-y-4 pb-20 animate-in slide-in-from-right-4">
      <div className="grid grid-cols-2 gap-3">
        {filteredData.tags.map(tag => (
          <div key={tag.id} className="bg-white dark:bg-[#1F1F1F] p-4 rounded-xl shadow-sm border border-slate-100 dark:border-[#1F1F1F] flex flex-col items-center justify-center gap-2 relative group hover:shadow-md transition-shadow">
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: tag.cor }}></div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{tag.nome}</span>
            <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => openModal('tag', tag)}><Edit2 size={14} className="text-slate-400 hover:text-blue-500"/></button>
            </div>
          </div>
        ))}
      </div>
      <Fab onClick={() => openModal('tag')} />
    </div>
  );
};