import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../ui/Card';
import { User, Lock, Camera, Sun, Moon, Monitor, CreditCard, Trash2, AlertTriangle, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export const Perfil = ({ user, theme, setTheme, openConfirmModal, profile, setShowPaywall }) => {
  const [fullName, setFullName] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const userFullName = user?.user_metadata?.full_name || 'Usuário';
  const userInitials = userFullName.substring(0, 2).toUpperCase();

  const downloadImage = useCallback(async (path) => {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) {
        throw error;
      }
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  }, []);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
    if (user?.user_metadata?.avatar_url) {
      downloadImage(user.user_metadata.avatar_url);
    } else {
      setAvatarUrl(null);
    }
  }, [user, downloadImage]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setLoadingName(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar o nome: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Nome atualizado com sucesso!' });
    }
    setLoadingName(false);
  };

  const handlePasswordReset = async () => {
    const action = async () => {
      setLoadingPassword(true);
      setMessage({ type: '', text: '' });
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: window.location.origin,
      });

      if (error) {
        setMessage({ type: 'error', text: 'Erro ao enviar e-mail de redefinição: ' + error.message });
      } else {
        setMessage({ type: 'success', text: 'E-mail para redefinição de senha enviado! Verifique sua caixa de entrada.' });
      }
      setLoadingPassword(false);
    };

    if (openConfirmModal) {
      openConfirmModal('Redefinir Senha', 'Você receberá um e-mail para redefinir sua senha. Deseja continuar?', action);
    } else {
      if (window.confirm('Você receberá um e-mail para redefinir sua senha. Deseja continuar?')) action();
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      setMessage({ type: '', text: '' });

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para fazer o upload.');
      }

      const originalFile = event.target.files[0];

      const options = {
        maxSizeMB: 0.1, // Alvo de 100KB
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(originalFile, options);

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { avatar_url: filePath }
      });
      
      if (updateUserError) {
        throw updateUserError;
      }
      
      downloadImage(filePath);
      setMessage({ type: 'success', text: 'Imagem de perfil atualizada!' });

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    setMessage({ type: '', text: '' });
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao abrir portal: ' + error.message });
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setMessage({ type: '', text: '' });
    
    // Verifica se tem plano ativo
    if (profile?.subscription_status === 'active') {
      setMessage({ 
        type: 'error', 
        text: 'Você possui uma assinatura ativa. Por favor, cancele sua assinatura em "Gerenciar Assinatura" antes de excluir sua conta.' 
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async (e) => {
    e.preventDefault();
    setLoadingDelete(true);

    try {
      // 1. Re-autenticar para confirmar a senha
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword
      });

      if (authError) throw new Error("Senha incorreta.");

      // 2. Chamar a Edge Function para excluir
      const { error: funcError } = await supabase.functions.invoke('delete-account');
      if (funcError) throw funcError;

      // 3. Logout forçado (o redirecionamento acontece no App.jsx quando session vira null)
      await supabase.auth.signOut();

    } catch (error) {
      alert(error.message); // Usa alert aqui pois o modal está aberto
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      {message.text && (
        <div className={`p-4 rounded-lg text-center ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
          {message.text}
        </div>
      )}

      <Card className="bg-white dark:bg-[#1F1F1F]">
        <div className="flex flex-col items-center p-6">
            <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-[#2A2A2A] border-2 border-white dark:border-[#1F1F1F] shadow-lg flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-slate-600">{userInitials}</span>
                    )}
                </div>
                <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-[#12111C] text-white p-2 rounded-full cursor-pointer hover:opacity-90 transition-opacity">
                    {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Camera size={16} />}
                    <input id="avatar-upload" type="file" className="hidden" onChange={uploadAvatar} disabled={uploading} accept="image/*" />
                </label>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{userFullName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
      </Card>

      <Card className="bg-white dark:bg-[#1F1F1F]">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <CreditCard size={20} /> Minha Assinatura
          </h3>
          
          <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 dark:bg-[#2A2A2A] rounded-lg">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Plano Atual</p>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {profile?.subscription_status === 'active' ? `PRO (${profile?.plan_interval === 'year' ? 'Anual' : 'Mensal'})` : 'Gratuito'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${profile?.subscription_status === 'active' ? 'bg-[#E95415] text-white' : 'bg-slate-200 text-slate-600'}`}>
              {profile?.subscription_status === 'active' ? 'ATIVO' : 'INATIVO'}
            </div>
          </div>

          {profile?.subscription_status === 'active' ? (
            <button onClick={handleManageSubscription} disabled={loadingPortal} className="w-full bg-[#3457A4] dark:bg-[#2A2A2A] text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50">
              {loadingPortal ? 'Carregando...' : 'Gerenciar Assinatura'}
            </button>
          ) : (
            <button onClick={() => setShowPaywall(true)} className="w-full bg-[#3457A4] text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
              Fazer Upgrade para PRO
            </button>
          )}
        </div>
      </Card>

      <Card className="bg-white dark:bg-[#1F1F1F]">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-4">Editar Nome</h3>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-3 pl-10 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none" placeholder="Seu nome de exibição" required /></div>
            <button type="submit" disabled={loadingName || uploading} className="w-full bg-[#3457A4] dark:bg-[#0B0C0C] text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50">{loadingName ? 'Salvando...' : 'Salvar Nome'}</button>
          </form>
        </div>
      </Card>

      <Card className="bg-white dark:bg-[#1F1F1F]">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-4">Aparência</h3>
          <div className="flex gap-2">
            <button onClick={() => setTheme('light')} className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${theme === 'light' ? 'border-[#3457A4] dark:border-[#0B0C0C] bg-blue-50 dark:bg-[#2A2A2A]' : 'border-transparent bg-slate-100 dark:bg-[#2A2A2A] hover:bg-slate-200 dark:hover:bg-[#333]'}`}>
              <Sun size={20} />
              <span className="text-sm font-semibold">Claro</span>
            </button>
            <button onClick={() => setTheme('dark')} className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${theme === 'dark' ? 'border-[#3457A4] dark:border-[#0B0C0C] bg-blue-50 dark:bg-[#2A2A2A]' : 'border-transparent bg-slate-100 dark:bg-[#2A2A2A] hover:bg-slate-200 dark:hover:bg-[#333]'}`}>
              <Moon size={20} />
              <span className="text-sm font-semibold">Escuro</span>
            </button>
            <button onClick={() => setTheme('system')} className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${theme === 'system' ? 'border-[#3457A4] dark:border-[#0B0C0C] bg-blue-50 dark:bg-[#2A2A2A]' : 'border-transparent bg-slate-100 dark:bg-[#2A2A2A] hover:bg-slate-200 dark:hover:bg-[#333]'}`}>
              <Monitor size={20} />
              <span className="text-sm font-semibold">Sistema</span>
            </button>
          </div>
        </div>
      </Card>

      <Card className="bg-white dark:bg-[#1F1F1F]">
        <div className="p-6">
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-4">Segurança</h3>
            <button onClick={handlePasswordReset} disabled={loadingPassword || uploading} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-[#2A2A2A] dark:text-slate-200 dark:hover:bg-[#333] transition-colors disabled:opacity-50"><Lock size={16} />Redefinir Senha por E-mail</button>
        </div>
      </Card>

      <Card className="bg-white dark:bg-[#1F1F1F] border-2 border-red-100 dark:border-red-900/30">
        <div className="p-6">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2"><AlertTriangle size={20}/> Zona de Perigo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">A exclusão da conta é irreversível. Todos os seus dados, transações e histórico serão apagados permanentemente.</p>
            <button onClick={handleDeleteAccountClick} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"><Trash2 size={16} />Excluir Minha Conta</button>
        </div>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1F1F1F] w-full max-w-sm rounded-2xl p-6 shadow-xl relative">
            <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-[#2A2A2A] rounded-full"><X size={20} className="text-slate-500"/></button>
            
            <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">Excluir Conta?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Para sua segurança, confirme sua senha para realizar a exclusão definitiva.</p>
            
            <form onSubmit={confirmDeleteAccount} className="space-y-4">
              <input type="password" placeholder="Sua senha atual" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-[#2A2A2A] dark:text-slate-200 rounded-lg border border-slate-200 dark:border-[#333] outline-none focus:ring-2 focus:ring-red-500" required />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 p-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-[#2A2A2A] dark:text-slate-200 dark:hover:bg-[#333] transition-colors">Cancelar</button>
                <button type="submit" disabled={loadingDelete} className="flex-1 p-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-70">{loadingDelete ? 'Excluindo...' : 'Excluir'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};