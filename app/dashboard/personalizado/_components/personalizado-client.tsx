'use client';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  SlidersHorizontal, Zap, DollarSign, Battery, Clock,
  TrendingUp, Target, Percent, BarChart3, ArrowUpRight, ArrowDownRight,
  RefreshCw, Info, RotateCcw, FileDown
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/financial-engine';
import type { CustomConfig, CustomYearlyResult, CustomResults } from './personalizado-types';
import { exportPersonalizadoPDF } from './personalizado-pdf';

const PersonalizadoCharts = dynamic(() => import('./personalizado-charts'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-gray-500">Carregando gráficos...</div>,
});

// ═══════════════════════════════════════
// CUSTOM SIMULATION ENGINE (independent)
// ═══════════════════════════════════════

function calcIRR(flows: number[]): number {
  let low = -0.5, high = 5.0;
  for (let iter = 0; iter < 200; iter++) {
    const mid = (low + high) / 2;
    const npv = flows.reduce((s, cf, i) => s + cf / Math.pow(1 + mid, i + 1), 0);
    if (Math.abs(npv) < 0.01) { low = mid; high = mid; break; }
    if (npv > 0) low = mid; else high = mid;
  }
  return (low + high) / 2;
}

const OVERHEAD_H = 10 / 60; // 10-minute plug-in/payment overhead per session

function computePlatoDC(horasAbertura: number, recargaMediaDC: number, potenciaDC: number, dcChargers: number): number {
  return potenciaDC > 0 && dcChargers > 0
    ? Math.floor((horasAbertura / (recargaMediaDC / potenciaDC + OVERHEAD_H)) * dcChargers)
    : 0;
}

function computePlatoAC(horasAbertura: number, recargaMediaAC: number, potenciaAC: number, acChargers: number): number {
  return potenciaAC > 0 && acChargers > 0
    ? Math.floor((horasAbertura / (recargaMediaAC / potenciaAC + OVERHEAD_H)) * acChargers)
    : 0;
}

