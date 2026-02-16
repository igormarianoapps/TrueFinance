import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const UpdatePassword = ({ onPasswordUpdated }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
      alert("Erro ao atualizar senha: " + error.message);
    } else {
      alert("Senha atualizada com sucesso!");
      onPasswordUpdated();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">Redefinir Senha</h1>
        <form className="space-y-4" onSubmit={handleUpdate}>
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200" type="password" placeholder="Nova Senha" value={password} onChange={e => setPassword(e.target.value)} required />
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200" type="password" placeholder="Confirmar Nova Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold hover:bg-slate-800 transition-colors">{loading ? 'Atualizando...' : 'Salvar Nova Senha'}</button>
        </form>
      </div>
    </div>
  );
};