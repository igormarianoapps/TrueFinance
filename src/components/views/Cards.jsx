import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { CreditCard, Edit2, X, ShoppingBag, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const Cards = ({ creditCards, invoices, openModal }) => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleCardClick = (card) => {
    const invoice = (invoices || []).find(inv => inv.cardId === card.id);
    setSelectedInvoice({ card, invoice });
  };

  return (
    <div className="space-y-4 pb-20 animate-in slide-in-from-right-4">
      <div className="flex justify-between items-end mb-3">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Meus Cartões</h3>
      </div>
      <div className="space-y-2">
        {creditCards.map((card) => {
          const invoice = (invoices || []).find(inv => inv.cardId === card.id);
          const invoiceTotal = invoice ? invoice.valor : 0;
          return (
            <Card
              key={card.id}
              className="bg-white dark:bg-[#1F1F1F]"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 dark:bg-[#2A2A2A] p-2 rounded-full text-slate-600 dark:text-slate-300">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {card.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Fecha dia {card.closing_date} • Vence dia {card.due_date}
                    </p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); openModal('cartao', card); }} className="text-slate-400 hover:text-blue-500 p-2"><Edit2 size={16}/></button>
              </div>
              <div className="mt-4 flex justify-between items-end">
                 <div>
                    <p className="text-xs text-slate-400">Fatura atual</p>
                    <p className="font-bold text-xl text-slate-700 dark:text-slate-200">{formatCurrency(invoiceTotal)}</p>
                 </div>
                 <button onClick={() => handleCardClick(card)} className="text-sm font-semibold text-white bg-[#3457A4] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity active:scale-95">
                    Ver fatura atual
                 </button>
              </div>
            </Card>
          );
        })}
        {creditCards.length === 0 && (
          <div className="text-center py-4 text-slate-400 text-sm bg-slate-50 dark:bg-[#1F1F1F] rounded-lg border border-dashed border-slate-200 dark:border-slate-700">Nenhum cartão cadastrado.</div>
        )}
      </div>
      <Fab onClick={() => openModal('cartao')} className="bg-[#3457A4] text-[#12111C]" />

      {/* Modal de Detalhes da Fatura */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1F1F1F] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Fatura Atual</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedInvoice.card.name}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="bg-slate-100 dark:bg-[#2A2A2A] p-2 rounded-full hover:bg-slate-200 dark:hover:bg-[#333] transition-colors">
                <X size={20} className="text-slate-600 dark:text-slate-300"/>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-[#2A2A2A] p-4 rounded-xl mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Valor Total</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {selectedInvoice.invoice ? formatCurrency(selectedInvoice.invoice.valor) : formatCurrency(0)}
              </p>
              {selectedInvoice.invoice && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Calendar size={12} /> Vence em {new Date(selectedInvoice.invoice.data).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {selectedInvoice.invoice?.transactions?.length > 0 ? (
                selectedInvoice.invoice.transactions.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full text-orange-600 dark:text-orange-400">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{item.descricao}</p>
                        <p className="text-xs text-slate-400">{new Date(item.data).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} {item.parcelaInfo && `• ${item.parcelaInfo}`}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{formatCurrency(item.valor)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhuma compra nesta fatura.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};