function runCustomSimulation(c: CustomConfig): CustomResults {
  const investimentoTotal = c.custoEquipamento + c.custoInstalacao;
  const yearly: CustomYearlyResult[] = [];

  let paybackMeses = -1;
  let paybackMesesEco = -1;
  let monthlyAccum = -investimentoTotal;
  let monthlyAccumEco = -investimentoTotal;
  const cdi = c.taxaCDI / 100;
  let cdiProfitAccum = 0; // CDI-compounded eletroposto profits (running sum)

  const depreciacaoEquipamentoAno = c.vidaUtilMeses > 0
    ? (c.custoEquipamento / c.vidaUtilMeses) * 12
    : 0;
  const amortizacaoInstalacaoAno = c.prazoContratoMeses > 0
    ? (c.custoInstalacao / c.prazoContratoMeses) * 12
    : 0;

  // Physical throughput ceiling from editable config (auto-computed or manually overridden)
  const maxDCDia = c.platoDCDia;
  const maxACDia = c.platoACDia;

  for (let ano = 1; ano <= c.horizonteAnos; ano++) {
    const growthFactor = Math.pow(1 + c.crescimentoAnual / 100, ano - 1);
    const dcDia = maxDCDia > 0
      ? Math.min(c.recargasDCDiaAno1 * growthFactor, maxDCDia)
      : c.recargasDCDiaAno1 * growthFactor;
    const acDia = maxACDia > 0
      ? Math.min(c.recargasACDiaAno1 * growthFactor, maxACDia)
      : c.recargasACDiaAno1 * growthFactor;
    const dcAno = dcDia * 365;
    const acAno = acDia * 365;
    const totalAno = dcAno + acAno;

    const kwhDC = dcAno * c.recargaMediaDC;
    const kwhAC = acAno * c.recargaMediaAC;
    const kwhTotal = kwhDC + kwhAC;

    const receitaDC = kwhDC * c.precoDC;
    const receitaAC = kwhAC * c.precoAC;
    const receitaAtivacao = totalAno * c.taxaAtivacao;
    const receitaTotal = receitaDC + receitaAC + receitaAtivacao;

    const retencaoPlataforma = receitaTotal * (c.retencaoPct / 100) + c.mensalidadeMensal * 12;
    const royalties = receitaTotal * (c.royaltiesPct / 100);
    const custoGestaoPlatforma = retencaoPlataforma + royalties; // consolidated — not broken down in PDF
    const custoEnergia = kwhTotal * (1 + c.perdasEnergia / 100) * c.custoKwh;
    const taxaFranquiaAno = c.taxaFranquiaMensal * 12;
    const resultadoOperacional = receitaTotal - custoGestaoPlatforma - custoEnergia - taxaFranquiaAno;
    const impostos = receitaTotal * (c.impostosPct / 100);
    const provisionamento = Math.max(0, receitaTotal * (c.provisionamentoPct / 100));
    const custoTotal = custoGestaoPlatforma + custoEnergia + taxaFranquiaAno + impostos + provisionamento;
    const lucroLiquido = resultadoOperacional - impostos - provisionamento;

    // Amortização linear do investimento: 10% ao ano durante 10 anos
    const amortizacaoInvestimentoAno = ano <= 10 ? investimentoTotal * 0.1 : 0;
    const lucroLiquidoEconomico = lucroLiquido - depreciacaoEquipamentoAno - amortizacaoInstalacaoAno - amortizacaoInvestimentoAno;
    const valorResidualEquipamento = Math.max(0, c.custoEquipamento - depreciacaoEquipamentoAno * ano);

    // CDI comparison: previous profits compound at CDI for the year, then add this year's profit.
    // patrimonioEletropostoAcum = pure cash savings (no equipment residual) — starts at 0 on D0.
    cdiProfitAccum = cdiProfitAccum * (1 + cdi) + lucroLiquido;
    const patrimonioEletropostoAcum = cdiProfitAccum;
    const patrimonioCDIPuroAcum = investimentoTotal * Math.pow(1 + cdi, ano);

    const fcl = ano === 1 ? lucroLiquido - investimentoTotal : lucroLiquido;
    const fclEco = ano === 1 ? lucroLiquidoEconomico - investimentoTotal : lucroLiquidoEconomico;

    const monthlyProfit = lucroLiquido / 12;
    const monthlyProfitEco = lucroLiquidoEconomico / 12;
    for (let m = 1; m <= 12; m++) {
      monthlyAccum += monthlyProfit;
      monthlyAccumEco += monthlyProfitEco;
      if (paybackMeses < 0 && monthlyAccum >= 0) paybackMeses = (ano - 1) * 12 + m;
      if (paybackMesesEco < 0 && monthlyAccumEco >= 0) paybackMesesEco = (ano - 1) * 12 + m;
    }

    yearly.push({
      ano, recargasDCDia: dcDia, recargasACDia: acDia, recargasTotalAno: totalAno,
      kwhTotalAno: kwhTotal, receitaTotal, custoTotal, lucroLiquido,
      fluxoCaixaLivre: fcl, fluxoCaixaAcumulado: monthlyAccum,
      receitaDC, receitaAC, receitaAtivacao,
      custoEnergia, custoGestaoPlatforma, taxaFranquiaAno,
      retencaoPlataforma, royalties, resultadoOperacional, impostos, provisionamento,
      depreciacaoEquipamentoAno, amortizacaoInstalacaoAno,
      lucroLiquidoEconomico, fluxoCaixaLivreEconomico: fclEco,
      fluxoCaixaAcumuladoEconomico: monthlyAccumEco,
      valorResidualEquipamento,
      patrimonioEletropostoAcum,
      patrimonioCDIPuroAcum,
    });
  }

  // Cash view metrics
  let vpl = 0;
  for (let i = 0; i < yearly.length; i++) {
    vpl += yearly[i].fluxoCaixaLivre / Math.pow(1 + c.taxaDescontoAnual / 100, i + 1);
  }
  const tir = calcIRR(yearly.map(y => y.fluxoCaixaLivre));
  const totalProfit = yearly.reduce((s, y) => s + y.lucroLiquido, 0);
  const roiPercent = investimentoTotal > 0 ? ((totalProfit - investimentoTotal) / investimentoTotal) * 100 : 0;
  const margemMedia = yearly.length > 0
    ? yearly.reduce((s, y) => s + (y.receitaTotal > 0 ? (y.lucroLiquido / y.receitaTotal) * 100 : 0), 0) / yearly.length
    : 0;

  // Economic view metrics
  let vplEco = 0;
  for (let i = 0; i < yearly.length; i++) {
    vplEco += yearly[i].fluxoCaixaLivreEconomico / Math.pow(1 + c.taxaDescontoAnual / 100, i + 1);
  }
  const tirEco = calcIRR(yearly.map(y => y.fluxoCaixaLivreEconomico));
  const totalProfitEco = yearly.reduce((s, y) => s + y.lucroLiquidoEconomico, 0);
  const roiPercentEco = investimentoTotal > 0 ? ((totalProfitEco - investimentoTotal) / investimentoTotal) * 100 : 0;
  const margemMediaEco = yearly.length > 0
    ? yearly.reduce((s, y) => s + (y.receitaTotal > 0 ? (y.lucroLiquidoEconomico / y.receitaTotal) * 100 : 0), 0) / yearly.length
    : 0;

  const lastYear = yearly[yearly.length - 1];

  // Final comparison: add equipment residual to cash savings for a fair total-wealth comparison
  const patrimonioEletropostoFinal = lastYear
    ? lastYear.patrimonioEletropostoAcum + lastYear.valorResidualEquipamento
    : 0;
  const patrimonioCDIPuroFinal = lastYear ? lastYear.patrimonioCDIPuroAcum : 0;

  return {
    yearly,
    paybackMeses: paybackMeses > 0 ? paybackMeses : c.horizonteAnos * 12,
    roiPercent, vpl, tir: tir * 100, margemMedia,
    receitaMensalAno1: yearly[0] ? yearly[0].receitaTotal / 12 : 0,
    lucroMensalAno1: yearly[0] ? yearly[0].lucroLiquido / 12 : 0,
    paybackMesesEconomico: paybackMesesEco > 0 ? paybackMesesEco : c.horizonteAnos * 12,
    roiPercentEconomico: roiPercentEco,
    vplEconomico: vplEco,
    tirEconomica: tirEco * 100,
    margemMediaEconomica: margemMediaEco,
    valorResidualFinal: lastYear ? lastYear.valorResidualEquipamento : 0,
    patrimonioEletropostoFinal,
    patrimonioCDIPuroFinal,
    ganhoSobreCDI: patrimonioEletropostoFinal - patrimonioCDIPuroFinal,
  };
}

