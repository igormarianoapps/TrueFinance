import React from 'react';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { formatCurrency } from '../../utils/formatters';
import { Trash2, Tag as TagIcon, CreditCard, Wallet } from 'lucide-react';

export const Variaveis = ({ filteredData, totalVariaveis, openModal, handleDelete }) => {
  // Helper para identificar se a transação é no crédito
  const isCredit = (item) => item.paymentMethod === 'credit' || (item.creditCardId !== null && item.creditCardId !== undefined);

  // Helper para encontrar a tag associada
  const getTag = (tagId) => {
    return filteredData.tags?.find(t => t.id === tagId);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 pb-20">
      {/* Card de Resumo */}
      <Card className="bg-white dark:bg-[#1F1F1F] shadow-lg">
        <div className="p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total de Saídas (Débito) no Mês</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalVariaveis)}</p>
        </div>
      </Card>

      {/* Lista de Saídas */}
      <div>
        <div className="flex justify-between items-center mb-3 ml-1 mr-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase">Lançamentos</h3>
        </div>
        <div className="space-y-2">
          {filteredData.variaveis.map(item => {
            const tag = getTag(item.tagId);
            return (
              <Card key={item.id} className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2A2A2A] transition-colors" onClick={() => openModal('variavel', item)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {tag ? (
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${tag.cor}20`, color: tag.cor }}>
                      <TagIcon size={20} />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-slate-100 text-slate-400 dark:bg-[#2A2A2A] dark:text-slate-500">
                      <TagIcon size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{item.descricao}</p>
                      {isCredit(item) ? (
                        <span className="flex-shrink-0 text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CreditCard size={12} /> Crédito
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Wallet size={12} /> Débito
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{tag?.nome || 'Sem Categoria'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-500 dark:text-red-400">{formatCurrency(item.valor)}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, 'variavel'); }} className="text-slate-400 hover:text-red-500 p-1 rounded-full"><Trash2 size={16} /></button>
                </div>
              </Card>
            );
          })}
          {filteredData.variaveis.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">Nenhuma saída variável neste mês.</div>
          )}
        </div>
      </div>
      <Fab onClick={() => openModal('variavel')} />
    </div>
  );
};