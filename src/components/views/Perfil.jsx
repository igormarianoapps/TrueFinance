import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../ui/Card';
import { User, Lock, Camera, Sun, Moon, Monitor } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export const Perfil = ({ user, theme, setTheme }) => {
  const [fullName, setFullName] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const userFullName = user?.user_metadata?.full_name || 'Usuário';
  const userInitials = userFullName.substring(0, 2).toUpperCase();

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
    if (user?.user_metadata?.avatar_url) {
      downloadImage(user.user_metadata.avatar_url);
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  const downloadImage = async (path) => {
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
  };

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
    if (!window.confirm('Você receberá um e-mail para redefinir sua senha. Deseja continuar?')) {
      return;
    }
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
    </div>
  );
};