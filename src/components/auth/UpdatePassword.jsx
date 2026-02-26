import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const UpdatePassword = ({ onPasswordUpdated }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não conferem.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    // O Supabase client usa o token da URL automaticamente aqui
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: `Erro ao atualizar a senha: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso! Você será redirecionado para a tela de login.' });
      setTimeout(() => {
        // Chama a função para resetar o evento no App.jsx e voltar para a tela de login
        onPasswordUpdated(); 
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3457A4] p-4">
      <div className="bg-white dark:bg-[#1F1F1F] p-8 rounded-xl shadow-md w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img src="/logopiggy.png" alt="True Finance" className="w-32 object-contain dark:hidden" />
          <img src="/logopiggydark.png" alt="True Finance" className="w-32 object-contain hidden dark:block" />
        </div>
        <h2 className="text-xl font-bold text-center mb-1 text-slate-700 dark:text-slate-200">Redefinir Senha</h2>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">Digite sua nova senha abaixo.</p>
        
        {message.text && (
          <div className={`p-3 rounded-lg text-center mb-4 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
            {message.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handlePasswordReset}>
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200" type="password" placeholder="Nova senha" value={password} onChange={e => setPassword(e.target.value)} required />
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200" type="password" placeholder="Confirmar nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-[#3457A4] text-white p-3 rounded-lg font-bold hover:opacity-90 transition-opacity">
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};