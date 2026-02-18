import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const BarChart = ({ data, title, icon: Icon }) => {
    const maxValue = data.reduce((max, month) => Math.max(max, ...Object.values(month.values)), 0);

    return (
        <Card>
            <h3 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2"><Icon size={16}/> {title}</h3>
            <div className="flex gap-2 h-48 items-end">
                {data.map((monthData, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full h-full flex items-end justify-center gap-px">
                            {Object.entries(monthData.values).map(([key, value]) => (
                                <div 
                                    key={key}
                                    className="w-full rounded-t-sm"
                                    style={{ 
                                        height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                                        backgroundColor: key === 'entradas' ? '#22c55e' : key === 'fixos' ? '#64748b' : '#f97316'
                                    }}
                                    title={`${key}: ${formatCurrency(value)}`}
                                ></div>
                            ))}
                        </div>
                        <span className="text-xs font-medium text-slate-400">{monthData.month}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-4 text-xs text-slate-500 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#22c55e]"></div>Entradas</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#64748b]"></div>Fixos</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#f97316]"></div>Variáveis</div>
            </div>
        </Card>
    );
};

const TagsChart = ({ data, title, icon: Icon }) => {
    const maxValue = Math.max(...data.map(tag => Math.max(...tag.monthlyValues)));

    return (
        <Card>
            <h3 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2"><Icon size={16}/> {title}</h3>
            <div className="space-y-3">
                {data.map(tag => (
                    <div key={tag.id}>
                        <p className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: tag.cor}}></div>
                            {tag.nome}
                        </p>
                        <div className="flex gap-1 h-6">
                            {tag.monthlyValues.map((value, index) => (
                                <div key={index} className="flex-1 bg-slate-100 rounded-sm" title={`${months[index]}: ${formatCurrency(value)}`}>
                                    <div 
                                        className="h-full rounded-sm"
                                        style={{
                                            width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                                            backgroundColor: tag.cor
                                        }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {data.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Sem dados de tags para este ano.</p>}
            </div>
        </Card>
    );
};

const SavingsChart = ({ data, title, icon: Icon }) => {
    const maxContribution = Math.max(...data.map(d => Math.abs(d.contribution)));

    return (
        <Card>
            <h3 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2"><Icon size={16}/> {title}</h3>
            <div className="flex gap-2 h-40 items-end">
                {data.map((monthData, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1" title={`Saldo: ${formatCurrency(monthData.total)}`}>
                        <div className="w-full h-full flex items-end justify-center">
                            <div 
                                className="w-full rounded-t-sm"
                                style={{ 
                                    height: `${maxContribution > 0 ? (Math.abs(monthData.contribution) / maxContribution) * 100 : 0}%`,
                                    backgroundColor: monthData.contribution >= 0 ? '#10b981' : '#f43f5e'
                                }}
                            ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-400">{monthData.month}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export const AnnualDashboard = ({ data }) => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const handlePrevYear = () => setCurrentYear(prev => prev - 1);
    const handleNextYear = () => setCurrentYear(prev => prev + 1);

    const chartData = useMemo(() => {
        const monthlyTotals = Array(12).fill(0).map((_, i) => ({
            month: months[i],
            values: { entradas: 0, fixos: 0, variaveis: 0 }
        }));

        const processTransactions = (transactions, type) => {
            transactions.forEach(item => {
                const [itemYear, itemMonth] = item.data.split('-').map(Number);
                if (itemYear === currentYear) {
                    monthlyTotals[itemMonth - 1].values[type] += item.valor;
                }
            });
        };

        processTransactions(data.entradas, 'entradas');
        processTransactions(data.fixos, 'fixos');
        processTransactions(data.variaveis, 'variaveis');

        const tagsData = data.tags.map(tag => {
            const monthlyValues = Array(12).fill(0);
            data.variaveis.forEach(item => {
                if (item.tagId === tag.id) {
                    const [itemYear, itemMonth] = item.data.split('-').map(Number);
                    if (itemYear === currentYear) {
                        monthlyValues[itemMonth - 1] += item.valor;
                    }
                }
            });
            return { ...tag, monthlyValues };
        }).sort((a,b) => b.monthlyValues.reduce((s,v) => s+v, 0) - a.monthlyValues.reduce((s,v) => s+v, 0));

        const savingsData = [];
        let cumulativeSavings = data.poupanca
            .filter(p => new Date(p.data).getFullYear() < currentYear)
            .reduce((acc, p) => acc + (p.tipoPoupanca === 'entrada' ? p.valor : -p.valor), 0);

        for (let i = 0; i < 12; i++) {
            const monthContribution = data.poupanca
                .filter(p => {
                    const pDate = new Date(p.data);
                    return pDate.getFullYear() === currentYear && pDate.getMonth() === i;
                })
                .reduce((acc, p) => acc + (p.tipoPoupanca === 'entrada' ? p.valor : -p.valor), 0);
            
            cumulativeSavings += monthContribution;
            savingsData.push({
                month: months[i],
                contribution: monthContribution,
                total: cumulativeSavings
            });
        }

        return { monthlyTotals, tagsData, savingsData };
    }, [data, currentYear]);

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Seletor de Ano */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between gap-4 p-3 max-w-lg mx-auto">
                    <button onClick={handlePrevYear} className="p-2 rounded-lg hover:bg-slate-100 text-[#1B1B35] transition-all active:scale-95"><ChevronLeft size={24}/></button>
                    <span className="text-lg font-bold text-[#1B1B35] uppercase text-center">
                        {currentYear}
                    </span>
                    <button onClick={handleNextYear} className="p-2 rounded-lg hover:bg-slate-100 text-[#1B1B35] transition-all active:scale-95"><ChevronRight size={24}/></button>
                </div>
            </div>

            <BarChart 
                data={chartData.monthlyTotals}
                title="Visão Geral Mensal"
                icon={TrendingUp}
            />

            <TagsChart 
                data={chartData.tagsData}
                title="Comparativo de Tags"
                icon={TrendingDown}
            />

            <SavingsChart
                data={chartData.savingsData}
                title="Evolução da Poupança"
                icon={PiggyBank}
            />
        </div>
    );
};