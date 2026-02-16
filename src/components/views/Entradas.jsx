import React from 'react';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const Entradas = ({ filteredData, totalEntradas, openModal, handleDelete }) => {
  return (
    <div className="space-y-4 pb-20 animate-in slide-in-from-right-4">
      <Card className="bg-green-50 border-green-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full text-green-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-green-700 font-semibold uppercase">Total Recebido</p>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(totalEntradas)}</p>
          </div>
        </div>
      </Card>
      
      <div className="space-y-3">
        {filteredData.entradas.map(item => (
          <Card key={item.id} className="flex justify-between items-center py-3">
            <div>
              <p className="font-semibold text-slate-800">{item.descricao}</p>
              <p className="text-xs text-slate-400">{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-bold text-green-600">{formatCurrency(item.valor)}</span>
              <div className="flex gap-2">
                <button onClick={() => openModal('entrada', item)} className="text-slate-400 hover:text-blue-500"><Edit2 size={14}/></button>
                <button onClick={() => handleDelete(item.id, 'entrada')} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Fab onClick={() => openModal('entrada')} />
    </div>
  );
};