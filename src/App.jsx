import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Menu, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useTransactions } from './hooks/useTransactions';
import { useFinancialSummary } from './hooks/useSummary';

import { Login } from './components/auth/Login';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { Sidebar } from './Sidebar';
import { Modal } from './Modal';

import { Dashboard } from './components/views/Dashboard';
import { Entradas } from './components/views/Entradas';
import { FixosEProvisoes } from './components/views/FixosEProvisoes';
import { Variaveis } from './components/views/Variaveis';
import { Tags } from './components/views/Tags';
import { Patrimonio } from './components/views/Patrimonio';
import { Movimentacoes } from './components/views/Movimentacoes';
import { AnnualDashboard } from './components/views/AnnualDashboard';
import { Perfil } from './components/views/Perfil';
import { Ajuda } from './components/views/Ajuda';
import { PaywallModal } from './components/views/PaywallModal';

// Mapeamento de Nomes de Abas para Rotas (URL)
const TAB_ROUTES = {
  'Resumo Mensal': '/',
  'Movimentações': '/movimentacoes',
  'Entradas': '/entradas',
  'Dashboard': '/anual',
  'Fixos & Provisões': '/fixos',
  'Gastos Variáveis': '/variaveis',
  'Tags': '/tags',
  'Patrimônio': '/patrimonio',
  'Perfil': '/perfil',
  'Ajuda': '/ajuda'
};

