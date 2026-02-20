import React from 'react';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { Badge } from '../ui/Badge';
import { Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const Variaveis = ({ filteredData, totalVariaveis, openModal, handleDelete }) => {
  return (
    <div className="space-y-4 pb-20 animate-in slide-in-from-right-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Gastos Variáveis</h3>
        <span className="text-sm font-semibold bg-red-100 text-red-600 px-3 py-1 rounded-full dark:bg-red-900/30 dark:text-red-400">{formatCurrency(totalVariaveis)}</span>
      </div>

      <div className="space-y-3">
        {filteredData.variaveis.map(item => {
          const tag = filteredData.tags.find(t => t.id === Number(item.tagId));
          return (
            <Card key={item.id} className="flex flex-col gap-2 relative overflow-hidden group bg-white dark:bg-[#1F1F1F]">
               {tag && (
                 <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: tag.cor }}></div>
               )}
               <div className="flex justify-between items-start pl-2">
                 <div>
                   <p className="font-semibold text-slate-800 text-base dark:text-slate-200">{item.descricao}</p>
                   {tag && <Badge color={tag.cor}>{tag.nome}</Badge>}
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.valor)}</p>
                   <div className="flex gap-3 mt-2 justify-end">
                     <button onClick={() => openModal('variavel', item)} className="text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400"><Edit2 size={16}/></button>
                     <button onClick={() => handleDelete(item.id, 'variavel')} className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"><Trash2 size={16}/></button>
                   </div>
                 </div>
               </div>
            </Card>
          );
        })}
      </div>
      <Fab onClick={() => openModal('variavel')} className="bg-[#E95415] text-[#12111C]" />
    </div>
  );
};