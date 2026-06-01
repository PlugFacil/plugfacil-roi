'use client';
import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  CreditCard, DollarSign, Clock, TrendingUp, ArrowUpRight, ArrowDownRight,
  Calculator, Info, RefreshCw, BarChart3
} from 'lucide-react';
import {
  getModelos, runSimulation, formatCurrency, formatPercent, getModelParams,
  type ModeloFranquia, type SimulationConfig
} from '@/lib/financial-engine';
import { getModelMetadata } from '@/lib/model-metadata';

const FinanciamentoCharts = dynamic(() => import('./financiamento-charts'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-gray-500">Carregando gráficos...</div>,
});

interface FinancingMonth {
  mes: number;
  parcelaCartao: number;
  totalParcelasPagas: number;
  lucroEstacao: number;
  lucroAcumuladoEstacao: number;
  fluxoLiquido: number; // lucro - parcela
  fluxoAcumulado: number; // running total
  saldoDevedor: number;
}

export default function FinanciamentoClient() {
  const modelos = getModelos();
  const [modelo, setModelo] = useState('Padrao');
  const [cenario, setCenario] = useState<'pessimista' | 'base' | 'otimista'>('base');
  const [parcelas, setParcelas] = useState(18);
  const [taxaCartao, setTaxaCartao] = useState(0); // % total spread over installments
  const [entrada, setEntrada] = useState(0); // % down payment

  const selectedModelo = modelos?.find?.((m: ModeloFranquia) => m?.modelo === modelo);
  const meta = getModelMetadata(modelo);
  const params = getModelParams(modelo);

  const financing = useMemo(() => {
    if (!selectedModelo) return null;

    const investimento = selectedModelo.investimento;
    const valorEntrada = investimento * (entrada / 100);
    const valorFinanciado = investimento - valorEntrada;
    const jurosTotais = valorFinanciado * (taxaCartao / 100);
    const totalComJuros = valorFinanciado + jurosTotais;
    const parcelaMensal = parcelas > 0 ? totalComJuros / parcelas : 0;

    // Run simulation
    let sim;
    try {
      sim = runSimulation({ modelo, cenario, quantidadeEstacoes: 1 });
    } catch { return null; }

    const lucroMensal = sim.lucroMensalAno1;
    const horizonte = Math.max(parcelas + 12, 60); // show at least 12 months beyond last installment

    const months: FinancingMonth[] = [];
    let fluxoAcum = -valorEntrada; // initial down payment
    let lucroAcum = 0;
    let totalParcelas = valorEntrada;

    for (let m = 1; m <= horizonte; m++) {
      // Which year's profit to use (profit grows over years)
      const anoIdx = Math.min(Math.floor((m - 1) / 12), sim.yearly.length - 1);
      const lucroMes = sim.yearly[anoIdx].lucroLiquido / 12;

      const parcela = m <= parcelas ? parcelaMensal : 0;
      totalParcelas += parcela;
      lucroAcum += lucroMes;

      const fluxoLiquido = lucroMes - parcela;
      fluxoAcum += fluxoLiquido;

      const saldoDevedor = Math.max(0, totalComJuros - (m <= parcelas ? parcelaMensal * m : totalComJuros));

      months.push({
        mes: m,
        parcelaCartao: parcela,
        totalParcelasPagas: totalParcelas,
        lucroEstacao: lucroMes,
        lucroAcumuladoEstacao: lucroAcum,
        fluxoLiquido,
        fluxoAcumulado: fluxoAcum,
        saldoDevedor,
      });
    }

    // When does accumulated flow turn positive?
    const breakEvenMonth = months.findIndex(m => m.fluxoAcumulado >= 0) + 1;

    // Monthly cash flow positive from month 1?
    const cashFlowPositiveMonth1 = months[0]?.fluxoLiquido > 0;

    return {
      investimento,
      valorEntrada,
      valorFinanciado,
      jurosTotais,
      totalComJuros,
      parcelaMensal,
      lucroMensal,
      months,
      breakEvenMonth: breakEvenMonth > 0 ? breakEvenMonth : horizonte,
      cashFlowPositiveMonth1,
      sim,
    };
  }, [modelo, cenario, parcelas, taxaCartao, entrada, selectedModelo]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-400" />
          Simulação de Financiamento
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Simule o parcelamento no cartão de crédito e veja como o prospect começa a ganhar desde o mês 1.
        </p>
      </motion.div>

      {/* Config */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" /> Parâmetros
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Modelo</label>
            <select value={modelo} onChange={(e) => setModelo(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer">
              {modelos.map((m: ModeloFranquia) => {
                const mt = getModelMetadata(m.modelo);
                return <option key={m.modelo} value={m.modelo} className="bg-gray-900">{mt.emoji} {mt.displayName} - {formatCurrency(m.investimento)}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Cenário</label>
            <select value={cenario} onChange={(e) => setCenario(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer">
              <option value="pessimista" className="bg-gray-900">Conservador</option>
              <option value="base" className="bg-gray-900">Base (Realista)</option>
              <option value="otimista" className="bg-gray-900">Otimista</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Número de parcelas</label>
            <input type="number" min={1} max={48} value={parcelas}
              onChange={(e) => setParcelas(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Juros total do cartão (%)</label>
            <input type="number" min={0} max={100} step={0.5} value={taxaCartao}
              onChange={(e) => setTaxaCartao(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition" />
            <p className="text-xs text-gray-600 mt-1">0% = sem juros (cartão lojista/parceria)</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Entrada (%)</label>
            <input type="number" min={0} max={100} step={5} value={entrada}
              onChange={(e) => setEntrada(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition" />
          </div>
        </div>
      </motion.div>

      {/* Results */}
      {financing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Key insight */}
          <div className={`glass rounded-2xl p-6 border ${financing.cashFlowPositiveMonth1 ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${financing.cashFlowPositiveMonth1 ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                {financing.cashFlowPositiveMonth1
                  ? <TrendingUp className="w-6 h-6 text-emerald-400" />
                  : <Clock className="w-6 h-6 text-amber-400" />
                }
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">
                  {financing.cashFlowPositiveMonth1
                    ? 'Fluxo de caixa positivo desde o mês 1!'
                    : `Fluxo de caixa positivo a partir do mês ${financing.months.findIndex(m => m.fluxoLiquido > 0) + 1}`
                  }
                </h3>
                <p className="text-gray-400 text-sm">
                  Com o parcelamento em {parcelas}x, a parcela mensal é de <span className="text-white font-semibold">{formatCurrency(financing.parcelaMensal)}</span>{' '}
                  e o lucro mensal da estação é de <span className="text-emerald-400 font-semibold">{formatCurrency(financing.lucroMensal)}</span>.
                  {financing.cashFlowPositiveMonth1
                    ? ` O prospect ganha ${formatCurrency(financing.lucroMensal - financing.parcelaMensal)} líquido por mês desde o início!`
                    : ` O investimento se paga completamente no mês ${financing.breakEvenMonth}.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <DollarSign className="w-4 h-4 text-white mb-2" />
              <p className="text-lg font-bold text-white">{formatCurrency(financing.investimento)}</p>
              <p className="text-xs text-gray-500">Investimento total</p>
            </div>
            {financing.valorEntrada > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <DollarSign className="w-4 h-4 text-amber-400 mb-2" />
                <p className="text-lg font-bold text-amber-400">{formatCurrency(financing.valorEntrada)}</p>
                <p className="text-xs text-gray-500">Entrada</p>
              </div>
            )}
            <div className="bg-amber-500/10 rounded-xl p-4 border border-white/5">
              <CreditCard className="w-4 h-4 text-amber-400 mb-2" />
              <p className="text-lg font-bold text-amber-400">{parcelas}x {formatCurrency(financing.parcelaMensal)}</p>
              <p className="text-xs text-gray-500">Parcela mensal</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-white/5">
              <TrendingUp className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(financing.lucroMensal)}</p>
              <p className="text-xs text-gray-500">Lucro mensal</p>
            </div>
            <div className={`rounded-xl p-4 border border-white/5 ${financing.cashFlowPositiveMonth1 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <DollarSign className="w-4 h-4 text-emerald-400 mb-2" />
              <p className={`text-lg font-bold ${financing.lucroMensal - financing.parcelaMensal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(financing.lucroMensal - financing.parcelaMensal)}
              </p>
              <p className="text-xs text-gray-500">Fluxo líquido/mês</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-4 border border-white/5">
              <Clock className="w-4 h-4 text-blue-400 mb-2" />
              <p className="text-lg font-bold text-blue-400">{financing.breakEvenMonth} meses</p>
              <p className="text-xs text-gray-500">Break-even</p>
            </div>
          </div>

          {/* Charts */}
          <FinanciamentoCharts months={financing.months} parcelas={parcelas} />

          {/* Monthly Table */}
          <div className="glass rounded-2xl p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" /> Fluxo Mensal Detalhado
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="text-left py-2 px-2">Mês</th>
                  <th className="text-right py-2 px-2">Parcela</th>
                  <th className="text-right py-2 px-2">Lucro Estação</th>
                  <th className="text-right py-2 px-2">Fluxo Líquido</th>
                  <th className="text-right py-2 px-2">Acumulado</th>
                  <th className="text-right py-2 px-2">Saldo Devedor</th>
                </tr>
              </thead>
              <tbody>
                {financing.months.filter((_, i) => i < 36 || i % 6 === 0).map((m) => (
                  <tr key={m.mes} className={`border-b border-white/5 hover:bg-white/5 transition ${m.mes === parcelas ? 'bg-emerald-500/5' : ''}`}>
                    <td className="py-2 px-2 text-white font-medium">
                      {m.mes}
                      {m.mes === parcelas && <span className="ml-1 text-xs text-emerald-400">← última parcela</span>}
                    </td>
                    <td className="py-2 px-2 text-right text-red-400">{m.parcelaCartao > 0 ? formatCurrency(m.parcelaCartao) : '-'}</td>
                    <td className="py-2 px-2 text-right text-emerald-400">{formatCurrency(m.lucroEstacao)}</td>
                    <td className={`py-2 px-2 text-right font-medium ${m.fluxoLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(m.fluxoLiquido)}
                    </td>
                    <td className={`py-2 px-2 text-right font-semibold ${m.fluxoAcumulado >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      <span className="inline-flex items-center gap-1">
                        {m.fluxoAcumulado >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {formatCurrency(m.fluxoAcumulado)}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-gray-400">{m.saldoDevedor > 0 ? formatCurrency(m.saldoDevedor) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sales tip */}
          <div className="glass rounded-2xl p-6 border border-emerald-500/20">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-400" /> Argumento de Venda
            </h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>
                <span className="text-white font-semibold">"Você não precisa descapitalizar."</span> Com o parcelamento em {parcelas}x,
                você paga apenas {formatCurrency(financing.parcelaMensal)}/mês no cartão.
              </p>
              <p>
                A estação gera {formatCurrency(financing.lucroMensal)}/mês de lucro líquido.
                {financing.cashFlowPositiveMonth1
                  ? ` Isso significa que desde o primeiro mês você já tem ${formatCurrency(financing.lucroMensal - financing.parcelaMensal)} de lucro real no bolso, mesmo pagando a parcela.`
                  : ` O investimento se paga em ${financing.breakEvenMonth} meses, e depois disso é lucro puro.`
                }
              </p>
              <p className="text-emerald-400 font-medium">
                Após quitar as {parcelas} parcelas, o lucro inteiro de {formatCurrency(financing.lucroMensal)}/mês vai direto pro seu bolso.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
