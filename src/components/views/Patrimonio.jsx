import React from 'react';
import { Card } from '../ui/Card';
import { Fab } from '../ui/Fab';
import { Wallet, PiggyBank, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const Patrimonio = ({ data, filteredData, currentDate, openModal, handleDelete }) => {
  // 1. Cálculo da Poupança (Savings)
  // Saldo Anterior: Tudo que aconteceu antes do dia 1 deste mês
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const inicioMesStr = `${year}-${month}-01`;

  const poupancaAnterior = (data.poupanca || []).filter(item => item.data < inicioMesStr).reduce((acc, item) => {
    return acc + (item.tipoPoupanca === 'entrada' ? item.valor : -item.valor);
  }, 0);

  const movimentacaoPoupancaMes = filteredData.poupanca.reduce((acc, item) => {
    return acc + (item.tipoPoupanca === 'entrada' ? item.valor : -item.valor);
  }, 0);

  const poupancaAtual = poupancaAnterior + movimentacaoPoupancaMes;

  // 2. Cálculo do Saldo em Conta (Total Disponível: Conta + Poupança)
  const totalEntradas = filteredData.entradas.reduce((acc, item) => acc + item.valor, 0);
  const totalVariaveis = filteredData.variaveis.reduce((acc, item) => acc + item.valor, 0);
  const totalFixos = filteredData.fixos.reduce((acc, item) => acc + item.valor, 0);
  
  // Saldo Total = (Entradas do mês - Gastos do mês) + Saldo anterior da poupança
  const saldoContaCalculado = totalEntradas - totalVariaveis - totalFixos + poupancaAnterior;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
     <div className="bg-[#3457A4] dark:bg-[#1F1F1F] text-white shadow-xl p-6 rounded-2xl">
       <div className="flex flex-col gap-4">
         <div>
           <p className="text-slate-400 text-sm mb-1">Patrimônio Total</p>
           <div className="flex items-center gap-2">
             <Wallet size={24} className="text-green-400" />
             <span className="text-3xl font-bold">{formatCurrency(saldoContaCalculado)}</span>
           </div>
         </div>
         
         <div className="h-px bg-slate-700 w-full my-1"></div>

         <div className="grid grid-cols-2 gap-4">
           <div>
              <p className="text-slate-400 text-xs mb-1">Terminei o mês com (Poupança)</p>
              <span className="text-lg font-semibold">{formatCurrency(poupancaAnterior)}</span>
           </div>
           <div>
              <p className="text-slate-400 text-xs mb-1">Meta mês atual (Poupança)</p>
              <span className="text-lg font-semibold text-yellow-400">{formatCurrency(poupancaAtual)}</span>
           </div>
         </div>
       </div>
     </div>

     <div>
       <div className="flex justify-between items-end mb-3 ml-1 mr-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase">Histórico da Poupança</h3>
          <button onClick={() => openModal('poupanca')} className="text-xs text-[#3457A4] dark:text-white font-semibold hover:underline">+ Movimentação</button>
       </div>
       <div className="space-y-2">
          {filteredData.poupanca.map(item => (
            <Card key={item.id} className="py-3 flex justify-between items-center bg-white dark:bg-[#1F1F1F]">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.tipoPoupanca === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                     <PiggyBank size={20} />
                  </div>
                  <div>
                     <p className="font-semibold text-slate-600 dark:text-slate-200">{item.descricao}</p>
                     <p className="text-xs text-slate-400">{item.tipoPoupanca === 'entrada' ? 'Aporte' : 'Resgate'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <span className={`font-bold ${item.tipoPoupanca === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.tipoPoupanca === 'entrada' ? '+' : '-'}{formatCurrency(item.valor)}
                  </span>
                  <button onClick={() => handleDelete(item.id, 'poupanca')} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
               </div>
            </Card>
          ))}
          {filteredData.poupanca.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">Nenhuma movimentação neste mês.</div>
          )}
       </div>
     </div>
     <Fab onClick={() => openModal('poupanca')} className="bg-[#3457A4] text-[#3457A4] dark:text-[#0B0C0C]" />
    </div>
  );
};