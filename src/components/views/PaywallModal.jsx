import React, { useState } from 'react';
import { X, CheckCircle, Star } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const ProFeature = ({ children }) => (
  <li className="flex items-center gap-3">
    <CheckCircle size={18} className="text-emerald-500" />
    <span className="text-slate-600 dark:text-slate-300">{children}</span>
  </li>
);

export const PaywallModal = ({ setShowPaywall }) => {  
  const [loading, setLoading] = useState(''); // 'monthly' | 'yearly' | ''

  const handleCheckout = async (plan) => {
    setLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan: plan },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const { checkoutUrl } = data;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Não foi possível obter a URL de checkout.");
      }

    } catch (error) {
      console.error('Stripe Checkout Error:', error);
      alert(`Erro ao iniciar o pagamento: ${error.message}`);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#1F1F1F] w-full max-w-md rounded-2xl p-6 shadow-xl relative">
        <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] rounded-full"><X size={20}/></button>
        
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
            <Star size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Desbloqueie todo o potencial</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6">Faça o upgrade para o Plano Pro e tenha o controle total das suas finanças.</p>
        </div>

        <ul className="space-y-3 mb-8">
          <ProFeature>Recursos <strong>ilimitados</strong> (Envelopes, Tags, Fixos)</ProFeature>
          <ProFeature>Acesso total à tela de <strong>Patrimônio</strong></ProFeature>
          <ProFeature><strong>Dashboard Anual</strong> com insights estratégicos</ProFeature>
          <ProFeature>Funcionalidades futuras (sincronização, etc)</ProFeature>
          <ProFeature>Suporte Prioritário</ProFeature>
        </ul>

        <div className="space-y-3">
            <button onClick={() => handleCheckout('yearly')} disabled={!!loading} className="w-full bg-[#3457A4] text-white p-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity relative disabled:opacity-70">
                <span className="absolute top-1 right-3 text-xs bg-yellow-400 text-black font-bold px-2 py-0.5 rounded-full">ECONOMIZE 2 MESES</span>
                <span className="block">{loading === 'yearly' ? 'Redirecionando...' : 'Plano Anual'}</span>
                <span className="block text-sm font-normal opacity-80">R$ 149,90/ano</span>
            </button>
            <button onClick={() => handleCheckout('monthly')} disabled={!!loading} className="w-full bg-slate-700 text-white p-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-70">
                <span className="block">{loading === 'monthly' ? 'Redirecionando...' : 'Plano Mensal'}</span>
                <span className="block text-sm font-normal opacity-80">R$ 14,90/mês</span>
            </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">Você poderá cancelar quando quiser.</p>

      </div>
    </div>
  );
};