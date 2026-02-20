import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { X } from 'lucide-react';
import { TermsOfUse, PrivacyPolicy } from './LegalDocs';

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

  // Estados de Termos
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);

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
    if (!termsAccepted) {
      alert("Você deve aceitar os Termos de Uso e a Política de Privacidade para criar uma conta.");
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
      <div className="bg-white dark:bg-[#1F1F1F] p-8 rounded-xl shadow-md w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img src="/logopiggy.png" alt="True Finance" className="w-32 object-contain" />
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-[#1B1B35] text-white p-3 rounded-lg font-bold hover:opacity-90 transition-opacity">{loading ? 'Carregando...' : 'Entrar'}</button>
          
          <div className="flex justify-between text-sm mt-4">
            <button type="button" onClick={() => { setShowSignUp(true); setTermsAccepted(false); }} className="text-slate-600 font-semibold hover:underline">Cadastrar</button>
            <button type="button" onClick={() => setShowForgot(true)} className="text-slate-500 hover:text-slate-700">Esqueci minha senha</button>
          </div>
        </form>
      </div>

      {/* Modal Cadastro */}
      {showSignUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1F1F1F] w-full max-w-md rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowSignUp(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] rounded-full"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-4 text-slate-600 dark:text-slate-200">Criar Conta</h2>
            <form onSubmit={handleSignUp} className="space-y-3">
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200" type="text" placeholder="Nome Completo" value={newName} onChange={e => setNewName(e.target.value)} required />
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200" type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200" type="password" placeholder="Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200" type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              
              <div className="flex items-start gap-2 mt-4 mb-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={termsAccepted} 
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-[#1B1B35] focus:ring-[#1B1B35] cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  Li e aceito os <button type="button" onClick={() => setActiveDoc('terms')} className="text-[#1B1B35] font-bold hover:underline">Termos de Uso</button> e a <button type="button" onClick={() => setActiveDoc('privacy')} className="text-[#1B1B35] font-bold hover:underline">Política de Privacidade</button>.
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold hover:bg-slate-800 transition-colors mt-2">{loading ? 'Enviando...' : 'Cadastrar'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Esqueci Senha */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1F1F1F] w-full max-w-md rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowForgot(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] rounded-full"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-4 text-slate-600 dark:text-slate-200">Recuperar Senha</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Digite seu email para receber o link de redefinição.</p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-slate-200 dark:bg-[#2A2A2A] dark:border-[#333] dark:text-slate-200" type="email" placeholder="Email cadastrado" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold hover:bg-slate-800 transition-colors mt-2">{loading ? 'Enviando...' : 'Enviar Email'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Documentos Legais */}
      {activeDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1F1F1F] w-full max-w-lg rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
            <button onClick={() => setActiveDoc(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] rounded-full"><X size={20}/></button>
            {activeDoc === 'terms' && <TermsOfUse />}
            {activeDoc === 'privacy' && <PrivacyPolicy />}
            <button onClick={() => setActiveDoc(null)} className="w-full bg-slate-100 text-slate-700 p-3 rounded-lg font-bold hover:bg-slate-200 dark:bg-[#2A2A2A] dark:text-slate-200 dark:hover:bg-[#333] transition-colors mt-6">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};