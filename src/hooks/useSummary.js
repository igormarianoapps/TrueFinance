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

    return {
      entradas: data.entradas.filter(filterFn),
      fixos: data.fixos.filter(filterFn).sort((a, b) => {
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