const DEFAULTS: CustomConfig = {
  dcChargers: 1, acChargers: 1, potenciaDC: 40, potenciaAC: 7,
  horasAbertura: 12,
  // computed defaults: floor(12 / (20/40 + 10/60)) * 1 = 18; floor(12 / (10/7 + 10/60)) * 1 = 7
  platoDCDia: 18, platoACDia: 7,
  recargasDCDiaAno1: 5, recargasACDiaAno1: 1,
  crescimentoAnual: 15,
  recargaMediaDC: 20, recargaMediaAC: 10,
  precoDC: 2.25, precoAC: 1.95, taxaAtivacao: 1.0,
  custoKwh: 0.80, mercadoLivre: false, perdasEnergia: 5,
  retencaoPct: 10, mensalidadeMensal: 0, royaltiesPct: 12, taxaFranquiaMensal: 0,
  impostosPct: 10, provisionamentoPct: 3,
  investimentoTotal: 90000,
  custoEquipamento: 60000,
  custoInstalacao: 30000,
  vidaUtilMeses: 120,
  prazoContratoMeses: 120,
  horizonteAnos: 10, taxaDescontoAnual: 15, taxaCDI: 13.75,
};

export default function PersonalizadoClient() {
  const [config, setConfig] = useState<CustomConfig>({ ...DEFAULTS });
  const [results, setResults] = useState<CustomResults | null>(null);

  const simulate = useCallback(() => {
    try {
      setResults(runCustomSimulation(config));
    } catch (e) { console.error(e); }
  }, [config]);

  const update = (key: keyof CustomConfig, value: number | boolean) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'custoEquipamento' || key === 'custoInstalacao') {
        next.investimentoTotal =
          (key === 'custoEquipamento' ? value as number : prev.custoEquipamento) +
          (key === 'custoInstalacao' ? value as number : prev.custoInstalacao);
      }
      // Auto-recompute plateaus when any physical parameter changes
      const affectsDC = ['horasAbertura', 'recargaMediaDC', 'potenciaDC', 'dcChargers'];
      const affectsAC = ['horasAbertura', 'recargaMediaAC', 'potenciaAC', 'acChargers'];
      if (affectsDC.includes(key as string)) {
        next.platoDCDia = computePlatoDC(next.horasAbertura, next.recargaMediaDC, next.potenciaDC, next.dcChargers);
      }
      if (affectsAC.includes(key as string)) {
        next.platoACDia = computePlatoAC(next.horasAbertura, next.recargaMediaAC, next.potenciaAC, next.acChargers);
      }
      return next;
    });
  };

  const reset = () => setConfig({ ...DEFAULTS });

  const Field = ({ label, field, min, max, step, suffix }: { label: string; field: keyof CustomConfig; min?: number; max?: number; step?: number; suffix?: string }) => (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min ?? 0}
          max={max}
          step={step ?? 1}
          value={config[field] as number}
          onChange={(e) => update(field, parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition"
        />
        {suffix && <span className="text-xs text-gray-500 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-emerald-400" />
          Cenário Personalizado
        </h1>
        <p className="text-gray-500 text-sm mt-1">Monte sua própria simulação com todas as premissas editáveis.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
        {/* Infrastructure */}
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" /> Infraestrutura
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          <Field label="Carregadores DC" field="dcChargers" min={0} max={10} />
          <Field label="Carregadores AC" field="acChargers" min={0} max={10} />
          <Field label="Potência DC" field="potenciaDC" min={0} max={300} suffix="kW" />
          <Field label="Potência AC" field="potenciaAC" min={0} max={22} suffix="kW" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Field label="Custo do equipamento" field="custoEquipamento" min={0} step={1000} suffix="R$" />
          <Field label="Custo da instalação" field="custoInstalacao" min={0} step={1000} suffix="R$" />
          <Field label="Vida útil do equipamento" field="vidaUtilMeses" min={12} max={240} suffix="meses" />
          <Field label="Prazo do contrato" field="prazoContratoMeses" min={12} max={240} suffix="meses" />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Investimento total</label>
            <div className="px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-emerald-400 text-sm font-semibold">
              {formatCurrency(config.custoEquipamento + config.custoInstalacao)}
            </div>
          </div>
        </div>

        {/* Usage */}
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Battery className="w-4 h-4 text-amber-400" /> Utilização
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <Field label="Horas de operação/dia" field="horasAbertura" min={1} max={24} suffix="h/dia" />
          <Field label="Recargas DC/dia (Ano 1)" field="recargasDCDiaAno1" min={0} max={100} />
          <Field label="Recargas AC/dia (Ano 1)" field="recargasACDiaAno1" min={0} max={100} step={0.1} />
          <Field label="Crescimento anual" field="crescimentoAnual" min={0} max={100} suffix="%" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <Field label="Recarga média DC" field="recargaMediaDC" min={1} max={100} suffix="kWh" />
          <Field label="Recarga média AC" field="recargaMediaAC" min={1} max={100} suffix="kWh" />
          {/* Plateau DC — editable, auto-computed from physical params */}
          <div>
            <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-400" /> Platô DC (máx/dia)
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={config.platoDCDia}
              onChange={(e) => update('platoDCDia', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm focus:outline-none focus:border-blue-500 transition"
            />
            {config.dcChargers > 0 && config.potenciaDC > 0 && (
              <p className="text-xs text-blue-400/60 mt-1">
                Auto: {computePlatoDC(config.horasAbertura, config.recargaMediaDC, config.potenciaDC, config.dcChargers)} sess. · {Math.round((config.recargaMediaDC / config.potenciaDC) * 60 + 10)} min/sess.
              </p>
            )}
          </div>
          {/* Plateau AC — editable, auto-computed from physical params */}
          <div>
            <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Platô AC (máx/dia)
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={config.platoACDia}
              onChange={(e) => update('platoACDia', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm focus:outline-none focus:border-amber-500 transition"
            />
            {config.acChargers > 0 && config.potenciaAC > 0 && (
              <p className="text-xs text-amber-400/60 mt-1">
                Auto: {computePlatoAC(config.horasAbertura, config.recargaMediaAC, config.potenciaAC, config.acChargers)} sess. · {Math.round((config.recargaMediaAC / config.potenciaAC) * 60 + 10)} min/sess.
              </p>
            )}
          </div>
        </div>
        {/* Plateau warning */}
        {(config.recargasDCDiaAno1 >= config.platoDCDia && config.platoDCDia > 0) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-4 w-fit">
            ⚠ Recargas DC Ano 1 ({config.recargasDCDiaAno1}) já estão no platô ({config.platoDCDia})
          </div>
        )}

        {/* Pricing */}
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" /> Preços
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Field label="Preço cobrado DC" field="precoDC" min={0} max={10} step={0.05} suffix="R$/kWh" />
          <Field label="Preço cobrado AC" field="precoAC" min={0} max={10} step={0.05} suffix="R$/kWh" />
          <Field label="Taxa ativação" field="taxaAtivacao" min={0} max={10} step={0.5} suffix="R$/recarga" />
          <Field label="Custo energia" field="custoKwh" min={0} max={5} step={0.05} suffix="R$/kWh" />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Mercado</label>
            <select
              value={config.mercadoLivre ? 'livre' : 'cativo'}
              onChange={(e) => {
                const livre = e.target.value === 'livre';
                update('mercadoLivre', livre);
                if (livre && config.custoKwh > 0.5) update('custoKwh', 0.40);
                if (!livre && config.custoKwh < 0.5) update('custoKwh', 0.80);
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer"
            >
              <option value="cativo" className="bg-gray-900">Cativo (~R$0,80)</option>
              <option value="livre" className="bg-gray-900">Livre (~R$0,40)</option>
            </select>
          </div>
        </div>

        {/* Cost structure */}
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Percent className="w-4 h-4 text-red-400" /> Estrutura de Custos
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Field label="Retenção plataforma (TUPI)" field="retencaoPct" min={0} max={50} suffix="% receita" />
          <Field label="Mensalidade plataforma" field="mensalidadeMensal" min={0} max={500} suffix="R$/mês" />
          <Field label="Royalties PlugFácil" field="royaltiesPct" min={0} max={50} suffix="% receita" />
          <Field label="Taxa de Franquia" field="taxaFranquiaMensal" min={0} max={5000} step={50} suffix="R$/mês" />
          <Field label="Impostos s/ receita" field="impostosPct" min={0} max={50} suffix="%" />
          <Field label="Provisionamento" field="provisionamentoPct" min={0} max={50} suffix="% receita" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Field label="Perdas energia" field="perdasEnergia" min={0} max={20} suffix="%" />
        </div>

        {/* Financial */}
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" /> Financeiro
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <Field label="Horizonte de análise" field="horizonteAnos" min={1} max={20} suffix="anos" />
          <Field label="Taxa de desconto anual (TMA)" field="taxaDescontoAnual" min={0} max={50} step={0.5} suffix="%" />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Taxa CDI (comparação)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0} max={50} step={0.25}
                value={config.taxaCDI}
                onChange={(e) => update('taxaCDI', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm focus:outline-none focus:border-yellow-500 transition"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">% a.a.</span>
            </div>
            <p className="text-xs text-yellow-400/60 mt-1">Usado só p/ comparar c/ renda fixa</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={simulate} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white gradient-accent hover:opacity-90 transition shadow-lg">
            <RefreshCw className="w-5 h-5" /> Calcular
          </button>
          <button onClick={reset} className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition text-sm">
            <RotateCcw className="w-4 h-4" /> Resetar padrões
          </button>
        </div>
      </motion.div>

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Export button */}
          <div className="flex justify-end">
            <button
              onClick={() => exportPersonalizadoPDF(config, results)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg text-sm"
            >
              <FileDown className="w-4 h-4" />
              Exportar PDF para cliente
            </button>
          </div>

          {/* Visão Caixa */}
          <div className="glass rounded-2xl p-5 border border-emerald-500/20">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              Visão Caixa — fluxo real sem depreciação
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
              {([
                { icon: DollarSign, label: 'Investimento', value: formatCurrency(config.custoEquipamento + config.custoInstalacao), color: 'text-white', bg: 'bg-white/5' },
                { icon: Clock, label: 'Payback', value: `${results.paybackMeses} meses`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { icon: TrendingUp, label: 'ROI 10 anos', value: formatPercent(results.roiPercent), color: results.roiPercent > 0 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-emerald-500/10' },
                { icon: BarChart3, label: 'Rendimento vs CDI', value: formatPercent(results.roiPercent - 10.5), color: results.roiPercent > 10.5 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-blue-500/10' },
                { icon: Percent, label: 'Rendimento Médio/Ano', value: formatPercent((results.lucroMensalAno1 * 12) / (config.custoEquipamento + config.custoInstalacao) * 100), color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: Target, label: 'Margem', value: formatPercent(results.margemMedia), color: 'text-purple-400', bg: 'bg-purple-500/10' },
              ] as const).map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div key={i} className={`${kpi.bg} rounded-xl p-4 border border-white/5`}>
                    <Icon className={`w-4 h-4 ${kpi.color} mb-2`} />
                    <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-gray-500 mb-1">Faturamento médio mensal (Ano 1)</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(results.receitaMensalAno1)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-gray-500 mb-1">Lucro líquido mensal (Ano 1) — s/ depreciação</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(results.lucroMensalAno1)}</p>
              </div>
            </div>
          </div>

          {/* Visão Econômica */}
          <div className="glass rounded-2xl p-5 border border-orange-500/20">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-400" />
              Visão Econômica — com depreciação e amortização
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {(() => {
                const inv = config.custoEquipamento + config.custoInstalacao;
                const total = config.custoEquipamento + config.custoInstalacao + (config.custoEquipamento + config.custoInstalacao);
                const deprecAno = (config.custoEquipamento / config.vidaUtilMeses + config.custoInstalacao / config.prazoContratoMeses) * 12;
                const amortInvestAno = total * 0.1;
                const taxaAno = total > 0 ? ((deprecAno + amortInvestAno) / total * 100) : 0;
                return `Depreciação linear: ${formatCurrency(deprecAno)}/ano + Amortização investimento: ${formatCurrency(amortInvestAno)}/ano (primeiros 10 anos) = Total: ${formatCurrency(deprecAno + amortInvestAno)}/ano`;
              })()}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {([
                { icon: Clock, label: 'Payback Eco.', value: `${results.paybackMesesEconomico} meses`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { icon: TrendingUp, label: 'ROI Eco.', value: formatPercent(results.roiPercentEconomico), color: results.roiPercentEconomico > 0 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-emerald-500/10' },
                { icon: BarChart3, label: 'Rendimento vs CDI', value: formatPercent(results.roiPercentEconomico - 10.5), color: results.roiPercentEconomico > 10.5 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-blue-500/10' },
                { icon: Percent, label: 'Margem Eco.', value: formatPercent(results.margemMediaEconomica), color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { icon: DollarSign, label: 'Valor Residual', value: formatCurrency(results.valorResidualFinal), color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { icon: Target, label: 'Lucro/Ano (Ano 1)', value: formatCurrency(results.lucroMensalAno1 * 12), color: 'text-green-400', bg: 'bg-green-500/10' },
              ] as const).map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div key={i} className={`${kpi.bg} rounded-xl p-4 border border-white/5`}>
                    <Icon className={`w-4 h-4 ${kpi.color} mb-2`} />
                    <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CDI Comparison */}
          <div className="glass rounded-2xl p-5 border border-yellow-500/20">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
              Comparação com CDI — {config.taxaCDI.toFixed(2)}% a.a.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Cada ano, o lucro líquido do eletroposto é reinvestido no CDI. Compara com o capital inicial aplicado 100% no CDI durante {config.horizonteAnos} anos.
            </p>
            {/* Summary cards — final year only, residual included for fair total-wealth comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                <p className="text-xs text-gray-400 mb-1">Patrimônio eletroposto no Ano {config.horizonteAnos}</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(results.patrimonioEletropostoFinal)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Saldo CDI dos lucros + valor residual do equipamento ({formatCurrency(results.valorResidualFinal)})
                </p>
              </div>
              <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                <p className="text-xs text-gray-400 mb-1">CDI puro no Ano {config.horizonteAnos}</p>
                <p className="text-xl font-bold text-yellow-400">{formatCurrency(results.patrimonioCDIPuroFinal)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(config.custoEquipamento + config.custoInstalacao)} a {config.taxaCDI.toFixed(2)}% a.a. por {config.horizonteAnos} anos
                </p>
              </div>
              <div className={`rounded-xl p-4 border ${results.ganhoSobreCDI >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <p className="text-xs text-gray-400 mb-1">{results.ganhoSobreCDI >= 0 ? 'Vantagem do eletroposto' : 'Desvantagem vs. CDI'}</p>
                <p className={`text-xl font-bold ${results.ganhoSobreCDI >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {results.ganhoSobreCDI >= 0 ? '+' : ''}{formatCurrency(results.ganhoSobreCDI)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {results.ganhoSobreCDI >= 0
                    ? `O eletroposto gerou ${formatCurrency(results.ganhoSobreCDI)} a mais do que a renda fixa`
                    : `O CDI superou o eletroposto em ${formatCurrency(Math.abs(results.ganhoSobreCDI))}`}
                </p>
              </div>
            </div>
            {/* Year-by-year table: saldo real na conta CDI partindo de R$0 no D0 */}
            <p className="text-xs text-gray-500 mb-2">
              Saldo real na conta — começa em R$0 no D0. Cada ano: saldo anterior rende CDI, depois deposita o lucro líquido do eletroposto.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-white/5">
                    <th className="text-left py-2 px-2">Ano</th>
                    <th className="text-right py-2 px-2">Lucro líquido</th>
                    <th className="text-right py-2 px-2">Saldo na conta (CDI)</th>
                    <th className="text-right py-2 px-2">CDI puro</th>
                    <th className="text-right py-2 px-2">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {results.yearly.map((y, i) => {
                    const diff = y.patrimonioEletropostoAcum - y.patrimonioCDIPuroAcum;
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-2 px-2 text-gray-400">Ano {y.ano}</td>
                        <td className="py-2 px-2 text-right text-white">{formatCurrency(y.lucroLiquido)}</td>
                        <td className="py-2 px-2 text-right text-emerald-400 font-medium">{formatCurrency(y.patrimonioEletropostoAcum)}</td>
                        <td className="py-2 px-2 text-right text-yellow-400">{formatCurrency(y.patrimonioCDIPuroAcum)}</td>
                        <td className={`py-2 px-2 text-right font-semibold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <PersonalizadoCharts results={results} />

          {/* Yearly Table */}
          <div className="glass rounded-2xl p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" /> Projeção Anual
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/5">
                  <th className="text-left py-3 px-2">Ano</th>
                  <th className="text-right py-3 px-2">Recargas/dia</th>
                  <th className="text-right py-3 px-2">Receita</th>
                  <th className="text-right py-3 px-2">Custos</th>
                  <th className="text-right py-3 px-2">Lucro (caixa)</th>
                  <th className="text-right py-3 px-2">Lucro (econômico)</th>
                </tr>
              </thead>
              <tbody>
                {results.yearly.map((y, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-3 px-2 text-white font-medium">Ano {y.ano}</td>
                    <td className="py-3 px-2 text-right text-gray-400">
                      {y.recargasDCDia > 0 ? `${y.recargasDCDia.toFixed(1)} DC` : ''}
                      {y.recargasDCDia > 0 && y.recargasACDia > 0 ? ' + ' : ''}
                      {y.recargasACDia > 0 ? `${y.recargasACDia.toFixed(1)} AC` : ''}
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-400">{formatCurrency(y.receitaTotal)}</td>
                    <td className="py-3 px-2 text-right text-red-400">{formatCurrency(y.custoTotal)}</td>
                    <td className="py-3 px-2 text-right text-white">{formatCurrency(y.lucroLiquido)}</td>
                    <td className={`py-3 px-2 text-right font-semibold ${y.lucroLiquidoEconomico >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
                      {formatCurrency(y.lucroLiquidoEconomico)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CDI monthly yield vs eletroposto — 10-year averages */}
          {(() => {
            const inv = config.custoEquipamento + config.custoInstalacao;
            const meses = config.horizonteAnos * 12;
            // Average monthly eletroposto profit across all years
            const lucroMensalMedio = results.yearly.reduce((s, y) => s + y.lucroLiquido, 0) / meses;
            // Average monthly CDI return: total interest earned ÷ number of months
            const jurosCDITotal = results.patrimonioCDIPuroFinal - inv;
            const rendimentoCDIMensalMedio = jurosCDITotal / meses;
            const vantagem = lucroMensalMedio - rendimentoCDIMensalMedio;
            return (
              <div className="glass rounded-2xl p-5 border border-white/10">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Rendimento mensal médio: eletroposto vs. CDI — média dos {config.horizonteAnos} anos
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  CDI: total de juros gerados em {config.horizonteAnos} anos ÷ {meses} meses. Eletroposto: média do lucro líquido anual ÷ 12.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                    <p className="text-xs text-gray-400 mb-1">CDI — rendimento médio/mês</p>
                    <p className="text-xl font-bold text-yellow-400">{formatCurrency(rendimentoCDIMensalMedio)}/mês</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(jurosCDITotal)} de juros em {config.horizonteAnos} anos ÷ {meses} meses — capital de {formatCurrency(inv)} intacto
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                    <p className="text-xs text-gray-400 mb-1">Eletroposto — lucro médio/mês</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(lucroMensalMedio)}/mês</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Média dos {config.horizonteAnos} anos — começa menor, cresce com a demanda
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 border ${vantagem >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className="text-xs text-gray-400 mb-1">{vantagem >= 0 ? 'Vantagem do eletroposto' : 'CDI supera o eletroposto'}</p>
                    <p className={`text-xl font-bold ${vantagem >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {vantagem >= 0 ? '+' : ''}{formatCurrency(vantagem)}/mês
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {vantagem >= 0
                        ? `Na média dos ${config.horizonteAnos} anos, o eletroposto rende ${formatCurrency(vantagem)}/mês a mais que o CDI`
                        : `Na média dos ${config.horizonteAnos} anos, o CDI ainda supera — revise utilização ou preços`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}
