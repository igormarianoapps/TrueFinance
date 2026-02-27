import React from 'react';
import { 
  PieChart, TrendingUp, Calendar, TrendingDown, Tag, Wallet, X, LogOut
} from 'lucide-react';

export const Sidebar = ({ isMenuOpen, setIsMenuOpen, activeTab, setActiveTab, setShowLogoutConfirm }) => {
  const menuItems = [
    { id: 'Dashboard', icon: PieChart },
    { id: 'Entradas', icon: TrendingUp },
    { id: 'Fixos & Provisões', icon: Calendar },
    { id: 'Saídas', icon: TrendingDown },
    { id: 'Tags', icon: Tag },
    { id: 'Patrimônio', icon: Wallet },
  ];

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
        <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="font-bold text-xl text-slate-900">Financeiro 2026</h2>
            <p className="text-xs text-slate-400">Controle Pessoal</p>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
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