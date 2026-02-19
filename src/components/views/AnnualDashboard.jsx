import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { ChevronLeft, ChevronRight, PiggyBank, PieChart, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const KpiCard = ({ title, value, isCurrency = true, isPercentage = false, color = 'text-slate-800' }) => (
    <div className="bg-slate-50 dark:bg-[#1F1F1F] p-4 rounded-lg border border-slate-100 dark:border-[#2A2A2A]">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <p className={`text-2xl font-bold ${color} dark:opacity-90`}>
            {isCurrency ? formatCurrency(value) : value}
            {isPercentage && '%'}
        </p>
    </div>
);

const CashFlowChart = ({ data }) => {
    const maxAbsValue = Math.max(...data.map(d => Math.abs(d.balance)));

    return (
        <Card className="bg-white dark:bg-[#1F1F1F]">
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2"><BarChart3 size={16}/> Fluxo de Caixa Mensal</h3>
            <div className="flex gap-2 h-48 items-center border-t border-slate-200 dark:border-[#2A2A2A] pt-4">
                {data.map((monthData, index) => {
                    const isPositive = monthData.balance >= 0;
                    const height = maxAbsValue > 0 ? (Math.abs(monthData.balance) / maxAbsValue) * 100 : 0;
                    return (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                            <div className="w-full h-full relative">
                                {isPositive ? (
                                    <div 
                                        className="absolute bottom-1/2 w-full bg-emerald-500 rounded-t-sm"
                                        style={{ height: `${height / 2}%` }}
                                        title={`${monthData.month}: ${formatCurrency(monthData.balance)}`}
                                    ></div>
                                ) : (
                                    <div 
                                        className="absolute top-1/2 w-full bg-red-500 rounded-b-sm"
                                        style={{ height: `${height / 2}%` }}
                                        title={`${monthData.month}: ${formatCurrency(monthData.balance)}`}
                                    ></div>
                                )}
                            </div>
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{monthData.month}</span>
                        </div>
                    );
                })}
            </div>
             <div className="w-full h-px bg-slate-200 dark:bg-[#2A2A2A] mt-2"></div>
        </Card>
    );
};

const ExpenseDistributionChart = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.valor), 0);

    return (
        <Card className="bg-white dark:bg-[#1F1F1F]">
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2"><PieChart size={16}/> Distribuição Anual de Gastos</h3>
            <div className="space-y-3">
                {data.map(tag => {
                    const width = maxValue > 0 ? (tag.valor / maxValue) * 100 : 0;
                    return (
                        <div key={tag.id}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: tag.cor}}></div>
                                    {tag.nome}
                                </span>
                                <span className="font-bold text-slate-600 dark:text-slate-200">{formatCurrency(tag.valor)}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-[#2A2A2A] rounded-full h-2.5 relative">
                                <div 
                                    className="h-full rounded-full" 
                                    style={{ width: `${width}%`, backgroundColor: tag.cor }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
                {data.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Sem gastos variáveis para este ano.</p>}
            </div>
        </Card>
    );
};

const PatrimonyEvolutionChart = ({ data }) => {
    const values = data.map(d => d.total);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (range > 0 ? ((d.total - min) / range) * 100 : 50);
        return `${x},${y}`;
    }).join(' ');

    return (
        <Card className="bg-white dark:bg-[#1F1F1F]">
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2"><PiggyBank size={16}/> Evolução do Patrimônio</h3>
            <div className="h-48 w-full relative">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                        <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1"
                        points={points}
                    />
                    <polyline
                        fill="url(#area-gradient)"
                        stroke="none"
                        points={`0,100 ${points} 100,100`}
                    />
                </svg>
                <div className="absolute bottom-0 w-full flex justify-between text-xs text-slate-400 dark:text-slate-500 px-1">
                    <span>{months[0]}</span>
                    <span>{months[11]}</span>
                </div>
                 <div className="absolute top-0 left-0 text-xs text-slate-400 dark:text-slate-500">{formatCurrency(max)}</div>
                 <div className="absolute bottom-4 left-0 text-xs text-slate-400 dark:text-slate-500">{formatCurrency(min)}</div>
            </div>
        </Card>
    );
};

export const AnnualDashboard = ({ data }) => {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const handlePrevYear = () => setCurrentYear(prev => prev - 1);
    const handleNextYear = () => setCurrentYear(prev => prev + 1);

    const annualData = useMemo(() => {
        const getYear = (dateStr) => parseInt(dateStr.split('-')[0]);
        const getMonth = (dateStr) => parseInt(dateStr.split('-')[1]) - 1;

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        const isCurrentYear = currentYear === year;

        const yearData = {
            entradas: data.entradas.filter(t => getYear(t.data) === currentYear),
            fixos: data.fixos.filter(t => getYear(t.data) === currentYear),
            variaveis: data.variaveis.filter(t => getYear(t.data) === currentYear),
            poupanca: data.poupanca.filter(t => getYear(t.data) === currentYear),
        };

        const expensesFilter = (t) => !isCurrentYear || t.data <= todayStr;

        const totalAnnualEntradas = yearData.entradas.reduce((sum, t) => sum + t.valor, 0);
        const totalAnnualSaidas = yearData.fixos.filter(expensesFilter).reduce((sum, t) => sum + t.valor, 0) + yearData.variaveis.filter(expensesFilter).reduce((sum, t) => sum + t.valor, 0);
        const balancoAnual = totalAnnualEntradas - totalAnnualSaidas;
        const totalPoupadoAno = yearData.poupanca.reduce((sum, t) => sum + (t.tipoPoupanca === 'entrada' ? t.valor : -t.valor), 0);
        const taxaPoupanca = totalAnnualEntradas > 0 ? (totalPoupadoAno / totalAnnualEntradas) * 100 : 0;

        const monthlyCashFlow = Array(12).fill(0).map((_, i) => {
            const monthlyEntradas = yearData.entradas.filter(t => getMonth(t.data) === i).reduce((sum, t) => sum + t.valor, 0);
            const monthlyFixos = yearData.fixos.filter(t => getMonth(t.data) === i).reduce((sum, t) => sum + t.valor, 0);
            const monthlyVariaveis = yearData.variaveis.filter(t => getMonth(t.data) === i).reduce((sum, t) => sum + t.valor, 0);
            return {
                month: months[i],
                balance: monthlyEntradas - (monthlyFixos + monthlyVariaveis)
            };
        });

        const expenseDistribution = data.tags.map(tag => {
            const totalGasto = yearData.variaveis
                .filter(v => v.tagId === tag.id)
                .reduce((sum, v) => sum + v.valor, 0);
            return { ...tag, valor: totalGasto };
        }).filter(tag => tag.valor > 0).sort((a, b) => b.valor - a.valor);
        
        const totalAnnualVariaveis = yearData.variaveis.reduce((sum, t) => sum + t.valor, 0);

        const patrimonyEvolution = [];
        let cumulativeSavings = data.poupanca
            .filter(p => getYear(p.data) < currentYear)
            .reduce((acc, p) => acc + (p.tipoPoupanca === 'entrada' ? p.valor : -p.valor), 0);

        for (let i = 0; i < 12; i++) {
            const monthContribution = yearData.poupanca
                .filter(p => getMonth(p.data) === i)
                .reduce((acc, p) => acc + (p.tipoPoupanca === 'entrada' ? p.valor : -p.valor), 0);
            
            cumulativeSavings += monthContribution;
            patrimonyEvolution.push({
                month: months[i],
                total: cumulativeSavings
            });
        }

        return {
            kpis: { totalAnnualEntradas, totalAnnualSaidas, balancoAnual, taxaPoupanca },
            monthlyCashFlow,
            expenseDistribution,
            totalAnnualVariaveis,
            patrimonyEvolution
        };
    }, [data, currentYear]);

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Year Selector */}
            <div className="bg-white dark:bg-[#1F1F1F] rounded-2xl shadow-sm border border-slate-100 dark:border-[#2A2A2A]">
                <div className="flex items-center justify-between gap-4 p-3 max-w-lg mx-auto">
                    <button onClick={handlePrevYear} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2A2A] text-[#1B1B35] dark:text-slate-200 transition-all active:scale-95"><ChevronLeft size={24}/></button>
                    <span className="text-lg font-bold text-[#1B1B35] dark:text-slate-100 uppercase text-center">
                        {currentYear}
                    </span>
                    <button onClick={handleNextYear} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2A2A] text-[#1B1B35] dark:text-slate-200 transition-all active:scale-95"><ChevronRight size={24}/></button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4">
                <KpiCard title="Total de Entradas" value={annualData.kpis.totalAnnualEntradas} color="text-emerald-600" />
                <KpiCard title="Total de Saídas" value={annualData.kpis.totalAnnualSaidas} color="text-red-600" />
                <KpiCard 
                    title="Balanço Anual (Entradas - Saídas)" 
                    value={annualData.kpis.balancoAnual} 
                    color={annualData.kpis.balancoAnual >= 0 ? 'text-emerald-600' : 'text-red-600'}
                />
                <KpiCard 
                    title="Taxa de Poupança" 
                    value={annualData.kpis.taxaPoupanca.toFixed(1)} 
                    isCurrency={false}
                    isPercentage={true}
                    color="text-sky-600"
                />
            </div>

            <CashFlowChart data={annualData.monthlyCashFlow} />

            <ExpenseDistributionChart data={annualData.expenseDistribution} />
            
            <PatrimonyEvolutionChart data={annualData.patrimonyEvolution} />

        </div>
    );
};