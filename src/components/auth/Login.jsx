import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { X } from 'lucide-react';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados dos Modais
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Estados de Cadastro
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estado de Recuperação
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email: newEmail, 
      password: newPassword,
      options: { data: { full_name: newName } }
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Cadastro realizado! Verifique seu email para confirmar.');
      setShowSignUp(false);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin,
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Email de redefinição enviado! Verifique sua caixa de entrada.');
      setShowForgot(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B1B35] p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img src="/logopiggy.png" alt="True Finance" className="w-32 object-contain" />
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-[#1B1B35] text-white p-3 rounded-lg font-bold hover:opacity-90 transition-opacity">{loading ? 'Carregando...' : 'Entrar'}</button>
          
          <div className="flex justify-between text-sm mt-4">
            <button type="button" onClick={() => setShowSignUp(true)} className="text-slate-600 font-semibold hover:underline">Cadastrar</button>
            <button type="button" onClick={() => setShowForgot(true)} className="text-slate-500 hover:text-slate-700">Esqueci minha senha</button>
          </div>
        </form>
      </div>

      {/* Modal Cadastro */}
      {showSignUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowSignUp(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-4 text-slate-600">Criar Conta</h2>
            <form onSubmit={handleSignUp} className="space-y-3">
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200" type="text" placeholder="Nome Completo" value={newName} onChange={e => setNewName(e.target.value)} required />
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200" type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200" type="password" placeholder="Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200" type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold hover:bg-slate-800 transition-colors mt-2">{loading ? 'Enviando...' : 'Cadastrar'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Esqueci Senha */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowForgot(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-4 text-slate-600">Recuperar Senha</h2>
            <p className="text-sm text-slate-500 mb-4">Digite seu email para receber o link de redefinição.</p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200" type="email" placeholder="Email cadastrado" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold hover:bg-slate-800 transition-colors mt-2">{loading ? 'Enviando...' : 'Enviar Email'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};