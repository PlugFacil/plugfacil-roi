'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, Zap, TrendingUp, DollarSign, Clock,
  BarChart3, Target, Percent, Printer,
  Info, ArrowUpRight, ArrowDownRight, Check, AlertTriangle,
  Battery, Plug, Eye
} from 'lucide-react';
import {
  getModelos, runSimulation, formatCurrency, formatPercent, formatNumber, getModelParams, getCenarioRecargas,
  type ModeloFranquia, type SimulationConfig, type SimulationResults, type YearlyResult
} from '@/lib/financial-engine';
import { getModelMetadata } from '@/lib/model-metadata';
import SimulationCharts from './simulation-charts';
import { CDIComparison } from '../../_components/cdi-comparison';

export default function SimulacaoClient() {
  const searchParams = useSearchParams();
  const modelos = getModelos();
  const printRef = useRef<HTMLDivElement>(null);

  const defaultModelo = searchParams?.get?.('modelo') ?? modelos?.[2]?.modelo ?? 'Padrao';

  const [config, setConfig] = useState<SimulationConfig>({
    modelo: defaultModelo,
    cenario: 'base',
    quantidadeEstacoes: 1,
  });

  const [results, setResults] = useState<SimulationResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showPremissas, setShowPremissas] = useState(true);

  useEffect(() => {
    try {
      const r = runSimulation(config);
      setResults(r);
      setShowResults(true);
    } catch (e: any) {
      console.error(e);
    }
  }, [config]);

  const selectedModelo = modelos?.find?.((m: ModeloFranquia) => m?.modelo === config?.modelo);
  const meta = getModelMetadata(config?.modelo ?? '');
  const params = getModelParams(config?.modelo ?? '');

  const handlePrint = () => { window?.print?.(); };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: SimulationConfig) => ({ ...(prev ?? {}), [key]: value } as SimulationConfig));
  };

  const cenarioLabel = (c: string) => c === 'pessimista' ? 'Conservador' : c === 'base' ? 'Base (Realista)' : 'Otimista';

  // Build premissas for the 3 scenarios
  const buildPremissas = () => {
    if (!params) return null;
    const cenarios = ['pessimista', 'base', 'otimista'] as const;
    return cenarios.map(c => {
      const recargas = getCenarioRecargas(c);
      const dcDia1 = recargas[0] * params.dcSlots;
      const acDia1 = recargas[0] * (params.acRatio / 100) * params.acChargers;
      const dcDia5 = recargas[4] * params.dcSlots;
      const acDia5 = recargas[4] * (params.acRatio / 100) * params.acChargers;
      const dcDia10 = recargas[9] * params.dcSlots;
      const acDia10 = recargas[9] * (params.acRatio / 100) * params.acChargers;
      // Run simulation for this cenário
      let payback = 0;
      let receitaMes = 0;
      try {
        const r = runSimulation({ modelo: config.modelo, cenario: c, quantidadeEstacoes: config.quantidadeEstacoes });
        payback = r.paybackMeses;
        receitaMes = r.receitaMensalAno1;
      } catch {}
      return {
        cenario: c,
        label: cenarioLabel(c),
        dcDia1, acDia1, dcDia5, acDia5, dcDia10, acDia10,
        recargaBase: recargas[0],
        payback, receitaMes,
      };
    });
  };

  const premissas = buildPremissas();

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-400" />
              Simulação Financeira
            </h1>
            <p className="text-gray-500 text-sm mt-1">Projeção financeira completa baseada na planilha oficial PlugFácil.</p>
          </div>
          <div className="flex gap-2 no-print">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>
      </motion.div>

      {/* CDI Comparison */}
      <CDIComparison />

      {/* Configuration Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 no-print"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" /> Parâmetros da Simulação
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Modelo */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Modelo de Franquia</label>
            <select
              value={config?.modelo ?? ''}
              onChange={(e) => updateConfig('modelo', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer"
            >
              {(modelos ?? []).map((m: ModeloFranquia) => {
                const mt = getModelMetadata(m?.modelo ?? '');
                return (
                  <option key={m?.modelo} value={m?.modelo ?? ''} className="bg-gray-900">
                    {mt.emoji} {mt.displayName} - {formatCurrency(m?.investimento ?? 0)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Cenário */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Cenário de Utilização</label>
            <select
              value={config?.cenario ?? 'base'}
              onChange={(e) => updateConfig('cenario', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer"
            >
              <option value="pessimista" className="bg-gray-900">Conservador</option>
              <option value="base" className="bg-gray-900">Base (Realista)</option>
              <option value="otimista" className="bg-gray-900">Otimista</option>
            </select>
          </div>

          {/* Qtd Estações */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Quantidade de Estações</label>
            <input
              type="number"
              min={1}
              max={10}
              value={config?.quantidadeEstacoes ?? 1}
              onChange={(e) => updateConfig('quantidadeEstacoes', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Model info card */}
        {meta && params && (
          <div className={`mt-4 p-4 rounded-xl border ${meta.colorBorder} bg-white/5`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{meta.emoji}</span>
              <span className={`font-bold text-lg ${meta.colorText}`}>{meta.displayName}</span>
              <span className="text-gray-500 text-sm ml-2">{meta.carregadores}</span>
              {params.mercadoLivre && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">Mercado Livre</span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-3">{meta.insight}</p>

            {/* Technical parameters grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
              {params.dcSlots > 0 && (
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <Zap className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Slots DC</p>
                  <p className="text-white font-bold text-sm">{params.dcSlots}</p>
                </div>
              )}
              {params.acChargers > 0 && (
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <Plug className="w-3.5 h-3.5 text-green-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Carregadores AC</p>
                  <p className="text-white font-bold text-sm">{params.acChargers}</p>
                </div>
              )}
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <Battery className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Recarga média</p>
                <p className="text-white font-bold text-sm">
                  {params.dcSlots > 0 ? `DC ${params.recargaMediaDC}` : ''}
                  {params.dcSlots > 0 && params.acChargers > 0 ? ' / ' : ''}
                  {params.acChargers > 0 ? `AC ${params.recargaMediaAC}` : ''} kWh
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Custo energia</p>
                <p className="text-white font-bold text-sm">R$ {params.custoKwh.toFixed(2)}/kWh</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <DollarSign className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Preço cobrado</p>
                <p className="text-white font-bold text-sm">
                  {params.precoDC > 0 ? `DC R$${params.precoDC.toFixed(2)}` : ''}
                  {params.precoDC > 0 && params.precoAC > 0 ? ' / ' : ''}
                  {params.precoAC > 0 ? `AC R$${params.precoAC.toFixed(2)}` : ''}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Ativação</p>
                <p className="text-white font-bold text-sm">R$ {params.taxaAtivacao.toFixed(2)}/recarga</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {meta.atende.map((a: string, i: number) => (
                <span key={i} className="flex items-center gap-1 text-xs text-emerald-400">
                  <Check className="w-3 h-3" /> {a}
                </span>
              ))}
              {meta.naoAtende.map((a: string, i: number) => (
                <span key={i} className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" /> {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedModelo && (
          <div className="mt-6 text-sm text-gray-400 flex items-center gap-1">
            <Info className="w-4 h-4" />
            Investimento: <span className="text-emerald-400 font-semibold">{formatCurrency((selectedModelo?.investimento ?? 0) * (config?.quantidadeEstacoes ?? 1))}</span>
          </div>
        )}
      </motion.div>

      {/* Premissas dos Cenários */}
      {premissas && params && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" /> Premissas por Cenário
            </h3>
            <button
              onClick={() => setShowPremissas(!showPremissas)}
              className="text-xs text-gray-500 hover:text-white transition"
            >
              {showPremissas ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {showPremissas && (
            <div className="space-y-4">
              {/* Fixed parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Recarga média DC</p>
                  <p className="text-white font-bold">{params.recargaMediaDC} kWh/sessão</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Recarga média AC</p>
                  <p className="text-white font-bold">{params.recargaMediaAC} kWh/sessão</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Preço eletricidade paga</p>
                  <p className="text-white font-bold">R$ {params.custoKwh.toFixed(2)}/kWh</p>
                  <p className="text-xs text-gray-600">{params.mercadoLivre ? 'Mercado Livre' : 'Mercado Cativo'}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Preço cobrado DC</p>
                  <p className="text-white font-bold">R$ {params.precoDC > 0 ? params.precoDC.toFixed(2) : '-'}/kWh</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Preço cobrado AC</p>
                  <p className="text-white font-bold">R$ {params.precoAC > 0 ? params.precoAC.toFixed(2) : '-'}/kWh</p>
                </div>
              </div>

              {/* Scenario comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/10">
                      <th className="text-left py-2 px-2">Premissa</th>
                      {premissas.map(p => (
                        <th key={p.cenario} className={`text-center py-2 px-2 ${config.cenario === p.cenario ? 'text-emerald-400 font-bold' : ''}`}>
                          {p.label}
                          {config.cenario === p.cenario && <span className="ml-1 text-xs">●</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-2 text-gray-400">Recargas DC/dia (Ano 1)</td>
                      {premissas.map(p => (
                        <td key={p.cenario} className={`text-center py-2 px-2 font-medium ${config.cenario === p.cenario ? 'text-white' : 'text-gray-400'}`}>
                          {p.dcDia1 > 0 ? p.dcDia1.toFixed(0) : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-2 text-gray-400">Recargas AC/dia (Ano 1)</td>
                      {premissas.map(p => (
                        <td key={p.cenario} className={`text-center py-2 px-2 font-medium ${config.cenario === p.cenario ? 'text-white' : 'text-gray-400'}`}>
                          {p.acDia1 > 0 ? p.acDia1.toFixed(1) : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-2 text-gray-400">Recargas DC/dia (Ano 5)</td>
                      {premissas.map(p => (
                        <td key={p.cenario} className={`text-center py-2 px-2 font-medium ${config.cenario === p.cenario ? 'text-white' : 'text-gray-400'}`}>
                          {p.dcDia5 > 0 ? p.dcDia5.toFixed(0) : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-2 text-gray-400">Recargas AC/dia (Ano 5)</td>
                      {premissas.map(p => (
                        <td key={p.cenario} className={`text-center py-2 px-2 font-medium ${config.cenario === p.cenario ? 'text-white' : 'text-gray-400'}`}>
                          {p.acDia5 > 0 ? p.acDia5.toFixed(1) : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-2 text-gray-400">Recargas DC/dia (Ano 10)</td>
                      {premissas.map(p => (
                        <td key={p.cenario} className={`text-center py-2 px-2 font-medium ${config.cenario === p.cenario ? 'text-white' : 'text-gray-400'}`}>
                          {p.dcDia10 > 0 ? p.dcDia10.toFixed(0) : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/10 bg-white/5">
                      <td className="py-2 px-2 text-white font-semibold">Faturamento mensal (Ano 1)</td>
                      {premissas.map(p => (
                        <td key={p.cenario} className={`text-center py-2 px-2 font-bold ${config.cenario === p.cenario ? 'text-emerald-400' : 'text-gray-300'}`}>
                          {formatCurrency(p.receitaMes)}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-white/5">
                      <td className="py-2 px-2 text-white font-semibold">Payback</td>
                      {premissas.map(p => (
                        <td key={p.cenario} className={`text-center py-2 px-2 font-bold ${config.cenario === p.cenario ? 'text-amber-400' : 'text-gray-300'}`}>
                          {p.payback} meses
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cost structure summary */}
              <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-500 mb-2 font-medium">Estrutura de custos (igual para todos os cenários):</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
                  <span>Retenção plataforma: <span className="text-white">{params.retencaoPct}% + R${params.mensalidadeMensal}/mês</span></span>
                  <span>Royalties PlugFácil: <span className="text-white">{params.royaltiesPct}%</span></span>
                  <span>Impostos: <span className="text-white">{params.impostosPct}%</span></span>
                  <span>Provisionamento: <span className="text-white">{params.provisionamentoPct}%</span></span>
                  <span>Perdas energia: <span className="text-white">{params.perdasEnergia}%</span></span>
                  <span>Ativação: <span className="text-white">R${params.taxaAtivacao}/recarga</span></span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && showResults && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Frase de venda */}
            <div className="text-center py-2">
              <p className="text-emerald-400 text-sm font-medium italic">&ldquo;{meta?.fraseVenda}&rdquo;</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: DollarSign, label: 'Investimento', value: formatCurrency(results?.investimentoTotal ?? 0), color: 'text-white', bg: 'bg-white/5' },
                { icon: Clock, label: 'Payback', value: `${results?.paybackMeses ?? 0} meses`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { icon: TrendingUp, label: 'ROI 10 anos', value: formatPercent(results?.roiPercent ?? 0), color: (results?.roiPercent ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-emerald-500/10' },
                { icon: BarChart3, label: 'VPL', value: formatCurrency(results?.vpl ?? 0), color: (results?.vpl ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-blue-500/10' },
                { icon: Percent, label: 'TIR', value: formatPercent(results?.tir ?? 0), color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: Target, label: 'Margem Líquida', value: formatPercent(results?.margemMedia ?? 0), color: 'text-purple-400', bg: 'bg-purple-500/10' },
              ].map((kpi: any, i: number) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`${kpi.bg} rounded-xl p-4 border border-white/5`}
                  >
                    <Icon className={`w-4 h-4 ${kpi.color} mb-2`} />
                    <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Monthly Averages Year 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="glass rounded-xl p-4 border border-emerald-500/20">
                <p className="text-xs text-gray-500 mb-1">Faturamento médio mensal (Ano 1)</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(results?.receitaMensalAno1 ?? 0)}</p>
              </div>
              <div className="glass rounded-xl p-4 border border-emerald-500/20">
                <p className="text-xs text-gray-500 mb-1">Lucro líquido mensal (Ano 1)</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(results?.lucroMensalAno1 ?? 0)}</p>
              </div>
            </div>

            {/* Charts */}
            <SimulationCharts results={results} />

            {/* Yearly Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6 overflow-x-auto"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> Projeção Anual Detalhada
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-white/5">
                    <th className="text-left py-3 px-2">Ano</th>
                    <th className="text-right py-3 px-2">Recargas/dia</th>
                    <th className="text-right py-3 px-2">Receita</th>
                    <th className="text-right py-3 px-2">Custos</th>
                    <th className="text-right py-3 px-2">Lucro Líq.</th>
                    <th className="text-right py-3 px-2">FCL Acum.</th>
                  </tr>
                </thead>
                <tbody>
                  {(results?.yearly ?? []).map((y: YearlyResult, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 px-2 text-white font-medium">Ano {y?.ano ?? i + 1}</td>
                      <td className="py-3 px-2 text-right text-gray-400">
                        {(y?.recargasDCDia ?? 0) > 0 ? `${(y.recargasDCDia).toFixed(0)} DC` : ''}
                        {(y?.recargasDCDia ?? 0) > 0 && (y?.recargasACDia ?? 0) > 0 ? ' + ' : ''}
                        {(y?.recargasACDia ?? 0) > 0 ? `${(y.recargasACDia).toFixed(1)} AC` : ''}
                      </td>
                      <td className="py-3 px-2 text-right text-emerald-400">{formatCurrency(y?.receitaTotal ?? 0)}</td>
                      <td className="py-3 px-2 text-right text-red-400">{formatCurrency(y?.custoTotal ?? 0)}</td>
                      <td className="py-3 px-2 text-right text-white">{formatCurrency(y?.lucroLiquido ?? 0)}</td>
                      <td className={`py-3 px-2 text-right font-semibold ${(y?.fluxoCaixaAcumulado ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span className="inline-flex items-center gap-1">
                          {(y?.fluxoCaixaAcumulado ?? 0) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {formatCurrency(y?.fluxoCaixaAcumulado ?? 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            {/* Cost Breakdown Table - Year 1 */}
            {results?.yearly?.[0] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" /> Detalhamento de Custos (Ano 1)
                </h3>
                {(() => {
                  const y = results.yearly[0];
                  const items = [
                    { label: 'Receita Total', value: y.receitaTotal, color: 'text-emerald-400', bold: true },
                    { label: `(-) Retenção Plataforma (${params?.retencaoPct}% + R$${params?.mensalidadeMensal}/mês)`, value: -y.retencaoPlataforma, color: 'text-red-400' },
                    { label: `(-) Custo de Energia (c/ ${params?.perdasEnergia}% perdas)`, value: -y.custoEnergia, color: 'text-red-400' },
                    { label: `(-) Royalties PlugFácil (${params?.royaltiesPct}%)`, value: -y.royalties, color: 'text-red-400' },
                    { label: '= Resultado Operacional', value: y.resultadoOperacional, color: 'text-blue-400', bold: true },
                    { label: `(-) Impostos (${params?.impostosPct}%)`, value: -y.impostos, color: 'text-red-400' },
                    { label: `(-) Provisionamento (${params?.provisionamentoPct}%)`, value: -y.provisionamento, color: 'text-red-400' },
                    { label: '= Lucro Líquido', value: y.lucroLiquido, color: 'text-emerald-400', bold: true },
                  ];
                  return (
                    <div className="space-y-2">
                      {items.map((item, i) => (
                        <div key={i} className={`flex justify-between items-center py-1.5 ${item.bold ? 'border-t border-white/10 pt-2' : ''}`}>
                          <span className={`text-sm ${item.bold ? 'text-white font-semibold' : 'text-gray-400'}`}>{item.label}</span>
                          <span className={`text-sm font-medium ${item.color}`}>{formatCurrency(Math.abs(item.value))}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
