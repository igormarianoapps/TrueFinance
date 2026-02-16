import React from 'react';
import { 
  PieChart, TrendingUp, Calendar, TrendingDown, Tag, Wallet, LogOut, X
} from 'lucide-react';

export const Sidebar = ({ isMenuOpen, setIsMenuOpen, activeTab, setActiveTab, setShowLogoutConfirm, user }) => {
  const menuItems = [
    { id: 'Dashboard', icon: PieChart },
    { id: 'Entradas', icon: TrendingUp },
    { id: 'Fixos & Provisões', icon: Calendar },
    { id: 'Gastos Variáveis', icon: TrendingDown },
    { id: 'Tags', icon: Tag },
    { id: 'Patrimônio', icon: Wallet },
  ];

  const fullName = user?.user_metadata?.full_name || 'Usuário';
  const firstName = fullName.split(' ')[0];
  const initials = fullName.substring(0, 2).toUpperCase();

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
        <div className="p-6 flex flex-col items-center border-b border-slate-100 bg-slate-50 relative">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500"/>
          </button>
          <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white shadow-lg flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-slate-600">{initials}</span>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium mb-1">Bem-vindo</p>
            <h2 className="font-bold text-lg text-slate-700">{firstName}</h2>
          </div>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-gradient-to-r from-[#4F39F6] to-[#860BDD] text-white shadow-md shadow-violet-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.id}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => { setIsMenuOpen(false); setShowLogoutConfirm(true); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};