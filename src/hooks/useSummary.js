import { useMemo } from 'react';

export function useFinancialSummary(data, currentDate) {
  const isCredit = (item) => item.paymentMethod === 'credit' || (item.creditCardId !== null && item.creditCardId !== undefined);

  const previousMonthSaldo = useMemo(() => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(1);
    prevDate.setMonth(prevDate.getMonth() - 1);

    const month = prevDate.getMonth();
    const year = prevDate.getFullYear();

    const filterFn = (item) => {
      if (!item.data) return false;
      const [itemYear, itemMonth] = item.data.split('-').map(Number);
      return (itemMonth - 1) === month && itemYear === year;
    };

    const invoices = (data.creditCards || []).map(card => {
      const closingDay = parseInt(card.closing_date);
      const dueDay = parseInt(card.due_date);

      const getClampedDate = (y, m, d) => {
        const lastDay = new Date(y, m + 1, 0).getDate();
        return new Date(y, m, Math.min(d, lastDay));
      };

      let closingDateThisMonth, closingDateLastMonth;

      if (closingDay <= dueDay) {
        closingDateThisMonth = getClampedDate(year, month, closingDay);
        closingDateLastMonth = getClampedDate(year, month - 1, closingDay);
      } else {
        closingDateThisMonth = getClampedDate(year, month - 1, closingDay);
        closingDateLastMonth = getClampedDate(year, month - 2, closingDay);
      }

      const cardTransactions = data.variaveis.filter(t => {
        if (t.creditCardId !== card.id) return false;
        const tDate = new Date(t.data + 'T00:00:00');
        return tDate > closingDateLastMonth && tDate <= closingDateThisMonth;
      });

      const totalInvoice = cardTransactions.reduce((acc, t) => acc + t.valor, 0);
      return { valor: totalInvoice };
    });

    const prevMonthEntradas = data.entradas.filter(filterFn);
    const prevMonthFixos = [...(data.fixos || []).filter(filterFn).filter(t => !t.parcelaInfo?.startsWith('invoice_payment:')), ...invoices];
    const prevMonthVariaveis = data.variaveis.filter(filterFn);
    const prevMonthProvisoes = (data.provisoes || []).filter(filterFn);
    const prevMonthPoupanca = (data.poupanca || []).filter(filterFn);
    
    const entradasCalc = prevMonthEntradas.reduce((acc, item) => acc + item.valor, 0);
    const totalFixosMensal = prevMonthFixos.reduce((acc, item) => acc + item.valor, 0);
    const totalEnvelopes = prevMonthProvisoes.reduce((acc, item) => acc + item.valor, 0);
    const totalPoupancaEntradas = prevMonthPoupanca.filter(p => p.tipoPoupanca === 'entrada').reduce((acc, item) => acc + item.valor, 0);
    const totalComprometido = totalFixosMensal + totalEnvelopes + totalPoupancaEntradas;
    const provisionedTagIds = prevMonthProvisoes.map(p => p.tagId).filter(Boolean);
    const gastosNaoProvisionados = prevMonthVariaveis.filter(g => !provisionedTagIds.includes(g.tagId) && !isCredit(g));
    const totalGastosNaoProvisionados = gastosNaoProvisionados.reduce((acc, g) => acc + g.valor, 0);
    const saldoCalc = entradasCalc - totalComprometido - totalGastosNaoProvisionados;
    return saldoCalc > 0 ? saldoCalc : 0;
  }, [data, currentDate]);

  const filteredData = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const filterFn = (item) => {
      if (!item.data) return false;
      const [itemYear, itemMonth] = item.data.split('-').map(Number);
      return (itemMonth - 1) === month && itemYear === year;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Lógica de Faturas de Cartão
    const invoices = (data.creditCards || []).map(card => {
      // Determina o intervalo de datas para a fatura do mês atual
      // Se a data de fechamento é ANTES do vencimento (comum), a fatura vence no mês M
      // e pega compras do mês M-1 (após fechamento) até mês M (fechamento).
      
      // Exemplo simples: Vence dia 10, Fecha dia 03.
      // Fatura de Março (Vence 10/03): Pega compras de 04/02 a 03/03.
      
      const dueDate = new Date(year, month, card.due_date);
      
      const closingDay = parseInt(card.closing_date);
      const dueDay = parseInt(card.due_date);

      // Helper para evitar overflow de datas (ex: 30 de Fev virar 02 de Março)
      const getClampedDate = (y, m, d) => {
        const lastDay = new Date(y, m + 1, 0).getDate();
        return new Date(y, m, Math.min(d, lastDay));
      };

      let closingDateThisMonth, closingDateLastMonth;

      if (closingDay <= dueDay) {
        // Fechamento e Vencimento no mesmo mês (ex: Fecha 03, Vence 10)
        closingDateThisMonth = getClampedDate(year, month, closingDay);
        closingDateLastMonth = getClampedDate(year, month - 1, closingDay);
      } else {
        // Fechamento no mês anterior ao vencimento (ex: Fecha 25, Vence 05)
        closingDateThisMonth = getClampedDate(year, month - 1, closingDay);
        closingDateLastMonth = getClampedDate(year, month - 2, closingDay);
      }

      // Filtra transações que pertencem a esta fatura
      const cardTransactions = data.variaveis.filter(t => {
        // Confia no creditCardId como fonte da verdade. Se tem ID de cartão, pertence ao cartão.
        if (t.creditCardId !== card.id) return false;
        const tDate = new Date(t.data + 'T00:00:00');
        return tDate > closingDateLastMonth && tDate <= closingDateThisMonth;
      });

      const totalInvoice = cardTransactions.reduce((acc, t) => acc + t.valor, 0);

      if (totalInvoice === 0) return null;

      // Verifica se existe uma transação de pagamento para esta fatura neste mês
      const paymentTransaction = data.fixos.find(t => 
        t.parcelaInfo === `invoice_payment:${card.id}` &&
        // Verifica se a data da transação pertence ao mês/ano da fatura atual
        t.data.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
      );

      return {
        id: `invoice-${card.id}-${month}-${year}`,
        descricao: `Fatura ${card.name}`,
        valor: totalInvoice,
        data: dueDate.toISOString().split('T')[0],
        pago: !!paymentTransaction,
        paymentId: paymentTransaction?.id, // ID da transação real para poder desfazer o pagamento
        isInvoice: true,
        cardId: card.id,
        transactions: cardTransactions // Adiciona as transações à fatura para visualização
      };
    }).filter(Boolean);

    const currentMonthEntradas = data.entradas.filter(filterFn);

    if (previousMonthSaldo > 0) {
      const leftoverEntry = {
        id: 'leftover-previous-month',
        descricao: 'Sobra do mês anterior',
        valor: previousMonthSaldo,
        data: new Date(year, month, 1).toISOString().split('T')[0],
        isLeftover: true,
      };
      currentMonthEntradas.unshift(leftoverEntry);
    }

    return {
      entradas: currentMonthEntradas,
      fixos: [...(data.fixos || []).filter(filterFn)
        .filter(t => !t.parcelaInfo?.startsWith('invoice_payment:')), // Oculta as transações de pagamento para não duplicar com a fatura
        ...invoices
      ].map(item => {
        let isDueSoon = false;
        // Verifica apenas se não estiver pago
        if (!item.pago) {
          const dueDate = new Date(item.data + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
          const timeDiff = dueDate.getTime() - today.getTime();
          const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          // Alerta se estiver vencendo em 3 dias ou menos (incluindo hoje), mas não se já estiver vencido.
          if (dayDiff >= 0 && dayDiff <= 3) {
            isDueSoon = true;
          }
        }
        return { ...item, isDueSoon };
      }).sort((a, b) => {
        const dateDiff = new Date(a.data) - new Date(b.data);
        if (dateDiff !== 0) return dateDiff;
        return a.id > b.id ? 1 : -1;
      }),
      variaveis: data.variaveis.filter(filterFn).sort((a, b) => b.id - a.id),
      provisoes: (data.provisoes || []).filter(filterFn),
      poupanca: (data.poupanca || []).filter(filterFn),
      tags: data.tags,
      creditCards: data.creditCards || [],
      invoices: invoices,
    };
  }, [data, currentDate, previousMonthSaldo]);

  const summary = useMemo(() => {
    const entradasCalc = filteredData.entradas.reduce((acc, item) => acc + item.valor, 0);

    // --- NOVOS CÁLCULOS CONFORME SOLICITADO ---

    // 1. Total de pagamentos fixos (inclui faturas de cartão, pagas ou não)
    const totalFixosMensal = filteredData.fixos.reduce((acc, item) => acc + item.valor, 0);

    // Total de envelopes (provisões) para o mês
    const totalEnvelopes = (filteredData.provisoes || []).reduce((acc, item) => acc + item.valor, 0);

    // Total de aportes na poupança no mês
    const totalPoupancaEntradas = (filteredData.poupanca || [])
      .filter(p => p.tipoPoupanca === 'entrada')
      .reduce((acc, item) => acc + item.valor, 0);

    // 2. Valor "Comprometido"
    const totalComprometido = totalFixosMensal + totalEnvelopes + totalPoupancaEntradas;

    // Calcula gastos não provisionados (Débito) para deduzir da sobra
    const provisionedTagIds = (filteredData.provisoes || []).map(p => p.tagId).filter(Boolean);
    const gastosNaoProvisionados = filteredData.variaveis.filter(g => !provisionedTagIds.includes(g.tagId) && !isCredit(g));
    const totalGastosNaoProvisionados = gastosNaoProvisionados.reduce((acc, g) => acc + g.valor, 0);

    // 3. "Sobra Projetada"
    // Deduz o comprometido E os gastos variáveis que não estavam previstos nos envelopes
    const saldoCalc = entradasCalc - totalComprometido - totalGastosNaoProvisionados;

    // --- CÁLCULOS MANTIDOS PARA OUTRAS PARTES DO APP (GRÁFICOS, ETC) ---

    // Saídas em DÉBITO. Crédito entra via pagamento de fatura.
    const variaveisCalc = filteredData.variaveis
      .filter(item => !isCredit(item))
      .reduce((acc, item) => acc + item.valor, 0);

    let totalGastoProvisionadoEfetivo = 0;

    // Calcula quanto de cada tag está comprometido nas faturas PAGAS DESTE mês
    const creditUsageInPaidInvoices = {};
    (filteredData.invoices || []).forEach(inv => {
      if (inv.pago) {
        (inv.transactions || []).forEach(t => {
          if (t.tagId) {
            creditUsageInPaidInvoices[t.tagId] = (creditUsageInPaidInvoices[t.tagId] || 0) + t.valor;
          }
        });
      }
    });

    (filteredData.provisoes || []).forEach(provisao => {
      if (provisao.tagId) {
        const gastosNoEnvelopeDebit = filteredData.variaveis
          .filter(g => g.tagId === provisao.tagId && !isCredit(g))
          .reduce((acc, g) => acc + g.valor, 0);

        const creditPaid = creditUsageInPaidInvoices[provisao.tagId] || 0;

        // Subtrai apenas o crédito de faturas PAGAS
        totalGastoProvisionadoEfetivo += Math.max(gastosNoEnvelopeDebit, (provisao.valor || 0) - creditPaid);
      } else {
        totalGastoProvisionadoEfetivo += provisao.valor || 0;
      }
    });

    return { 
      saldoFinal: saldoCalc,                 // Usa o novo cálculo de "Sobra Projetada"
      totalEntradas: entradasCalc, 
      totalFixos: totalFixosMensal,          // Usa o novo cálculo de "Total de Fixos"
      totalVariaveis: variaveisCalc, 
      totalGastosNaoProvisionados,
      totalGastoProvisionadoEfetivo,
      totalComprometido: totalComprometido   // Exporta o novo valor "Comprometido"
    };
  }, [filteredData, isCredit]);

  const chartData = useMemo(() => {
    const grouped = {};
    filteredData.variaveis.forEach(item => {
      // Filtra crédito do gráfico também para manter consistência com o total de "Saídas" (Fluxo de Caixa)
      if (isCredit(item)) return;

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
  }, [filteredData.variaveis, filteredData.tags, isCredit]);

  return { ...summary, filteredData, chartData };
}