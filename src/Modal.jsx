import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ 
  modalOpen, 
  setModalOpen, 
  editingItem, 
  modalType, 
  handleSave, 
  data, 
  currentDate, 
  recurrenceType, 
  setRecurrenceType 
}) => {
  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-slate-600">
             {editingItem ? 'Editar' : 'Novo'} {
               modalType === 'variavel' ? 'Gasto Variável' :
               modalType === 'entrada' ? 'Entrada' :
               modalType === 'fixo' ? 'Gasto Fixo' :
               modalType === 'provisao' ? 'Envelope' :
               modalType === 'poupanca' ? 'Poupança' :
               modalType
             }
           </h2>
           <button onClick={() => setModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          
          {modalType !== 'tag' && (
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
              <label className="block text-sm text-slate-500 mb-2">Cor</label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
                  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
                  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
                  '#ec4899', '#f43f5e', '#64748b', '#71717a', '#000000'
                ].map(color => (
                  <label key={color} className="cursor-pointer flex items-center justify-center">
                    <input type="radio" name="cor" value={color} defaultChecked={editingItem?.cor === color || (!editingItem?.cor && color === '#000000')} className="peer sr-only" />
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-slate-800 peer-checked:scale-110 transition-all shadow-sm"
                      style={{ backgroundColor: color }}
                    ></div>
                  </label>
                ))}
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
                      <select name="tipoPoupanca" defaultValue={editingItem?.tipoPoupanca || 'entrada'} className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none">
                          <option value="entrada">Aporte (+)</option>
                          <option value="saida">Resgate (-)</option>
                      </select>
                  </div>
              </div>
            </>
          )}

          {modalType === 'fixo' && !editingItem && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className="block text-sm text-slate-500 mb-2">Recorrência</label>
              <div className="flex gap-2 mb-3">
                {['unico', 'mensal', 'parcelado'].map(type => (
                  <button type="button" key={type} onClick={() => setRecurrenceType(type)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${recurrenceType === type ? 'bg-violet-700 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>
                    {type === 'unico' ? 'Único' : type === 'mensal' ? 'Fixo Mensal' : 'Parcelado'}
                  </button>
                ))}
              </div>
              {recurrenceType === 'parcelado' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nº de Parcelas</label>
                  <input required type="number" name="installments" min="2" defaultValue="12" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-200 outline-none" />
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
                <label className="block text-sm text-slate-500 mb-1">Dia ({currentDate.toLocaleDateString('pt-BR', { month: 'long' })})</label>
                <input 
                  required 
                  name="day" 
                  type="number" 
                  min="1" 
                  max={new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}
                  defaultValue={editingItem ? parseInt(editingItem.data.split('-')[2]) : 1} 
                  className="w-full p-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-slate-200 outline-none" 
                />
              </div>
            </div>
          )}

          {modalType === 'variavel' && (
            <div>
               <label className="block text-sm text-slate-500 mb-1">Tag</label>
               <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {data.tags.map(tag => (
                    <label key={tag.id} className="cursor-pointer">
                      <input type="radio" name="tagId" value={tag.id} defaultChecked={editingItem?.tagId === tag.id} className="peer sr-only" />
                      <div className="px-3 py-1 rounded-full text-sm border peer-checked:bg-violet-700 peer-checked:text-white peer-checked:border-violet-700 transition-all text-slate-600 border-slate-200 hover:bg-slate-50">
                        #{tag.nome}
                      </div>
                    </label>
                  ))}
               </div>
            </div>
          )}

          <button type="submit" className="w-full bg-gradient-to-r from-[#4F39F6] to-[#860BDD] text-white py-4 rounded-xl font-bold mt-4 shadow-lg shadow-violet-200 active:scale-95 transition-transform">
            Salvar Registro
          </button>
        </form>
      </div>
    </div>
  );
};
