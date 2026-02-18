import React, { useState, useMemo, useEffect } from 'react';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from './supabaseClient';
import { toLocalISO } from './utils/formatters';

import { Login } from './components/auth/Login';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { Sidebar } from './Sidebar';
import { Modal } from './Modal';

import { Dashboard } from './components/views/Dashboard';
import { Entradas } from './components/views/Entradas';
import { FixosEProvisoes } from './components/views/FixosEProvisoes';
import { Variaveis } from './components/views/Variaveis';
import { Tags } from './components/views/Tags';
import { Patrimonio } from './Patrimonio';
import { Movimentacoes } from './components/views/Movimentacoes';
import { Perfil } from './components/views/Perfil';

export default function App() {
  const [session, setSession] = useState(null);
  const [authEvent, setAuthEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [data, setData] = useState({ entradas: [], fixos: [], provisoes: [], tags: [], variaveis: [], poupanca: [] });
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));
  
  // Estados para Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState(''); 
  const [recurrenceType, setRecurrenceType] = useState('unico'); 
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // --- Auth & Data Fetching ---
  useEffect(() => {
    document.title = 'True Finance';

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setAuthEvent(event);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!session) return;
    
    const { data: transacoes, error: errorTransacoes } = await supabase.from('transacoes').select('*');
    const { data: tags, error: errorTags } = await supabase.from('tags').select('*');

    if (errorTransacoes || errorTags) {
      console.error('Erro ao buscar dados', errorTransacoes, errorTags);
      return;
    }

    // Mapeia do banco (snake_case) para o app (camelCase)
    const mapTransaction = (t) => ({
      ...t,
      tagId: t.tag_id,
      groupId: t.group_id,
      parcelaInfo: t.parcela_info,
      isRecurring: t.is_recurring,
      tipoPoupanca: t.tipo_poupanca
    });

    setData({
      entradas: transacoes.filter(t => t.tipo === 'entrada').map(mapTransaction),
      fixos: transacoes.filter(t => t.tipo === 'fixo').map(mapTransaction),
      variaveis: transacoes.filter(t => t.tipo === 'variavel').map(mapTransaction),
      provisoes: transacoes.filter(t => t.tipo === 'provisao').map(mapTransaction),
      poupanca: transacoes.filter(t => t.tipo === 'poupanca').map(mapTransaction),
      tags: tags || []
    });
  };

  useEffect(() => { fetchData(); }, [session]);

  // --- Lógica de Navegação e Filtro ---
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  const filteredData = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const filterFn = (item) => {
      if (!item.data) return false;
      const [itemYear, itemMonth] = item.data.split('-').map(Number);
      return (itemMonth - 1) === month && itemYear === year;
    };

    return {
      entradas: data.entradas.filter(filterFn),
      fixos: data.fixos.filter(filterFn).sort((a, b) => {
        const dateDiff = new Date(a.data) - new Date(b.data);
        if (dateDiff !== 0) return dateDiff;
        return a.id > b.id ? 1 : -1;
      }),
      variaveis: data.variaveis.filter(filterFn),
      provisoes: (data.provisoes || []).filter(filterFn),
      poupanca: (data.poupanca || []).filter(filterFn),
      tags: data.tags 
    };
  }, [data, currentDate]);

  // Cálculos Derivados
  const { saldoFinal, totalEntradas, totalFixos, totalVariaveis, totalProvisionado, totalGastosNaoProvisionados, totalGastoProvisionadoEfetivo } = useMemo(() => {
    const entradasCalc = filteredData.entradas.reduce((acc, item) => acc + item.valor, 0);
    const fixosCalc = filteredData.fixos.reduce((acc, item) => acc + item.valor, 0);
    const variaveisCalc = filteredData.variaveis.reduce((acc, item) => acc + item.valor, 0);
    const provisionadoCalc = (filteredData.provisoes || []).reduce((acc, item) => acc + item.valor, 0);

    const provisionedTagIds = (filteredData.provisoes || []).map(p => p.tagId).filter(Boolean);
    const gastosNaoProvisionados = filteredData.variaveis.filter(g => !provisionedTagIds.includes(g.tagId));
    const totalGastosNaoProvisionados = gastosNaoProvisionados.reduce((acc, g) => acc + g.valor, 0);

    let totalGastoProvisionadoEfetivo = 0;
    (filteredData.provisoes || []).forEach(provisao => {
      if (provisao.tagId) {
        const gastosNoEnvelope = filteredData.variaveis
          .filter(g => g.tagId === provisao.tagId)
          .reduce((acc, g) => acc + g.valor, 0);
        
        totalGastoProvisionadoEfetivo += Math.max(provisao.valor || 0, gastosNoEnvelope);
      } else {
        totalGastoProvisionadoEfetivo += provisao.valor || 0;
      }
    });

    const movimentacaoPoupanca = (filteredData.poupanca || []).reduce((acc, item) => {
      return acc + (item.tipoPoupanca === 'entrada' ? item.valor : -item.valor);
    }, 0);

    const totalGastoFinal = fixosCalc + totalGastosNaoProvisionados + totalGastoProvisionadoEfetivo;
    const saldoCalc = entradasCalc - totalGastoFinal - movimentacaoPoupanca;

    return { 
      saldoFinal: saldoCalc, 
      totalEntradas: entradasCalc, 
      totalFixos: fixosCalc, 
      totalVariaveis: variaveisCalc, 
      totalProvisionado: provisionadoCalc,
      totalGastosNaoProvisionados,
      totalGastoProvisionadoEfetivo
    };
  }, [filteredData]);

  // Dados para o Gráfico
  const chartData = useMemo(() => {
    const grouped = {};
    filteredData.variaveis.forEach(item => {
      const tag = filteredData.tags.find(t => t.id === Number(item.tagId));
      if (!tag) return;
      if (!grouped[tag.nome]) grouped[tag.nome] = { valor: 0, color: tag.cor };
      grouped[tag.nome].valor += item.valor;
    });
    return Object.keys(grouped).map(key => ({
      label: key,
      valor: grouped[key].valor,
      cor: grouped[key].color
    })).sort((a, b) => b.valor - a.valor);
  }, [filteredData.variaveis, filteredData.tags]);

  // --- Handlers ---

  const handleDelete = (id, type) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir item?',
      message: 'Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.',
      onConfirm: async () => {
        if (type === 'tag') {
          await supabase.from('tags').delete().eq('id', id);
        } else {
          await supabase.from('transacoes').delete().eq('id', id);
        }
        fetchData();
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
        await supabase.from('transacoes').delete().eq('group_id', item.groupId).gt('data', item.data);
        fetchData();
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
    
    if (modalType !== 'tag' && !values.valor) {
      alert("Por favor, insira um valor válido.");
      return;
    }

    if (values.tagId !== undefined) {
      values.tagId = values.tagId === '' ? null : parseInt(values.tagId);
    }

    if (modalType !== 'tag' && modalType !== 'provisao' && modalType !== 'poupanca') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      values.data = `${year}-${String(month).padStart(2, '0')}-01`; 
    } else if (modalType === 'provisao' || modalType === 'poupanca') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      values.data = `${year}-${String(month).padStart(2, '0')}-01`;
    }

    // Se o formulário enviou uma data específica (ex: input type="date"), usamos ela
    if (formData.get('data')) {
        values.data = formData.get('data');
    }

    // Se o formulário enviou apenas o dia (novo comportamento), construímos a data completa
    if (formData.get('day')) {
      const day = String(formData.get('day')).padStart(2, '0');
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      values.data = `${year}-${month}-${day}`;
    }

    const commonData = {
      user_id: session.user.id,
      descricao: values.descricao,
      valor: values.valor,
      data: values.data,
      tipo: modalType === 'provisao' ? 'provisao' : modalType === 'poupanca' ? 'poupanca' : modalType,
      tag_id: values.tagId || null,
      tipo_poupanca: values.tipoPoupanca || null
    };

    if (editingItem) {
      if (modalType === 'tag') {
        const { error } = await supabase.from('tags').update({ nome: values.nome, cor: values.cor }).eq('id', editingItem.id);
        if (error) console.error('Erro ao atualizar tag:', error);
      } else {
        const { error } = await supabase.from('transacoes').update(commonData).eq('id', editingItem.id);
        if (error) console.error('Erro ao atualizar transação:', error);
      }
    } else {
      if (modalType === 'tag') {
        const { error } = await supabase.from('tags').insert({ user_id: session.user.id, nome: values.nome, cor: values.cor });
        if (error) console.error('Erro ao criar tag:', error);
      } else {
        const newItems = [];
        const baseId = Date.now(); 

        if (listKey === 'fixos' && recurrenceType !== 'unico') {
          const groupId = baseId.toString();
          const [y, m, d] = values.data.split('-').map(Number);
          const baseDate = new Date(y, m - 1, d);
          
          const iterations = recurrenceType === 'parcelado' ? parseInt(values.installments || 1) : 24; 

          for (let i = 0; i < iterations; i++) {
            const nextDate = new Date(baseDate);
            nextDate.setMonth(baseDate.getMonth() + i);
            
            newItems.push({
              ...commonData,
              data: toLocalISO(nextDate),
              pago: false,
              group_id: groupId,
              parcela_info: recurrenceType === 'parcelado' ? `${i + 1}/${iterations}` : null,
              is_recurring: recurrenceType === 'mensal'
            });
          }
        } else {
          const newItem = { ...commonData, pago: listKey === 'fixos' ? false : undefined };
          if (newItem.pago === undefined) delete newItem.pago;
          newItems.push(newItem);
        }
        
        if (newItems.length > 0) {
          const { error } = await supabase.from('transacoes').insert(newItems);
          if (error) console.error('Erro ao criar transações:', error);
        }
      }
    }
    
    fetchData();
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleTogglePaid = async (id) => {
    const item = data.fixos.find(i => i.id === id);
    if (item) {
      await supabase.from('transacoes').update({ pago: !item.pago }).eq('id', id);
      fetchData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogoutConfirm(false);
  };

  const openModal = (type, item = null) => {
    setModalType(type.toLowerCase());
    setEditingItem(item);
    setRecurrenceType('unico'); 
    setModalOpen(true);
  };

  if (authEvent === 'PASSWORD_RECOVERY') {
    return <UpdatePassword onPasswordUpdated={() => setAuthEvent(null)} />;
  }

  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-600 pb-10">
      <Sidebar 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setShowLogoutConfirm={setShowLogoutConfirm}
        user={session?.user}
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

      {/* Modal Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-slate-800">Sair da conta?</h2>
            <p className="text-slate-500 mb-6">Tem certeza que deseja sair da plataforma?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 p-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={handleLogout} className="flex-1 p-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">Sim, sair</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generic Confirmation */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-slate-800">{confirmConfig.title}</h2>
            <p className="text-slate-500 mb-6">{confirmConfig.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} className="flex-1 p-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={confirmConfig.onConfirm} className="flex-1 p-3 rounded-xl font-bold text-white bg-[#12111C] hover:opacity-90 transition-opacity shadow-lg">Sim, confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Fixo */}
      <div className="sticky top-0 z-30 shadow-md">
        <header className="bg-[#12111C] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-lg text-white">{activeTab}</h1>
          </div>
        </header>
        <div className="bg-white w-full">
          <div className="flex items-center justify-between gap-4 p-3 max-w-lg mx-auto">
            <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-slate-100 text-[#12111C] transition-all active:scale-95"><ChevronLeft size={24}/></button>
            <span className="text-lg font-bold text-[#12111C] uppercase text-center">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long' })} {currentDate.getFullYear()}
            </span>
            <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-slate-100 text-[#12111C] transition-all active:scale-95"><ChevronRight size={24}/></button>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <main className="p-4 max-w-lg mx-auto w-full">
        {activeTab === 'Dashboard' && <Dashboard 
          saldoFinal={saldoFinal}
          totalEntradas={totalEntradas}
          totalFixos={totalFixos}
          totalGastoProvisionadoEfetivo={totalGastoProvisionadoEfetivo}
          totalGastosNaoProvisionados={totalGastosNaoProvisionados}
          filteredData={filteredData}
          chartData={chartData}
          totalVariaveis={totalVariaveis}
          openModal={openModal}
        />}
        {activeTab === 'Movimentações' && <Movimentacoes filteredData={filteredData} setActiveTab={setActiveTab} />}
        {activeTab === 'Entradas' && <Entradas filteredData={filteredData} totalEntradas={totalEntradas} openModal={openModal} handleDelete={handleDelete} />}
        {activeTab === 'Fixos & Provisões' && <FixosEProvisoes filteredData={filteredData} openModal={openModal} handleDelete={handleDelete} handleTogglePaid={handleTogglePaid} handleSettle={handleSettle} />}
        {activeTab === 'Gastos Variáveis' && <Variaveis filteredData={filteredData} totalVariaveis={totalVariaveis} openModal={openModal} handleDelete={handleDelete} />}
        {activeTab === 'Tags' && <Tags filteredData={filteredData} openModal={openModal} />}
        {activeTab === 'Patrimônio' && <Patrimonio data={data} filteredData={filteredData} currentDate={currentDate} openModal={openModal} handleDelete={handleDelete} />}
        {activeTab === 'Perfil' && <Perfil user={session?.user} />}
      </main>
    </div>
  );
}
