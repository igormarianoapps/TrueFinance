import { useMemo } from 'react';

export function useFinancialSummary(data, currentDate) {
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
      
      // Data de fechamento deste mês
      const closingDateThisMonth = new Date(year, month, card.closing_date);
      // Data de fechamento do mês anterior
      const closingDateLastMonth = new Date(year, month - 1, card.closing_date);

      // Filtra transações que pertencem a esta fatura
      const cardTransactions = data.variaveis.filter(t => {
        if (t.paymentMethod !== 'credit' || t.creditCardId !== card.id) return false;
        const tDate = new Date(t.data + 'T00:00:00');
        return tDate > closingDateLastMonth && tDate <= closingDateThisMonth;
      });

      const totalInvoice = cardTransactions.reduce((acc, t) => acc + t.valor, 0);

      if (totalInvoice === 0) return null;

      return {
        id: `invoice-${card.id}-${month}-${year}`,
        descricao: `Fatura ${card.name}`,
        valor: totalInvoice,
        data: dueDate.toISOString().split('T')[0],
        pago: false, // Por enquanto, manual. Futuramente pode persistir status da fatura.
        isInvoice: true,
        cardId: card.id
      };
    }).filter(Boolean);

    return {
      entradas: data.entradas.filter(filterFn),
      fixos: [...(data.fixos || []).filter(filterFn), ...invoices].map(item => {
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
      tags: data.tags 
    };
  }, [data, currentDate]);

  const summary = useMemo(() => {
    const entradasCalc = filteredData.entradas.reduce((acc, item) => acc + item.valor, 0);
    const fixosCalc = filteredData.fixos.reduce((acc, item) => acc + item.valor, 0);
    const variaveisCalc = filteredData.variaveis.reduce((acc, item) => acc + item.valor, 0);

    const provisionedTagIds = (filteredData.provisoes || []).map(p => p.tagId).filter(Boolean);
    const gastosNaoProvisionados = filteredData.variaveis.filter(g => !provisionedTagIds.includes(g.tagId));
    const totalGastosNaoProvisionados = gastosNaoProvisionados.reduce((acc, g) => acc + g.valor, 0);

    let totalGastoProvisionadoEfetivo = 0;
    (filteredData.provisoes || []).forEach(provisao => {
      if (provisao.tagId) {
        const gastosNoEnvelope = filteredData.variaveis
          .filter(g => g.tagId === provisao.tagId && g.paymentMethod !== 'credit') // Remove credit
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
      totalGastosNaoProvisionados,
      totalGastoProvisionadoEfetivo
    };
  }, [filteredData]);

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

  return { ...summary, filteredData, chartData };
}