function AppContent() {
  // Consumindo o Contexto de Auth
  const { user, session, authEvent, setAuthEvent, profile, isPro, signOut, refreshProfile, loading: authLoading } = useAuth();
  // Consumindo o Contexto de Theme
  const { theme, setTheme } = useTheme();

  // activeTab removido em favor do Router
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { data, saveTransaction, deleteTransaction, saveTag, deleteTag, togglePaid, settleTransaction } = useTransactions(user);
  
  // Estados de Monetização
  const [showPaywall, setShowPaywall] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estados para Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState(''); 
  const [recurrenceType, setRecurrenceType] = useState('unico'); 
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  // Hooks do Router
  const navigate = useNavigate();
  const location = useLocation();

  // Determina a aba ativa baseada na URL atual (para compatibilidade com Sidebar e Header)
  const activeTab = Object.keys(TAB_ROUTES).find(key => TAB_ROUTES[key] === location.pathname) || 'Resumo Mensal';

  // Função adaptadora para o Sidebar (que espera receber setActiveTab)
  const handleTabChange = (tabName) => {
    const path = TAB_ROUTES[tabName];
    if (path) navigate(path);
  };

  // Lógica de verificação de pagamento (Polling) separada do fetch de dados
  useEffect(() => {
    const checkPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success' && user) {
        let retries = 15;
        while (retries > 0) {
          const updatedProfile = await refreshProfile();
          if (updatedProfile?.subscription_status === 'active') {
            window.history.replaceState({}, document.title, window.location.pathname); // Limpa a URL
            showNotification("Upgrade realizado!", "Agora você é um membro PRO e tem acesso ilimitado.", "success");
            break;
          }
          await new Promise(r => setTimeout(r, 1000)); // Espera 1s
          retries--;
        }
      }
    };
    checkPayment();
  }, [user]); // Executa quando o usuário loga/carrega

  // --- Lógica de Navegação e Filtro ---
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  // Cálculos financeiros movidos para o hook customizado
  const { 
    filteredData, 
    saldoFinal, 
    totalEntradas, 
    totalFixos, 
    totalVariaveis, 
    totalGastosNaoProvisionados, 
    totalGastoProvisionadoEfetivo,
    chartData
  } = useFinancialSummary(data, currentDate);

  // --- Handlers ---

  const showNotification = (title, message, type = 'success') => {
    // Intercepta e melhora mensagens de erro padrão do Supabase
    if (message === 'Invalid login credentials') {
      title = 'Credenciais Inválidas';
      message = 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
      type = 'error';
    }
    if (message === 'Email not confirmed') {
      title = 'E-mail não confirmado';
      message = 'Por favor, verifique sua caixa de entrada e confirme seu e-mail antes de fazer login.';
      type = 'error';
    }
    if (message === 'Error sending confirmation email') {
      title = 'Erro no envio';
      message = 'Não foi possível enviar o e-mail de confirmação. Tente novamente mais tarde.';
      type = 'error';
    }
    if (message === 'User already registered') {
      title = 'E-mail já cadastrado';
      message = 'Este endereço de e-mail já está em uso. Tente fazer login ou recupere sua senha.';
      type = 'error';
    }
    if (message === 'Password should be at least 6 characters') {
      title = 'Senha muito curta';
      message = 'A senha deve ter pelo menos 6 caracteres para sua segurança.';
      type = 'error';
    }
    setNotification({ isOpen: true, title, message, type });
  };

  const openConfirmModal = (title, message, onConfirm) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDelete = (id, type) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir item?',
      message: 'Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.',
      onConfirm: async () => {
        if (type === 'tag') {
          await deleteTag(id);
        } else {
          await deleteTransaction(id);
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSettle = (item) => {
    setConfirmConfig({
      isOpen: true,
      title: `Quitar "${item.descricao}"?`,
      message: 'Isso removerá todas as parcelas/cobranças futuras deste item.',
      onConfirm: async () => {
        await settleTransaction(item.groupId, item.data);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData);
    
    const listKey = modalType === 'variavel' ? 'variaveis' : 
                    modalType === 'entrada' ? 'entradas' : 
                    modalType === 'fixo' ? 'fixos' : 
                    modalType === 'tag' ? 'tags' : 
                    modalType === 'poupanca' ? 'poupanca' : 'provisoes';
    
    if (values.valor) values.valor = parseFloat(values.valor);

    // --- Lógica de Paywall ---
    if (!isPro) {
      if (listKey === 'fixos' && data.fixos.length >= 5 && !editingItem) {
        setShowPaywall(true);
        return;
      }
      if (listKey === 'provisoes' && data.provisoes.length >= 3 && !editingItem) {
        setShowPaywall(true);
        return;
      }
      if (listKey === 'tags' && data.tags.length >= 5 && !editingItem) {
        setShowPaywall(true);
        return;
      }
    }
    // --- Fim da Lógica de Paywall ---
    
    if (modalType !== 'tag' && !values.valor) {
      showNotification("Valor Inválido", "Por favor, insira um valor válido para continuar.", "error");
      return;
    }

    if (values.tagId !== undefined) {
      values.tagId = values.tagId === '' ? null : parseInt(values.tagId);
    }

    // Lógica de data
    if (formData.get('data')) {
      // Prioridade 1: Um input de data completo (type="date")
      values.data = formData.get('data');
    } else if (modalType !== 'tag') {
      // Prioridade 2: Lógica para o input de dia (type="number")
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      let day;

      if (editingItem && editingItem.data) {
        // Para edição, usa o dia do formulário ou o dia original do item
        day = formData.get('day') || editingItem.data.split('-')[2];
      } else { // Para novos itens
        const dayFromForm = formData.get('day');
        if (dayFromForm) {
          day = dayFromForm;
        } else {
          const today = new Date();
          const isCurrentMonth = currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();
          day = isCurrentMonth ? today.getDate() : '1';
        }
      }
      values.data = `${year}-${month}-${String(day).padStart(2, '0')}`;
    }

    const transactionData = {
      descricao: values.descricao,
      valor: values.valor,
      data: values.data,
      tipo: modalType === 'provisao' ? 'provisao' : modalType === 'poupanca' ? 'poupanca' : modalType,
      tagId: values.tagId || null,
      tipoPoupanca: values.tipoPoupanca || null
    };

    if (modalType === 'tag') {
      await saveTag(values, editingItem?.id);
    } else {
      await saveTransaction(
        transactionData, 
        editingItem?.id, 
        { type: recurrenceType, installments: values.installments }
      );
    }
    
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleTogglePaid = async (id) => {
    await togglePaid(id);
  };

  const handleLogout = async () => {
    await signOut();
    setShowLogoutConfirm(false);
  };

  const openModal = (type, item = null) => {
    setModalType(type.toLowerCase());
    setRecurrenceType('unico'); 
    
    if (item) {
      setEditingItem(item);
    } else {
      // Define o dia padrão: Hoje (se estiver no mês atual) ou dia 1
      const today = new Date();
      const isCurrentMonth = currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();
      const day = isCurrentMonth ? today.getDate() : 1;
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      
      setEditingItem({ data: `${year}-${month}-${dayStr}` });
    }
    setModalOpen(true);
  };

  // Componente do Modal de Notificação (definido aqui para reutilização no Login e no App)
  const notificationModal = notification.isOpen && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#1F1F1F] w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${notification.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
            {notification.type === 'error' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
        </div>
        <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">{notification.title}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{notification.message}</p>
        <button onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))} className="w-full p-3 rounded-xl font-bold text-white bg-[#3457A4] dark:bg-[#0B0C0C] hover:opacity-90 transition-opacity shadow-lg">
          OK
        </button>
      </div>
    </div>
  );

  if (authEvent === 'PASSWORD_RECOVERY') {
    return <UpdatePassword onPasswordUpdated={() => setAuthEvent(null)} />;
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#E6EAF7] dark:bg-[#0C0C0C] text-slate-500">Carregando...</div>;

  if (!user) return (
    <>
      <Login showNotification={showNotification} />
      {notificationModal}
    </>
  );

  return (
    <div className="min-h-screen bg-[#E6EAF7] dark:bg-[#0C0C0C] font-sans text-slate-600 dark:text-slate-300 pb-10">
      <Sidebar 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeTab={activeTab}
        setActiveTab={handleTabChange} // Usa o navegador do Router
        setShowLogoutConfirm={setShowLogoutConfirm}
        user={user}
        isPro={isPro}
        setShowPaywall={setShowPaywall}
      />
      <Modal 
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editingItem={editingItem}
        modalType={modalType}
        handleSave={handleSave}
        data={data}
        currentDate={currentDate}
        recurrenceType={recurrenceType}
        setRecurrenceType={setRecurrenceType}
      />

      {/* Modal Paywall */}
      {showPaywall && <PaywallModal setShowPaywall={setShowPaywall} showNotification={showNotification} />}

      {/* Modal Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1F1F1F] w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">Sair da conta?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Tem certeza que deseja sair da plataforma?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 p-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-[#2A2A2A] dark:text-slate-200 dark:hover:bg-[#333] transition-colors">Cancelar</button>
              <button onClick={handleLogout} className="flex-1 p-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">Sim, sair</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generic Confirmation */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1F1F1F] w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">{confirmConfig.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{confirmConfig.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} className="flex-1 p-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-[#2A2A2A] dark:text-slate-200 dark:hover:bg-[#333] transition-colors">Cancelar</button>
              <button onClick={confirmConfig.onConfirm} className="flex-1 p-3 rounded-xl font-bold text-white bg-[#3457A4] dark:bg-[#0B0C0C] hover:opacity-90 transition-opacity shadow-lg">Sim, confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notification (Success/Error) */}
      {notificationModal}

      {/* Header Fixo */}
      <div className="sticky top-0 z-30 shadow-md">
        <header className="bg-[#3457A4] dark:bg-[#0B0C0C] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-lg text-white">{activeTab}</h1>
          </div>
        </header>
        {!['Perfil', 'Tags', 'Dashboard', 'Ajuda'].includes(activeTab) && (
          <div className="bg-white dark:bg-[#1F1F1F] w-full">
            <div className="flex items-center justify-between gap-4 p-3 max-w-lg mx-auto">
              <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2A2A] text-[#3457A4] dark:text-slate-200 transition-all active:scale-95"><ChevronLeft size={24}/></button>
              <span className="text-lg font-bold text-[#3457A4] dark:text-slate-100 uppercase text-center">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long' })} {currentDate.getFullYear()}
              </span>
              <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2A2A] text-[#3457A4] dark:text-slate-200 transition-all active:scale-95"><ChevronRight size={24}/></button>
            </div>
          </div>
        )}
      </div>

      {/* Área Principal */}
      <main className="p-4 max-w-lg mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard 
            saldoFinal={saldoFinal}
            totalEntradas={totalEntradas}
            totalFixos={totalFixos}
            totalGastoProvisionadoEfetivo={totalGastoProvisionadoEfetivo}
            totalGastosNaoProvisionados={totalGastosNaoProvisionados}
            filteredData={filteredData}
            chartData={chartData}
            totalVariaveis={totalVariaveis}
            openModal={openModal}
          />} />
          <Route path="/movimentacoes" element={<Movimentacoes filteredData={filteredData} setActiveTab={handleTabChange} openModal={openModal} totalEntradas={totalEntradas} />} />
          <Route path="/entradas" element={<Entradas filteredData={filteredData} totalEntradas={totalEntradas} openModal={openModal} handleDelete={handleDelete} />} />
          <Route path="/anual" element={<AnnualDashboard data={data} />} />
          <Route path="/fixos" element={<FixosEProvisoes filteredData={filteredData} openModal={openModal} handleDelete={handleDelete} handleTogglePaid={handleTogglePaid} handleSettle={handleSettle} />} />
          <Route path="/variaveis" element={<Variaveis filteredData={filteredData} totalVariaveis={totalVariaveis} openModal={openModal} handleDelete={handleDelete} />} />
          <Route path="/tags" element={<Tags filteredData={filteredData} openModal={openModal} />} />
          <Route path="/patrimonio" element={<Patrimonio data={data} filteredData={filteredData} currentDate={currentDate} openModal={openModal} handleDelete={handleDelete} />} />
          <Route path="/perfil" element={<Perfil user={session?.user} theme={theme} setTheme={setTheme} openConfirmModal={openConfirmModal} profile={profile} setShowPaywall={setShowPaywall} />} />
          <Route path="/ajuda" element={<Ajuda />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
