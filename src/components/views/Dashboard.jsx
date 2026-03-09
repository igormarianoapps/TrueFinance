import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Wallet, ArrowUpRight, ArrowDownRight, PieChart, AlertTriangle, Clock, TrendingUp, TrendingDown, Tag as TagIcon, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { currentTheme } from '../../themes';

const BarChart = ({ data }) => {
  const maxValue = data.reduce((max, item) => Math.max(max, item.valor), 0);

  return (
    <div className="space-y-4">
      {data.map((item, idx) => (
        <div key={idx}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
               <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.cor}}></div>
               {item.label}
            </span>
            <span className="font-bold text-slate-600 dark:text-slate-200">{formatCurrency(item.valor)}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-[#2A2A2A] rounded-full h-2">
            <div className="h-2 rounded-full" style={{ width: `${maxValue > 0 ? (item.valor / maxValue) * 100 : 0}%`, backgroundColor: item.cor }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = ({
  saldoFinal,
  totalEntradas,
  totalFixos,
  totalGastoProvisionadoEfetivo,
  totalGastosNaoProvisionados,
  filteredData,
  chartData,
  totalVariaveis,
  openModal,
  totalComprometido
}) => {
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const contasProximas = filteredData.fixos
    .filter(f => {
      if (f.pago) return false;
      const [y, m, d] = f.data.split('-').map(Number);
      const dataConta = new Date(y, m - 1, d);
      const diffTime = dataConta - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 5);

  const envelopesCriticos = filteredData.provisoes.filter(p => {
    if (!p.tagId) return false;
    const gasto = filteredData.variaveis.filter(v => v.tagId === p.tagId).reduce((acc, v) => acc + v.valor, 0);
    return p.valor > 0 && gasto > p.valor * 0.9;
  });

  // Helper para identificar se a transação é no crédito
  const isCredit = (item) => item.paymentMethod === 'credit' || (item.creditCardId !== null && item.creditCardId !== undefined);

  // Helper para encontrar a tag associada
  const getTag = (tagId) => {
    return filteredData.tags?.find(t => t.id === tagId);
  };

  // Pega as últimas 5 saídas, ordenadas por cadastro (mais recente primeiro)
  const recentExpenses = [...filteredData.variaveis]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      
      {/* 3. Alertas e Atenção (Movido para o topo) */}
      {(contasProximas.length > 0 || envelopesCriticos.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">Atenção Necessária</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {contasProximas.map(conta => {
              const [y, m, d] = conta.data.split('-').map(Number);
              const dataConta = new Date(y, m - 1, d);
              const isVencido = dataConta < today;

              return (
                <div key={conta.id} className={`min-w-[200px] border p-3 rounded-xl snap-start ${isVencido ? 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-900' : 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isVencido ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold uppercase">{isVencido ? 'Vencido / Atrasado' : 'Vence em breve'}</span>
                  </div>
                  <p className="font-semibold text-slate-600 dark:text-slate-200 text-sm truncate">{conta.descricao}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{dataConta.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} • {formatCurrency(conta.valor)}</p>
                </div>
              );
            })}
            {envelopesCriticos.map(env => (
              <div key={env.id} className="min-w-[200px] bg-orange-50 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-900 p-3 rounded-xl snap-start">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 mb-1">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-bold uppercase">Envelope Crítico</span>
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-200 text-sm truncate">{env.descricao}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Limite quase atingido</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Hero Card: Sobra Projetada */}
      <div className="bg-white dark:bg-[#1F1F1F] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#1F1F1F] relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
           <img src={currentTheme.assets.heroImage} alt="" className="w-[140px] h-[140px] object-contain" />
         </div>
         <span className="text-sm font-medium text-slate-500 dark:text-slate-400 relative z-10">Sobra Projetada (Poder de Compra)</span>
         <div className="flex items-baseline gap-2 mt-1 relative z-10">
            <h2 className={`text-4xl font-bold ${saldoFinal >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
               {formatCurrency(saldoFinal)}
            </h2>
         </div>
         <div className="flex flex-col gap-2 mt-4 text-sm text-slate-500 dark:text-slate-400 relative z-10">
            <div className="flex items-center gap-1">
               <ArrowUpRight size={16} className="text-emerald-500" />
               Entradas: <span className="font-semibold text-slate-600">{formatCurrency(totalEntradas)}</span>
            </div>
            <div className="flex items-center gap-1">
               <ArrowDownRight size={16} className="text-red-500" />
               Comprometido: <span className="font-semibold text-slate-600">{formatCurrency(totalEntradas - saldoFinal)}</span>
            </div>
         </div>
      </div>

      {/* 1.2 Botões de Ação Rápida */}
      <div className="flex gap-3">
         <button onClick={() => openModal('entrada')} className="flex-1 bg-emerald-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm active:scale-95">
            <TrendingUp size={20} />
            Adicionar Entrada
         </button>
         <button onClick={() => openModal('variavel')} className="flex-1 bg-red-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-sm active:scale-95">
            <TrendingDown size={20} />
            Adicionar Gasto
         </button>
      </div>

      {/* 1.5 Indicador de Compromissos Pendentes */}
      <Card className="flex items-center justify-between bg-slate-50 dark:bg-[#1F1F1F] border border-slate-200 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-[#2A2A2A] rounded-lg border border-slate-100 dark:border-[#333] text-slate-500 dark:text-slate-300">
               <Clock size={20} />
            </div>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-200">Total Comprometido <span className="block text-xs font-normal text-slate-400 dark:text-slate-500">Fixos + Envelopes + Poupança</span></span>
         </div>
         <span className="text-xl font-bold text-slate-600 dark:text-slate-100">{formatCurrency(totalComprometido)}</span>
      </Card>

      {/* 2. Barra de Saúde Financeira */}
      <div>
         <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2"><PieChart size={16}/> Comprometimento da Renda</h3>
         <div className="h-4 bg-slate-100 dark:bg-[#1F1F1F] rounded-full overflow-hidden flex shadow-inner">
            {/* Fixos */}
            <div style={{ width: `${totalEntradas > 0 ? Math.min((totalFixos / totalEntradas) * 100, 100) : 0}%` }} className="bg-slate-400" title="Fixos"></div>
            {/* Envelopes */}
            <div style={{ width: `${totalEntradas > 0 ? Math.min((totalGastoProvisionadoEfetivo / totalEntradas) * 100, 100) : 0}%` }} className="bg-blue-500" title="Envelopes"></div>
            {/* Variáveis Livres */}
            <div style={{ width: `${totalEntradas > 0 ? Math.min((totalGastosNaoProvisionados / totalEntradas) * 100, 100) : 0}%` }} className="bg-orange-400" title="Variáveis Livres"></div>
         </div>
         <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Fixos</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Envelopes</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Livres</div>
         </div>
      </div>

      {/* 4. Análise de Gastos (Movido para antes das Últimas Saídas) */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="bg-white dark:bg-[#1F1F1F]">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4">Distribuição de Gastos</h3>
          <BarChart data={chartData} />
        </Card>
      </div>

      {/* 5. Últimas Saídas */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">Últimas Saídas</h3>
          <button onClick={() => navigate('/saidas')} className="text-xs text-[var(--primary)] dark:text-blue-400 font-bold hover:underline">
            Ver todas
          </button>
        </div>
        
        <div className="space-y-2">
          {recentExpenses.length > 0 ? recentExpenses.map(item => {
            const tag = getTag(item.tagId);
            return (
              <Card key={item.id} className="p-3 flex justify-between items-center bg-white dark:bg-[#1F1F1F] hover:bg-slate-50 dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer" onClick={() => openModal('variavel', item)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {tag ? (
                    <div className="p-2 rounded-full flex-shrink-0" style={{ backgroundColor: `${tag.cor}20`, color: tag.cor }}>
                      <TagIcon size={18} />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-slate-100 text-slate-400 dark:bg-[#2A2A2A] dark:text-slate-500 flex-shrink-0">
                      <TagIcon size={18} />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-200 truncate text-sm">{item.descricao}</p>
                      {isCredit(item) ? (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <CreditCard size={10} /> Crédito
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Wallet size={10} /> Débito
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{tag?.nome || 'Sem Categoria'}</p>
                  </div>
                </div>
                <span className="font-bold text-red-500 dark:text-red-400 text-sm whitespace-nowrap">
                  {formatCurrency(item.valor)}
                </span>
              </Card>
            );
          }) : (
            <div className="text-center py-8 text-slate-400 text-sm bg-white dark:bg-[#1F1F1F] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              Nenhuma saída registrada neste mês.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};