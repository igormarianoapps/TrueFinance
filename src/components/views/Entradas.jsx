import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { Edit2, Trash2, Info, MoreVertical } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const Entradas = ({ filteredData, totalEntradas, openModal, handleDelete, setShowLeftoverInfo }) => {
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  return (
    <div className="space-y-6 pb-20 animate-in slide-in-from-right-4">
      <div className="grid grid-cols-1 gap-3">
        <Card className="p-3 bg-white dark:bg-[#1F1F1F] border-l-4 border-green-600 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total de Entradas</p>
          <p className="text-sm font-bold text-green-600 truncate">
            {formatCurrency(totalEntradas)}
          </p>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-end mb-3 ml-1 mr-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase dark:text-slate-400">Entradas</h3>
          <button onClick={() => openModal('entrada')} className="text-xs text-[var(--primary)] font-semibold hover:underline dark:text-[var(--primary)]">+ Adicionar</button>
        </div>
        <div className="space-y-2">
          {filteredData.entradas.map(item => (
            <div key={item.id} className="bg-white dark:bg-[#1F1F1F] p-3 rounded-lg shadow-sm border-l-4 border-green-400 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {item.isLeftover && (
                  <button onClick={() => setShowLeftoverInfo(true)} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500">
                    <Info size={16} />
                  </button>
                )}
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{item.descricao}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(item.valor)}</p>
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === item.id ? null : item.id); }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors"
                  >
                    <MoreVertical size={20} className="text-slate-400" />
                  </button>
                  
                  {activeMenu === item.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#2A2A2A] rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal('entrada', item); setActiveMenu(null); }}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-[#333] text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <Edit2 size={14} className="text-blue-500"/> Editar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id, 'entrada'); setActiveMenu(null); }}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-[#333] text-red-600 transition-colors"
                      >
                        <Trash2 size={14}/> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Fab onClick={() => openModal('entrada')} />
    </div>
  );
};