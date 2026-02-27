import React from 'react';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { Badge } from '../ui/Badge';
import { Edit2, Trash2, Repeat, CheckCheck, Package, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const FixosEProvisoes = ({ filteredData, openModal, handleDelete, handleTogglePaid, handleSettle }) => {
  return (
    <div className="space-y-6 pb-20 animate-in slide-in-from-right-4">
      <div>
        <div className="flex justify-between items-end mb-3 ml-1 mr-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase dark:text-slate-400">Pagamentos Mensais Fixos</h3>
          <button onClick={() => openModal('fixo')} className="text-xs text-blue-600 font-semibold hover:underline dark:text-blue-400">+ Adicionar</button>
        </div>
        <div className="space-y-2">
          {filteredData.fixos.map(item => (
            <div key={item.id} className={`bg-white dark:bg-[#1F1F1F] p-3 rounded-lg shadow-sm border-l-4 flex justify-between items-center transition-all ${item.pago ? 'border-green-500 opacity-60 bg-slate-50 dark:bg-[#2A2A2A]' : 'border-red-400'}`}>
              <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleTogglePaid(item.id)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.pago ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600'}`}>
                  {item.pago && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${item.pago ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{item.descricao}</p>
                    {item.parcelaInfo && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold dark:bg-slate-700 dark:text-slate-300">{item.parcelaInfo}</span>}
                    {item.isRecurring && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 dark:bg-blue-900/30 dark:text-blue-400"><Repeat size={8}/> Fixo</span>}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Vence: {new Date(item.data).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(item.valor)}</p>
                <div className="flex gap-2 justify-end mt-1">
                  {item.groupId && !item.pago && (
                    <button onClick={(e) => { e.stopPropagation(); handleSettle(item); }} title="Quitar restante da dívida" className="text-slate-400 hover:text-green-600 dark:text-slate-500 dark:hover:text-green-400"><CheckCheck size={12}/></button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); openModal('fixo', item); }}><Edit2 size={12} className="text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400"/></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, 'fixo'); }}><Trash2 size={12} className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção de Cartões de Crédito */}
      <div>
        <div className="flex justify-between items-end mb-3 ml-1 mr-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase dark:text-slate-400">Meus Cartões</h3>
          <button onClick={() => openModal('cartao')} className="text-xs text-blue-600 font-semibold hover:underline dark:text-blue-400">+ Adicionar</button>
        </div>
        <div className="space-y-2">
          {(filteredData.creditCards || []).map(card => (
            <Card key={card.id} className="bg-white dark:bg-[#1F1F1F] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-[#2A2A2A] p-2 rounded-full text-slate-600 dark:text-slate-300"><CreditCard size={20} /></div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{card.name}</p>
                  <p className="text-xs text-slate-400">Fecha dia {card.closing_date} • Vence dia {card.due_date}</p>
                </div>
              </div>
              <button onClick={() => openModal('cartao', card)} className="text-slate-400 hover:text-blue-500"><Edit2 size={16}/></button>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-3 ml-1 mr-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase dark:text-slate-400">Envelopes (Provisões)</h3>
          <button onClick={() => openModal('provisao')} className="text-xs text-blue-600 font-semibold hover:underline dark:text-blue-400">+ Adicionar</button>
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
                  <div className="flex gap-2">
                      <button onClick={() => openModal('provisao', provisao)} className="text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400"><Edit2 size={14}/></button>
                      <button onClick={() => handleDelete(provisao.id, 'provisao')} className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="text-sm text-slate-600 mb-2 dark:text-slate-300">
                  <span>{formatCurrency(gastosNoEnvelope)}</span>
                  <span className="text-slate-400 dark:text-slate-500"> / {formatCurrency(provisao.valor)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                  <div 
                    className={`h-2.5 rounded-full ${percentual > 100 ? 'bg-red-500' : 'bg-blue-600'}`}
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