import React, { useState, useEffect } from 'react';
import { X, CreditCard, Wallet, Check } from 'lucide-react';
import { toLocalISO } from '../utils/formatters';

const predefinedColors = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  '#795548', '#9E9E9E', '#607D8B', '#455A64'
];

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
  const [selectedTagColor, setSelectedTagColor] = useState(predefinedColors[0]);

  useEffect(() => {
    if (modalOpen) {
      setPaymentMethod(editingItem?.paymentMethod || 'debit');
      // Inicializa o estado local de recorrência ao abrir o modal
      setLocalRecurrenceType(
        editingItem?.isRecurring ? 'mensal' : (editingItem?.parcelaInfo ? 'parcelado' : 'unico')
      );
      if (modalType === 'tag') {
        setSelectedTagColor(editingItem?.cor || predefinedColors[0]);
      }
    }
  }, [modalOpen, editingItem, modalType]); // Adicionado editingItem para resetar corretamente

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#1F1F1F] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
             {editingItem?.id ? 'Editar' : 'Novo'} {
               modalType === 'variavel' ? 'Saída' :
               modalType === 'fixo' ? 'Gasto Fixo' :
               modalType === 'provisao' ? 'Envelope' :
               modalType === 'poupanca' ? 'Poupança' :
               modalType === 'cartao' ? 'Cartão' :
               modalType
             }
           </h2>
           <button onClick={() => setModalOpen(false)} className="bg-slate-100 dark:bg-[#2A2A2A] p-2 rounded-full hover:bg-slate-200 dark:hover:bg-[#333] text-slate-500 dark:text-slate-400"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          
          {modalType !== 'tag' && modalType !== 'cartao' && (
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Descrição</label>
              <input required name="descricao" defaultValue={editingItem?.descricao} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" placeholder="Ex: Mercado" />
            </div>
          )}

          {modalType === 'tag' && (
            <>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Nome da Tag</label>
              <input required name="nome" defaultValue={editingItem?.nome} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" />
            </div>
            <input type="hidden" name="cor" value={selectedTagColor} />
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Cor</label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {predefinedColors.map(color => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setSelectedTagColor(color)}
                    className="w-8 h-8 rounded-full cursor-pointer transition-all transform hover:scale-110 focus:outline-none flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    {selectedTagColor === color && <Check size={18} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
            </>
          )}

          {modalType === 'cartao' && (
            <>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Nome do Cartão</label>
              <input required name="name" defaultValue={editingItem?.name} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" placeholder="Ex: Nubank" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Dia Fechamento</label>
                <input required type="number" min="1" max="31" name="closingDate" defaultValue={editingItem?.closing_date} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" placeholder="Ex: 1" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Dia Vencimento</label>
                <input required type="number" min="1" max="31" name="dueDate" defaultValue={editingItem?.due_date} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" placeholder="Ex: 10" />
              </div>
            </div>
            </>
          )}

          {modalType === 'provisao' && (
            <>
              <div className="flex gap-4">
                  <div className="flex-1">
                      <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Valor Provisionado (R$)</label>
                      <input required type="number" step="0.01" name="valor" defaultValue={editingItem?.valor} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" placeholder="1200,00" />
                  </div>
                  <div className="flex-1">
                      <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Vincular à Tag (Opcional)</label>
                      <select name="tagId" defaultValue={editingItem?.tagId || ''} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none">
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
                      <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Valor (R$)</label>
                      <input required type="number" step="0.01" name="valor" defaultValue={editingItem?.valor} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" placeholder="0,00" />
                  </div>
                  <div className="flex-1">
                      <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
                      <select name="tipoPoupanca" defaultValue={editingItem?.tipoPoupanca || 'entrada'} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none">
                          <option value="entrada">Aporte (+)</option>
                          <option value="saida">Resgate (-)</option>
                      </select>
                  </div>
              </div>
            </>
          )}

          {/* Seletor de Método de Pagamento para Saídas */}
          {modalType === 'variavel' && (
            <div className="bg-slate-50 dark:bg-[#2A2A2A] p-1 rounded-xl flex mb-4">
              <button type="button" onClick={() => setPaymentMethod('debit')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'debit' ? 'bg-white dark:bg-[#333] text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <Wallet size={16} /> Débito
              </button>
              <button type="button" onClick={() => setPaymentMethod('credit')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'credit' ? 'bg-white dark:bg-[#333] text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <CreditCard size={16} /> Crédito
              </button>
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
            </div>
          )}

          {/* Se for Crédito, mostra seleção de cartão */}
          {modalType === 'variavel' && paymentMethod === 'credit' && (
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Cartão</label>
              <select name="creditCardId" defaultValue={editingItem?.creditCardId || ''} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" required>
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
          {(modalType === 'fixo' || (modalType === 'variavel' && paymentMethod === 'credit')) && (
            <div className="bg-slate-50 dark:bg-[#2A2A2A] p-3 rounded-lg border border-slate-100 dark:border-[#333]">
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Recorrência</label>
              {/* Input hidden para garantir o envio no formulário se necessário */}
              <input type="hidden" name="recurrenceType" value={localRecurrenceType} />
              <div className="flex gap-2 mb-3">
                {['unico', 'mensal', 'parcelado'].map(type => (
                  <button type="button" key={type} onClick={(e) => { e.preventDefault(); setLocalRecurrenceType(type); }} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${localRecurrenceType === type ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-white dark:bg-[#333] text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-[#444]'}`}>
                    {type === 'unico' ? 'Único' : type === 'mensal' ? 'Fixo Mensal' : 'Parcelado'}
                  </button>
                ))}
              </div>
              {localRecurrenceType === 'parcelado' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nº de Parcelas</label>
                  <input type="number" name="installments" min="2" defaultValue="12" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200 outline-none" />
                </div>
              )}
            </div>
          )}

          {(modalType === 'entrada' || modalType === 'fixo' || modalType === 'variavel') && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Valor (R$)</label>
                <input required type="number" step="0.01" name="valor" defaultValue={editingItem?.valor} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" placeholder="0,00" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Data</label>
                <input name="data" type="date" defaultValue={editingItem?.data || toLocalISO(currentDate)} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" />
              </div>
            </div>
          )}

          {modalType === 'variavel' && (
            <div>
               <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Tag</label>
               <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {data.tags.map(tag => (
                    <label key={tag.id} className="cursor-pointer">
                      <input type="radio" name="tagId" value={tag.id} defaultChecked={editingItem?.tagId === tag.id} className="peer sr-only" required />
                      <div className="px-3 py-1 rounded-full text-sm border peer-checked:bg-[var(--primary)] peer-checked:text-white peer-checked:border-[var(--primary)] transition-all text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#444] hover:bg-slate-50 dark:hover:bg-[#333]">
                        #{tag.nome}
                      </div>
                    </label>
                  ))}
               </div>
            </div>
          )}

          <button type="submit" className="w-full bg-[var(--primary)] dark:bg-[var(--primary)] text-white py-4 rounded-xl font-bold mt-4 shadow-lg active:scale-95 transition-transform">
            Salvar Registro
          </button>
        </form>
      </div>
    </div>
  );
};