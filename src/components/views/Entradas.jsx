import React from 'react';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, Edit, Trash2, Info, Plus } from 'lucide-react';

export const Entradas = ({ filteredData, totalEntradas, openModal, handleDelete, setShowLeftoverInfo }) => {
  return (
    <div className="space-y-6 pb-20 animate-in slide-in-from-right-4">
      {/* Total Card */}
      <Card className="bg-white dark:bg-[#1F1F1F]">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Entradas no Mês</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(totalEntradas)}</p>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <TrendingUp className="text-emerald-600 dark:text-emerald-500" size={24} />
          </div>
        </div>
      </Card>

      {/* List of Entries */}
      <div className="space-y-2">
        {filteredData.entradas.map(item => {
          const isLeftover = item.isLeftover;

          return (
            <Card 
              key={item.id} 
              className={`p-3 flex justify-between items-center bg-white dark:bg-[#1F1F1F] transition-opacity ${isLeftover ? 'opacity-70' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isLeftover && (
                  <button onClick={() => setShowLeftoverInfo(true)} className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                    <Info size={18} />
                  </button>
                )}
                <div className="min-w-0">
                  <p className={`font-semibold text-slate-700 dark:text-slate-200 truncate ${isLeftover ? 'italic' : ''}`}>{item.descricao}</p>
                  <p className="text-xs text-slate-400">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-500 whitespace-nowrap">{formatCurrency(item.valor)}</span>
                
                {!isLeftover && (
                  <>
                    <button onClick={() => openModal('entrada', item)} className="p-2 text-slate-400 hover:text-blue-500 rounded-md hover:bg-slate-100 dark:hover:bg-[#2A2A2A]"><Edit size={16}/></button>
                    <button onClick={() => handleDelete(item.id, 'entrada')} className="p-2 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-[#2A2A2A]"><Trash2 size={16}/></button>
                  </>
                )}
              </div>
            </Card>
          );
        })}

        {filteredData.entradas.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm bg-white dark:bg-[#1F1F1F] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            Nenhuma entrada registrada neste mês.
          </div>
        )}
      </div>

      <Fab onClick={() => openModal('entrada')}><Plus size={24} /></Fab>
    </div>
  );
};