import React from 'react';
import { Card } from '../ui/Card';
import { ArrowRight, TrendingUp, Calendar, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const Section = ({ title, icon: Icon, fullViewTab, setActiveTab, children }) => (
    <Card>
        <div className="p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <Icon className="text-slate-500" size={20} />
                    <h3 className="text-lg font-bold text-slate-700">{title}</h3>
                </div>
                <button 
                    onClick={() => setActiveTab(fullViewTab)}
                    className="flex items-center gap-1 text-sm font-semibold text-[#12111C] hover:underline"
                >
                    Ver tudo <ArrowRight size={14} />
                </button>
            </div>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    </Card>
);

const ItemRow = ({ description, value, valueColor, tag }) => (
    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
        <div>
            <p className="font-semibold text-slate-700">{description}</p>
            {tag && <p className="text-xs text-slate-400">{tag}</p>}
        </div>
        <span className={`font-bold ${valueColor}`}>
            {formatCurrency(value)}
        </span>
    </div>
);

export const Movimentacoes = ({ filteredData, setActiveTab }) => {
    const MAX_ITEMS = 3;

    return (
        <div className="space-y-6 animate-in fade-in">
            <Section title="Entradas" icon={TrendingUp} fullViewTab="Entradas" setActiveTab={setActiveTab}>
                {filteredData.entradas.length > 0 ? (
                    filteredData.entradas.slice(0, MAX_ITEMS).map(item => (
                        <ItemRow 
                            key={item.id}
                            description={item.descricao}
                            value={item.valor}
                            valueColor="text-green-600"
                        />
                    ))
                ) : (
                    <p className="text-sm text-slate-400 text-center py-4">Nenhuma entrada este mês.</p>
                )}
            </Section>

            <Section title="Fixos & Provisões" icon={Calendar} fullViewTab="Fixos & Provisões" setActiveTab={setActiveTab}>
                {filteredData.fixos.length > 0 || filteredData.provisoes.length > 0 ? (
                    [...filteredData.fixos, ...filteredData.provisoes].sort((a,b) => new Date(a.data) - new Date(b.data)).slice(0, MAX_ITEMS).map(item => (
                        <ItemRow 
                            key={item.id}
                            description={item.descricao}
                            value={item.valor}
                            valueColor="text-red-600"
                            tag={item.tipo === 'fixo' ? 'Custo Fixo' : 'Provisão'}
                        />
                    ))
                ) : (
                    <p className="text-sm text-slate-400 text-center py-4">Nenhum item fixo ou provisão este mês.</p>
                )}
            </Section>

            <Section title="Gastos Variáveis" icon={TrendingDown} fullViewTab="Gastos Variáveis" setActiveTab={setActiveTab}>
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
                    <p className="text-sm text-slate-400 text-center py-4">Nenhum gasto variável este mês.</p>
                )}
            </Section>
        </div>
    );
};