import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { Badge } from '../ui/Badge';
import { Edit2, Trash2, Repeat, CheckCheck, Package, MoreVertical } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const FixosEProvisoes = ({ filteredData, openModal, handleDelete, handleTogglePaid, handleSettle }) => {
  const [activeMenu, setActiveMenu] = useState(null);

  const totalFixos = filteredData.fixos.reduce((acc, item) => acc + item.valor, 0);
  const fixosPagos = filteredData.fixos.filter(item => item.pago).reduce((acc, item) => acc + item.valor, 0);
  const fixosEmAberto = totalFixos - fixosPagos;
  const totalProvisoes = filteredData.provisoes.reduce((acc, item) => acc + item.valor, 0);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  return (
    <div className="space-y-6 pb-20 animate-in slide-in-from-right-4">
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2 bg-white dark:bg-[#1F1F1F] border-l-4 border-green-600 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pagos (R$)</p>
          <p className="text-sm font-bold text-green-600 truncate text-right">
            {formatCurrency(fixosPagos).replace('R$', '').trim()}
          </p>
        </Card>

        <Card className="p-2 bg-white dark:bg-[#1F1F1F] border-l-4 border-red-500 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">A pagar (R$)</p>
          <p className="text-sm font-bold text-red-500 truncate text-right">
            {formatCurrency(fixosEmAberto).replace('R$', '').trim()}
          </p>
        </Card>

        <Card className="p-2 bg-white dark:bg-[#1F1F1F] border-l-4 border-blue-800 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total (R$)</p>
          <p className="text-sm font-bold text-[var(--primary)] truncate text-right">
            {formatCurrency(totalFixos).replace('R$', '').trim()}
          </p>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-end mb-3 ml-1 mr-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase dark:text-slate-400">Pagamentos Mensais Fixos</h3>
          <button onClick={() => openModal('fixo')} className="text-xs text-[var(--primary)] font-semibold hover:underline dark:text-[var(--primary)]">+ Adicionar</button>
        </div>
        <div className="space-y-2">
          {filteredData.fixos.map(item => (
            <div key={item.id} className={`bg-white dark:bg-[#1F1F1F] p-3 rounded-lg shadow-sm border-l-4 flex justify-between items-center transition-all ${item.pago ? 'border-green-600 opacity-60 bg-slate-50 dark:bg-[#2A2A2A]' : 'border-red-400'}`}>
              <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleTogglePaid(item.id)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.pago ? 'bg-green-600 border-green-600' : 'border-slate-300 dark:border-slate-600'}`}>
                  {item.pago && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${item.pago ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{item.descricao}</p>
                    {item.parcelaInfo && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold dark:bg-slate-700 dark:text-slate-300">{item.parcelaInfo}</span>}
                    {item.isRecurring && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 dark:bg-blue-900/30 dark:text-blue-400"><Repeat size={8}/> Fixo</span>}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Vence: {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</p>
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
                      {item.groupId && !item.pago && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSettle(item); setActiveMenu(null); }} 
                          className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-[#333] text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <CheckCheck size={14} className="text-green-600"/> Quitar Restante
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal('fixo', item); setActiveMenu(null); }}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-[#333] text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <Edit2 size={14} className="text-blue-500"/> Editar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id, 'fixo'); setActiveMenu(null); }}
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

      <div>
        <div className="flex justify-between items-end mb-3 ml-1 mr-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase dark:text-slate-400">Envelopes (Provisões)</h3>
          <button onClick={() => openModal('provisao')} className="text-xs text-[var(--primary)] font-semibold hover:underline dark:text-[var(--primary)]">+ Adicionar</button>
        </div>
        <div className="space-y-3">
          {filteredData.provisoes.map(provisao => {
            const gastosNoEnvelope = filteredData.variaveis
              .filter(g => provisao.tagId && g.tagId === provisao.tagId)
              .reduce((acc, g) => acc + g.valor, 0);
            
            const restante = provisao.valor - gastosNoEnvelope;
            const percentual = provisao.valor > 0 ? (gastosNoEnvelope / provisao.valor) * 100 : 0;
            const tag = provisao.tagId ? filteredData.tags.find(t => t.id === provisao.tagId) : null;

            return (
              <Card key={provisao.id} className="bg-white dark:bg-[#1F1F1F]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-slate-500 dark:text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{provisao.descricao}</span>
                    {tag && <Badge color={tag.cor}>{tag.nome}</Badge>}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === provisao.id ? null : provisao.id); }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] rounded-full transition-colors"
                    >
                      <MoreVertical size={18} className="text-slate-400" />
                    </button>
                    {activeMenu === provisao.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#2A2A2A] rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal('provisao', provisao); setActiveMenu(null); }}
                          className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-[#333] text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <Edit2 size={14} className="text-blue-500"/> Editar
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(provisao.id, 'provisao'); setActiveMenu(null); }}
                          className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-[#333] text-red-600 transition-colors"
                        >
                          <Trash2 size={14}/> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-600 mb-2 dark:text-slate-300">
                  <span>{formatCurrency(gastosNoEnvelope)}</span>
                  <span className="text-slate-400 dark:text-slate-500"> / {formatCurrency(provisao.valor)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                  <div 
                    className={`h-2.5 rounded-full ${percentual > 100 ? 'bg-red-500' : 'bg-[var(--primary)]'}`}
                    style={{ width: `${Math.min(percentual, 100)}%` }}
                  ></div>
                </div>
                <div className={`text-right text-xs font-medium mt-1 ${restante >= 0 ? 'text-slate-500 dark:text-slate-400' : 'text-red-600 dark:text-red-400'}`}>
                  {restante >= 0 ? `${formatCurrency(restante)} restantes` : `${formatCurrency(Math.abs(restante))} acima`}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      <Fab onClick={() => openModal('fixo')} />
    </div>
  );
};