import React, { useState, useEffect } from 'react';
import { 
  PieChart, ArrowLeftRight, Tag, Wallet, LogOut, X, User, LineChart, HelpCircle
} from 'lucide-react';
import { supabase } from './supabaseClient';

export const Sidebar = ({ isMenuOpen, setIsMenuOpen, activeTab, setActiveTab, setShowLogoutConfirm, user, isPro, setShowPaywall }) => {
  const menuItems = [
    { id: 'Resumo Mensal', icon: PieChart },
    // Adicione aqui outros itens gratuitos se houver
    { id: 'Movimentações', icon: ArrowLeftRight },
    { id: 'Patrimônio', icon: Wallet, pro: true },
    { id: 'Dashboard', icon: LineChart, pro: true },
    { id: 'Tags', icon: Tag },
    { id: 'Perfil', icon: User },
    { id: 'Ajuda', icon: HelpCircle },
  ];

  const [avatarUrl, setAvatarUrl] = useState(null);
  const fullName = user?.user_metadata?.full_name || 'Usuário';
  const firstName = fullName.split(' ')[0];
  const initials = fullName.substring(0, 2).toUpperCase();

  useEffect(() => {
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

  const handleTabClick = (item) => {
    // Se o item for "Pro" e o usuário não for "Pro", mostra o paywall
    if (item.pro && !isPro) {
      setShowPaywall(true);
    } else {
      // Senão, navega normalmente
      setActiveTab(item.id);
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Overlay Escuro */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      {/* Drawer (Menu Lateral) */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-[#1F1F1F] z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-3 flex flex-col items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#2A2A2A] relative">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400"/>
          </button>

          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-lg flex items-center justify-center mb-2 mt-4 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar do usuário" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-slate-600 dark:text-slate-300">{initials}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-slate-700 dark:text-slate-200">Bem-vindo, {firstName}</h2>
            {isPro ? (
              <span className="text-xs font-bold bg-[#E95415] text-white px-2 py-0.5 rounded-full">PRO</span>
            ) : (
              <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full dark:bg-slate-700 dark:text-slate-300">FREE</span>
            )}
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all relative ${activeTab === item.id ? 'bg-[#3457A4] dark:bg-[#3457A4] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2A2A2A]'}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.id}</span>
              {!isPro && item.pro && (
                <span className="ml-auto text-[10px] font-bold bg-[#E95415] text-white px-1.5 py-0.5 rounded-full">PRO</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 mt-auto">
          <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-2"></div>
          <div className="flex justify-center">
            <img src="/logopiggy.png" alt="Logo" className="w-28 mb-2 object-contain dark:hidden" />
            <img src="/logopiggydark.png" alt="Logo" className="w-28 mb-2 object-contain hidden dark:block" />
          </div>
          <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-2"></div>

          <button
            onClick={() => { setIsMenuOpen(false); setShowLogoutConfirm(true); }}
            className="w-full flex items-center gap-3 p-2 rounded-xl text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};