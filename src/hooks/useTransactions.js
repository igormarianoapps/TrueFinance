import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { toLocalISO } from '../utils/formatters';

export function useTransactions(user) {
  const [data, setData] = useState({ entradas: [], fixos: [], provisoes: [], tags: [], variaveis: [], poupanca: [] });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    const { data: transacoes, error: errorTransacoes } = await supabase.from('transacoes').select('*');
    const { data: tags, error: errorTags } = await supabase.from('tags').select('*');
    
    if (errorTransacoes || errorTags) {
      console.error('Erro ao buscar dados', { errorTransacoes, errorTags });
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
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveTag = async (values, editingId = null) => {
    if (editingId) {
      const { error } = await supabase.from('tags').update({ nome: values.nome, cor: values.cor }).eq('id', editingId);
      if (error) console.error('Erro ao atualizar tag:', error);
    } else {
      const { error } = await supabase.from('tags').insert({ user_id: user.id, nome: values.nome, cor: values.cor });
      if (error) console.error('Erro ao criar tag:', error);
    }
    fetchData();
  };

  const deleteTag = async (id) => {
    await supabase.from('tags').delete().eq('id', id);
    fetchData();
  };

  const saveTransaction = async (transactionData, editingId = null, recurrence = { type: 'unico', installments: 1 }) => {
    const commonData = {
      user_id: user.id,
      descricao: transactionData.descricao,
      valor: transactionData.valor,
      data: transactionData.data,
      tipo: transactionData.tipo,
      tag_id: transactionData.tagId || null,
      tipo_poupanca: transactionData.tipoPoupanca || null
    };

    if (editingId) {
      const { error } = await supabase.from('transacoes').update(commonData).eq('id', editingId);
      if (error) console.error('Erro ao atualizar transação:', error);
    } else {
      const newItems = [];
      const baseId = Date.now(); 

      if (transactionData.tipo === 'fixo' && recurrence.type !== 'unico') {
        const groupId = baseId.toString();
        const [y, m, d] = transactionData.data.split('-').map(Number);
        const baseDate = new Date(y, m - 1, d);
        
        const iterations = recurrence.type === 'parcelado' ? parseInt(recurrence.installments || 1) : 24; 

        for (let i = 0; i < iterations; i++) {
          const nextDate = new Date(baseDate);
          nextDate.setMonth(baseDate.getMonth() + i);
          
          newItems.push({
            ...commonData,
            data: toLocalISO(nextDate),
            pago: false,
            group_id: groupId,
            parcela_info: recurrence.type === 'parcelado' ? `${i + 1}/${iterations}` : null,
            is_recurring: recurrence.type === 'mensal'
          });
        }
      } else {
        const newItem = { ...commonData, pago: transactionData.tipo === 'fixo' ? false : undefined };
        if (newItem.pago === undefined) delete newItem.pago;
        newItems.push(newItem);
      }
      
      if (newItems.length > 0) {
        const { error } = await supabase.from('transacoes').insert(newItems);
        if (error) console.error('Erro ao criar transações:', error);
      }
    }
    fetchData();
  };

  const deleteTransaction = async (id) => {
    await supabase.from('transacoes').delete().eq('id', id);
    fetchData();
  };

  const togglePaid = async (id) => {
    const item = data.fixos.find(i => i.id === id);
    if (item) {
      await supabase.from('transacoes').update({ pago: !item.pago }).eq('id', id);
      fetchData();
    }
  };

  const settleTransaction = async (groupId, dateLimit) => {
    await supabase.from('transacoes').delete().eq('group_id', groupId).gt('data', dateLimit);
    fetchData();
  };

  return { 
    data, 
    loading, 
    refresh: fetchData, 
    saveTag, 
    deleteTag, 
    saveTransaction, 
    deleteTransaction, 
    togglePaid, 
    settleTransaction 
  };
}