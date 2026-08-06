import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { toLocalISO } from '../utils/formatters';

export function useTransactions(user) {
  const [data, setData] = useState({ entradas: [], fixos: [], provisoes: [], tags: [], variaveis: [], poupanca: [], creditCards: [] });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    let allTransactions = [];
    let page = 0;
    let errorTransacoes = null;
    const pageSize = 1000; // O Supabase tem um limite padrão de 1000

    while (true) {
      const { data: pageData, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: true }) // Mantém a ordem cronológica original
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        errorTransacoes = error;
        break;
      }

      if (pageData) {
        allTransactions = allTransactions.concat(pageData);
      }

      // Se a página retornou menos que o tamanho máximo, é a última página.
      if (!pageData || pageData.length < pageSize) {
        break;
      }

      page++;
    }

    const { data: tags, error: errorTags } = await supabase.from('tags').select('*').eq('user_id', user.id);
    const { data: creditCards, error: errorCards } = await supabase.from('credit_cards').select('*').eq('user_id', user.id);
    
    if (errorTransacoes || errorTags || errorCards) {
      console.error('Erro ao buscar dados', { errorTransacoes, errorTags, errorCards });
      return;
    }

    // Mapeia do banco (snake_case) para o app (camelCase)
    const mapTransaction = (t) => ({
      ...t,
      tagId: t.tag_id,
      groupId: t.group_id,
      parcelaInfo: t.parcela_info,
      isRecurring: t.is_recurring,
      tipoPoupanca: t.tipo_poupanca,
      paymentMethod: t.payment_method,
      creditCardId: t.credit_card_id
    });

    setData({
      entradas: allTransactions.filter(t => t.tipo === 'entrada').map(mapTransaction),
      fixos: allTransactions.filter(t => t.tipo === 'fixo').map(mapTransaction),
      variaveis: allTransactions.filter(t => t.tipo === 'variavel').map(mapTransaction),
      provisoes: allTransactions.filter(t => t.tipo === 'provisao').map(mapTransaction),
      poupanca: allTransactions.filter(t => t.tipo === 'poupanca').map(mapTransaction),
      tags: tags || [],
      creditCards: creditCards || []
    });
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveTag = async (values, editingId = null) => {
    let query;
    if (editingId) {
      query = supabase.from('tags').update({ nome: values.nome, cor: values.cor }).eq('id', editingId);
    } else {
      query = supabase.from('tags').insert({ user_id: user.id, nome: values.nome, cor: values.cor });
    }
    const { error } = await query;
    if (error) {
      console.error('Erro ao salvar tag:', error);
    }
    await fetchData();
    return { error };
  };

  const deleteTag = async (id) => {
    await supabase.from('tags').delete().eq('id', id);
    fetchData();
  };

  const saveCreditCard = async (values, editingId = null) => {
    const cardData = {
      user_id: user.id,
      name: values.name,
      due_date: parseInt(values.dueDate),
      closing_date: parseInt(values.closingDate)
    };

    let query;
    if (editingId) {
      query = supabase.from('credit_cards').update({ 
        name: cardData.name, 
        due_date: cardData.due_date, 
        closing_date: cardData.closing_date 
      }).eq('id', editingId);
    } else {
      query = supabase.from('credit_cards').insert(cardData);
    }
    const { error } = await query;
    if (error) {
      console.error('Erro ao salvar cartão:', error);
    }
    await fetchData();
    return { error };
  };

  const saveTransaction = async (transactionData, editingId = null, recurrence = { type: 'unico', installments: 1 }) => {
    let finalError = null;

    const commonData = {
      user_id: user.id,
      descricao: transactionData.descricao,
      valor: transactionData.valor,
      data: transactionData.data,
      tipo: transactionData.tipo,
      tag_id: transactionData.tagId || null,
      tipo_poupanca: transactionData.tipoPoupanca || null,
      payment_method: transactionData.paymentMethod || 'debit',
      credit_card_id: transactionData.creditCardId || null
    };

    if (editingId) {
      const updateData = { ...commonData };

      // Lógica para atualizar recorrência na edição
      if (recurrence.type === 'mensal') {
        updateData.is_recurring = true;
        updateData.parcela_info = null;
      } else if (recurrence.type === 'parcelado') {
        updateData.is_recurring = false;
        // Preserva a parcela atual se o número de parcelas não mudou, senão reinicia para 1/N
        if (transactionData.parcelaInfo && transactionData.parcelaInfo.endsWith(`/${recurrence.installments}`)) {
           updateData.parcela_info = transactionData.parcelaInfo;
        } else {
           updateData.parcela_info = `1/${recurrence.installments}`;
        }
      } else {
        updateData.is_recurring = false;
        updateData.parcela_info = null;
      }

      const { error } = await supabase.from('transacoes').update(updateData).eq('id', editingId);
      if (error) {
        console.error('Erro ao atualizar transação:', error);
        finalError = error;
      }

      // Propaga a edição para recorrências futuras (mesmo Group ID e data posterior)
      const allItems = [...data.entradas, ...data.fixos, ...data.variaveis, ...data.provisoes, ...data.poupanca];
      const originalItem = allItems.find(i => i.id === editingId);

      if (!error && originalItem?.groupId) {
        const futureUpdateData = { ...updateData };
        delete futureUpdateData.data; // Preserva datas originais dos meses futuros
        delete futureUpdateData.id;
        if (recurrence.type === 'parcelado') delete futureUpdateData.parcela_info; // Preserva numeração (ex: 2/12)

        const { error: futureError } = await supabase
          .from('transacoes')
          .update(futureUpdateData)
          .eq('group_id', originalItem.groupId)
          .gt('data', originalItem.data) // Apenas datas futuras em relação ao item original
          .neq('id', editingId);
          
        if (futureError) {
          console.error('Erro ao propagar edição:', futureError);
          if (!finalError) finalError = futureError; // Captura o erro se não houver um erro principal
        }
      }
    } else {
      const newItems = [];
      const baseId = Date.now(); 

      // Verifica se deve gerar recorrência:
      // 1. Gasto Fixo com recorrência (mensal/parcelado)
      // 2. Gasto no Crédito com recorrência (mensal/parcelado)
      if ((transactionData.tipo === 'fixo' && recurrence.type !== 'unico') || 
          (transactionData.paymentMethod === 'credit' && recurrence.type !== 'unico')) {
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
        if (error) {
          console.error('Erro ao criar transações:', error);
          finalError = error;
        }
      }
    }
    await fetchData();
    return { error: finalError };
  };

  const payInvoice = async (cardId, cardName, valor, dataVencimento) => {
    const { error } = await supabase.from('transacoes').insert({
      user_id: user.id,
      descricao: `Fatura ${cardName}`,
      valor: valor,
      data: dataVencimento,
      tipo: 'fixo',
      pago: true,
      payment_method: 'debit',
      parcela_info: `invoice_payment:${cardId}` // Identificador para vincular à fatura
    });
    if (error) console.error('Erro ao pagar fatura:', error);
    fetchData();
  };

  const unpayInvoice = async (paymentId) => {
    const { error } = await supabase.from('transacoes').delete().eq('id', paymentId);
    if (error) console.error('Erro ao reabrir fatura:', error);
    fetchData();
  };

  const deleteTransaction = async (id) => {
    await supabase.from('transacoes').delete().eq('id', id);
    fetchData();
  };

  const togglePaid = async (id) => {
    const item = data.fixos.find((i) => i.id === id);
    if (item) {
      await supabase.from('transacoes').update({ pago: !item.pago }).eq('id', id);
      fetchData();
    }
  };

  const settleTransaction = async (groupId, dateLimit) => {
    try {
      if (!groupId) return;

      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('group_id', groupId)
        .gte('data', dateLimit);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Erro ao quitar transação:', error);
    }
  };

  return { 
    data, 
    loading, 
    refresh: fetchData, 
    saveTag, 
    deleteTag, 
    saveTransaction, 
    deleteTransaction, 
    payInvoice,
    unpayInvoice,
    togglePaid, 
    settleTransaction,
    saveCreditCard
  };
}