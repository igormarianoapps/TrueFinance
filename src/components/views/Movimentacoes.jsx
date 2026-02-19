import React from 'react';
import { Card } from '../ui/Card';
import { ArrowRight, TrendingUp, Calendar, TrendingDown, PlusCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const Section = ({ title, icon: Icon, fullViewTab, setActiveTab, onAddClick, addLabel, children }) => (
    <Card>
        <div className="p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <Icon className="text-slate-500 dark:text-slate-400" size={20} />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{title}</h3>
                </div>
                <button 
                    onClick={() => setActiveTab(fullViewTab)}
                    className="flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#1B1B35] dark:hover:text-white"
                >
                    Ver tudo <ArrowRight size={14} />
                </button>
            </div>
            {children}
        </div>
        {onAddClick && (
            <button 
                onClick={onAddClick}
                className="w-full bg-[#1B1B35] hover:opacity-90 text-white font-semibold p-3 text-sm border-t border-[#1B1B35] rounded-b-lg flex items-center justify-center gap-2 transition-colors"
            >
                <PlusCircle size={16} />
                {addLabel}
            </button>
        )}
    </Card>
);

const ItemRow = ({ description, value, valueColor, tag }) => (
    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">{description}</p>
            {tag && <p className="text-xs text-slate-400 dark:text-slate-500">{tag}</p>}
        </div>
        <span className={`font-bold ${valueColor} dark:opacity-90`}>
            {formatCurrency(value)}
        </span>
    </div>
);

export const Movimentacoes = ({ filteredData, setActiveTab, openModal, totalEntradas }) => {
    const MAX_ITEMS = 3;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fixosPendentes = filteredData.fixos.filter(f => !f.pago);
    const vencidos = fixosPendentes.filter(f => new Date(f.data) < today);

    const renderAlerts = () => {
        if (fixosPendentes.length === 0 && filteredData.fixos.length > 0) {
            return (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 p-3 rounded-lg">
                    <CheckCircle size={18} />
                    <span className="text-sm font-semibold">Pagamentos em dia!</span>
                </div>
            );
        }

        if (vencidos.length > 0) {
            return (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-semibold">{vencidos.length} pagamento(s) vencido(s).</span>
                </div>
            );
        }

        if (fixosPendentes.length > 0) {
            return (
                <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 p-3 rounded-lg">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-semibold">{fixosPendentes.length} pagamento(s) a vencer.</span>
                </div>
            );
        }

        return <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Nenhum item fixo ou provisão este mês.</p>;
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <Section 
                title="Entradas" 
                icon={TrendingUp} 
                fullViewTab="Entradas" 
                setActiveTab={setActiveTab}
                onAddClick={() => openModal('entrada')}
                addLabel="Adicionar Entrada"
            >
                <div className="text-center py-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total de entradas no mês</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(totalEntradas)}</p>
                </div>
            </Section>

            <Section 
                title="Fixos & Provisões" 
                icon={Calendar} 
                fullViewTab="Fixos & Provisões" 
                setActiveTab={setActiveTab}
                onAddClick={() => openModal('fixo')}
                addLabel="Adicionar Fixo"
            >
                {renderAlerts()}
            </Section>

            <Section 
                title="Gastos Variáveis" 
                icon={TrendingDown} 
                fullViewTab="Gastos Variáveis" 
                setActiveTab={setActiveTab}
                onAddClick={() => openModal('variavel')}
                addLabel="Adicionar Gasto"
            >
                <div className="space-y-2">
                    {filteredData.variaveis.length > 0 ? (
                        filteredData.variaveis.slice(0, MAX_ITEMS).map(item => (
                            <ItemRow 
                                key={item.id}
                                description={item.descricao}
                                value={item.valor}
                                valueColor="text-orange-500"
                            />
                        ))
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Nenhum gasto variável este mês.</p>
                    )}
                </div>
            </Section>
        </div>
    );
};