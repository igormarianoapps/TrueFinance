import React, { useState, useEffect } from 'react';
import { 
  PieChart, ArrowLeftRight, Tag, Wallet, LogOut, X, User
} from 'lucide-react';
import { supabase } from './supabaseClient';

export const Sidebar = ({ isMenuOpen, setIsMenuOpen, activeTab, setActiveTab, setShowLogoutConfirm, user }) => {
  const menuItems = [
    { id: 'Dashboard', icon: PieChart },
    { id: 'Movimentações', icon: ArrowLeftRight },
    { id: 'Tags', icon: Tag },
    { id: 'Patrimônio', icon: Wallet },
    { id: 'Perfil', icon: User },
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
      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-3 flex flex-col items-center border-b border-slate-100 bg-slate-50 relative">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500"/>
          </button>

          <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white shadow-lg flex items-center justify-center mb-2 mt-4 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar do usuário" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-slate-600">{initials}</span>
            )}
          </div>
          <h2 className="font-bold text-lg text-slate-700">Bem-vindo, {firstName}</h2>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-[#1B1B35] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.id}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 mt-auto">
          <div className="w-full h-px bg-slate-200 mb-2"></div>
          <div className="flex justify-center">
            <img src="/logopiggy.png" alt="Logo" className="w-28 mb-2 object-contain" />
          </div>
          <div className="w-full h-px bg-slate-200 mb-2"></div>

          <button
            onClick={() => { setIsMenuOpen(false); setShowLogoutConfirm(true); }}
            className="w-full flex items-center gap-3 p-2 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};