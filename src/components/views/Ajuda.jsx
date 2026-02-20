import React from 'react';
import { Card } from '../ui/Card';
import { HelpCircle, Calculator, Package, Calendar, TrendingUp } from 'lucide-react';

export const Ajuda = () => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 pb-20">
      <div className="bg-[#3457A4] dark:bg-[#1F1F1F] text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle size={32} className="text-white/80" />
          <h2 className="text-2xl font-bold">Central de Ajuda</h2>
        </div>
        <p className="text-white/80">Entenda como o True Finance organiza sua vida financeira.</p>
      </div>

      <div className="grid gap-4">
        <Card className="bg-white dark:bg-[#1F1F1F]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
              <Package size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Como funcionam os Envelopes?</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Os <strong>Envelopes (Provisões)</strong> servem para planejar gastos variáveis ou metas de curto prazo.
                <br/><br/>
                Por exemplo: Se você quer gastar no máximo R$ 500,00 com Mercado, crie um envelope de R$ 500,00 e vincule a tag "Mercado".
                Conforme você lança gastos variáveis com essa tag, a barra do envelope vai enchendo, mostrando quanto ainda resta do seu orçamento planejado.
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-[#1F1F1F]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
              <Calculator size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Fórmulas do Dashboard</h3>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Sobra Projetada (Poder de Compra):</p>
                  <p>É o cálculo de quanto dinheiro "livre" você tem no mês.</p>
                  <code className="block bg-slate-100 dark:bg-[#2A2A2A] p-2 rounded mt-1 text-xs font-mono">
                    Entradas - (Fixos + Envelopes + Gastos Variáveis sem Envelope)
                  </code>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Compromissos Pendentes:</p>
                  <p>Soma das contas fixas que você ainda não marcou como pagas + o valor restante (não gasto) dos seus envelopes.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-[#1F1F1F]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full dark:bg-purple-900/30 dark:text-purple-400">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Tipos de Recorrência</h3>
              <ul className="list-disc pl-4 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <li><strong>Único:</strong> Acontece apenas uma vez.</li>
                <li><strong>Fixo Mensal:</strong> Repete todo mês indefinidamente (ex: Aluguel, Assinaturas).</li>
                <li><strong>Parcelado:</strong> Repete por um número específico de meses (ex: Compra em 10x).</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};