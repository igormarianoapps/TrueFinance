import React from 'react';
import { Card } from '../ui/Card';
import { Wallet, ArrowUpRight, ArrowDownRight, PieChart, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const BarChart = ({ data, total }) => (
  <div className="space-y-4">
    {data.map((item, idx) => (
      <div key={idx}>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-slate-700 flex items-center gap-2">
             <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.cor}}></div>
             {item.label}
          </span>
          <span className="font-bold text-slate-700">{formatCurrency(item.valor)}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="h-2 rounded-full" style={{ width: `${total > 0 ? (item.valor / total) * 100 : 0}%`, backgroundColor: item.cor }}></div>
        </div>
      </div>
    ))}
  </div>
);

export const Dashboard = ({
  saldoFinal,
  totalEntradas,
  totalFixos,
  totalGastoProvisionadoEfetivo,
  totalGastosNaoProvisionados,
  filteredData,
  chartData,
  totalVariaveis
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const contasProximas = filteredData.fixos
    .filter(f => !f.pago)
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 5);

  const envelopesCriticos = filteredData.provisoes.filter(p => {
    if (!p.tagId) return false;
    const gasto = filteredData.variaveis.filter(v => v.tagId === p.tagId).reduce((acc, v) => acc + v.valor, 0);
    return p.valor > 0 && gasto > p.valor * 0.9;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      
      {/* 1. Hero Card: Sobra Projetada */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
         <div className={`absolute top-0 right-0 p-4 opacity-10 ${saldoFinal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
           <Wallet size={100} />
         </div>
         <span className="text-sm font-medium text-slate-500 relative z-10">Sobra Projetada (Poder de Compra)</span>
         <div className="flex items-baseline gap-2 mt-1 relative z-10">
            <h2 className={`text-4xl font-bold ${saldoFinal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
               {formatCurrency(saldoFinal)}
            </h2>
         </div>
         <div className="flex gap-4 mt-4 text-sm text-slate-500 relative z-10">
            <div className="flex items-center gap-1">
               <ArrowUpRight size={16} className="text-emerald-500" />
               Entradas: <span className="font-semibold text-slate-700">{formatCurrency(totalEntradas)}</span>
            </div>
            <div className="flex items-center gap-1">
               <ArrowDownRight size={16} className="text-red-500" />
               Comprometido: <span className="font-semibold text-slate-700">{formatCurrency(totalEntradas - saldoFinal)}</span>
            </div>
         </div>
      </div>

      {/* 2. Barra de Saúde Financeira */}
      <div>
         <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><PieChart size={16}/> Comprometimento da Renda</h3>
         <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {/* Fixos */}
            <div style={{ width: `${totalEntradas > 0 ? Math.min((totalFixos / totalEntradas) * 100, 100) : 0}%` }} className="bg-slate-400" title="Fixos"></div>
            {/* Envelopes */}
            <div style={{ width: `${totalEntradas > 0 ? Math.min((totalGastoProvisionadoEfetivo / totalEntradas) * 100, 100) : 0}%` }} className="bg-blue-500" title="Envelopes"></div>
            {/* Variáveis Livres */}
            <div style={{ width: `${totalEntradas > 0 ? Math.min((totalGastosNaoProvisionados / totalEntradas) * 100, 100) : 0}%` }} className="bg-orange-400" title="Variáveis Livres"></div>
         </div>
         <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Fixos</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Envelopes</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Livres</div>
         </div>
      </div>

      {/* 3. Alertas e Atenção */}
      {(contasProximas.length > 0 || envelopesCriticos.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Atenção Necessária</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {contasProximas.map(conta => {
              const [y, m, d] = conta.data.split('-').map(Number);
              const dataConta = new Date(y, m - 1, d);
              const isVencido = dataConta < today;

              return (
                <div key={conta.id} className={`min-w-[200px] border p-3 rounded-xl snap-start ${isVencido ? 'bg-red-100 border-red-200' : 'bg-yellow-50 border-yellow-100'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isVencido ? 'text-red-700' : 'text-yellow-700'}`}>
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold uppercase">{isVencido ? 'Vencido / Atrasado' : 'Vence em breve'}</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm truncate">{conta.descricao}</p>
                  <p className="text-xs text-slate-600">{new Date(conta.data).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} • {formatCurrency(conta.valor)}</p>
                </div>
              );
            })}
            {envelopesCriticos.map(env => (
              <div key={env.id} className="min-w-[200px] bg-orange-50 border border-orange-100 p-3 rounded-xl snap-start">
                <div className="flex items-center gap-2 text-orange-700 mb-1">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-bold uppercase">Envelope Crítico</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm truncate">{env.descricao}</p>
                <p className="text-xs text-slate-500">Limite quase atingido</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Análise de Gastos */}
      <div className="grid grid-cols-1 gap-3">
        <Card>
          <h3 className="text-sm font-bold text-slate-700 mb-4">Distribuição de Gastos</h3>
          <BarChart data={chartData} total={totalVariaveis} />
        </Card>
      </div>
    </div>
  );
};