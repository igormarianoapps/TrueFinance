import React, { useState, useEffect } from 'react';
import { X, CreditCard, Wallet } from 'lucide-react';
import { toLocalISO } from '../utils/formatters';

export const Modal = ({ 
  modalOpen, 
  setModalOpen, 
  editingItem, 
  modalType, 
  handleSave, 
  data, 
  currentDate, 
  // recurrenceType e setRecurrenceType removidos das props
}) => {
  const [paymentMethod, setPaymentMethod] = useState('debit');
  const [localRecurrenceType, setLocalRecurrenceType] = useState('unico');

  useEffect(() => {
    if (modalOpen) {
      setPaymentMethod(editingItem?.paymentMethod || 'debit');
      // Inicializa o estado local de recorrência ao abrir o modal
      setLocalRecurrenceType(
        editingItem?.isRecurring ? 'mensal' : (editingItem?.parcelaInfo ? 'parcelado' : 'unico')
      );
    }
  }, [modalOpen, editingItem]); // Adicionado editingItem para resetar corretamente

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-slate-800">
             {editingItem ? 'Adicionar' : 'Novo'} {
               modalType === 'variavel' ? 'Saída' :
               modalType === 'fixo' ? 'Gasto Fixo' :
               modalType === 'provisao' ? 'Envelope' :
               modalType === 'poupanca' ? 'Poupança' :
               modalType === 'cartao' ? 'Cartão' :
               modalType
             }
           </h2>
           <button onClick={() => setModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          
          {modalType !== 'tag' && modalType !== 'cartao' && (
            <div>
              <label className="block text-sm text-slate-500 mb-1">Descrição</label>
              <input required name="descricao" defaultValue={editingItem?.descricao} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" placeholder="Ex: Mercado" />
            </div>
          )}

          {modalType === 'tag' && (
            <>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Nome da Tag</label>
              <input required name="nome" defaultValue={editingItem?.nome} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Cor (Hex)</label>
              <input type="color" name="cor" defaultValue={editingItem?.cor || '#000000'} className="w-full h-12 p-1 rounded-lg cursor-pointer" />
            </div>
            </>
          )}

          {modalType === 'cartao' && (
            <>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Nome do Cartão</label>
              <input required name="name" defaultValue={editingItem?.name} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" placeholder="Ex: Nubank" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-500 mb-1">Dia Fechamento</label>
                <input required type="number" min="1" max="31" name="closingDate" defaultValue={editingItem?.closing_date} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" placeholder="Ex: 1" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-500 mb-1">Dia Vencimento</label>
                <input required type="number" min="1" max="31" name="dueDate" defaultValue={editingItem?.due_date} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" placeholder="Ex: 10" />
              </div>
            </div>
            </>
          )}

          {modalType === 'provisao' && (
            <>
              <div className="flex gap-4">
                  <div className="flex-1">
                      <label className="block text-sm text-slate-500 mb-1">Valor Provisionado (R$)</label>
                      <input required type="number" step="0.01" name="valor" defaultValue={editingItem?.valor} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" placeholder="1200,00" />
                  </div>
                  <div className="flex-1">
                      <label className="block text-sm text-slate-500 mb-1">Vincular à Tag (Opcional)</label>
                      <select name="tagId" defaultValue={editingItem?.tagId || ''} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none">
                          <option value="">Nenhuma (Cofre)</option>
                          {data.tags.map(tag => (<option key={tag.id} value={tag.id}>{tag.nome}</option>))}
                      </select>
                  </div>
              </div>
            </>
          )}

          {modalType === 'poupanca' && (
            <>
              <div className="flex gap-4">
                  <div className="flex-1">
                      <label className="block text-sm text-slate-500 mb-1">Valor (R$)</label>
                      <input required type="number" step="0.01" name="valor" defaultValue={editingItem?.valor} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" placeholder="0,00" />
                  </div>
                  <div className="flex-1">
                      <label className="block text-sm text-slate-500 mb-1">Tipo</label>
                      <select name="tipo" defaultValue={editingItem?.tipo || 'entrada'} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none">
                          <option value="entrada">Aporte (+)</option>
                          <option value="saida">Resgate (-)</option>
                      </select>
                  </div>
              </div>
            </>
          )}

          {/* Seletor de Método de Pagamento para Saídas */}
          {modalType === 'variavel' && (
            <div className="bg-slate-50 p-1 rounded-xl flex mb-4">
              <button type="button" onClick={() => setPaymentMethod('debit')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'debit' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Wallet size={16} /> Débito
              </button>
              <button type="button" onClick={() => setPaymentMethod('credit')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'credit' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <CreditCard size={16} /> Crédito
              </button>
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
            </div>
          )}

          {/* Se for Crédito, mostra seleção de cartão */}
          {modalType === 'variavel' && paymentMethod === 'credit' && (
            <div>
              <label className="block text-sm text-slate-500 mb-1">Cartão</label>
              <select name="creditCardId" defaultValue={editingItem?.creditCardId || ''} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" required>
                <option value="" disabled>Selecione um cartão</option>
                {data.creditCards?.map(card => (
                  <option key={card.id} value={card.id}>{card.name}</option>
                ))}
              </select>
              {data.creditCards?.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Nenhum cartão cadastrado.</p>
              )}
            </div>
          )}

          {/* Recorrência: Aparece para 'fixo' OU para 'variavel' se for Crédito */}
          {((modalType === 'fixo' && !editingItem) || (modalType === 'variavel' && paymentMethod === 'credit')) && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className="block text-sm text-slate-500 mb-2">Recorrência</label>
              {/* Input hidden para garantir o envio no formulário se necessário */}
              <input type="hidden" name="recurrenceType" value={localRecurrenceType} />
              <div className="flex gap-2 mb-3">
                {['unico', 'mensal', 'parcelado'].map(type => (
                  <button type="button" key={type} onClick={(e) => { e.preventDefault(); setLocalRecurrenceType(type); }} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${localRecurrenceType === type ? 'bg-[#3457A4] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>
                    {type === 'unico' ? 'Único' : type === 'mensal' ? 'Fixo Mensal' : 'Parcelado'}
                  </button>
                ))}
              </div>
              {localRecurrenceType === 'parcelado' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº de Parcelas</label>
                  <input type="number" name="installments" min="2" defaultValue="12" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-200 outline-none" />
                </div>
              )}
            </div>
          )}

          {(modalType === 'entrada' || modalType === 'fixo' || modalType === 'variavel') && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-500 mb-1">Valor (R$)</label>
                <input required type="number" step="0.01" name="valor" defaultValue={editingItem?.valor} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" placeholder="0,00" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-500 mb-1">Data</label>
                <input name="data" type="date" defaultValue={editingItem?.data || toLocalISO(currentDate)} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" />
              </div>
            </div>
          )}

          {modalType === 'variavel' && (
            <div>
               <label className="block text-sm text-slate-500 mb-1">Tag</label>
               <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {data.tags.map(tag => (
                    <label key={tag.id} className="cursor-pointer">
                      <input type="radio" name="tagId" value={tag.id} defaultChecked={editingItem?.tagId === tag.id} className="peer sr-only" required />
                      <div className="px-3 py-1 rounded-full text-sm border peer-checked:bg-[#3457A4] peer-checked:text-white peer-checked:border-[#3457A4] transition-all text-slate-600 border-slate-200 hover:bg-slate-50">
                        #{tag.nome}
                      </div>
                    </label>
                  ))}
               </div>
            </div>
          )}

          <button type="submit" className="w-full bg-[#3457A4] dark:bg-[#3457A4] text-white py-4 rounded-xl font-bold mt-4 shadow-lg active:scale-95 transition-transform">
            Salvar Registro
          </button>
        </form>
      </div>
    </div>
  );
};