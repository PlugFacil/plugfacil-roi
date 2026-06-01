// Financial engine matching the PlugFácil Excel spreadsheet exactly
// Each formula is annotated with the spreadsheet cell reference logic

import modelosData from '@/data/plugfacil_modelos.json';
import cenariosData from '@/data/plugfacil_cenarios.json';

// ══════════════════════════════════════════════
// SPREADSHEET CONSTANTS
// ══════════════════════════════════════════════

// DC charging SLOTS (simultaneous cars)
// Turbo: 1 physical 80kW charger with 2 guns → 2 DC slots
// Hub: JSON has dc=2 which already matches
const DC_SLOTS: Record<string, number> = {
  Essencial: 0,
  Basico: 1,
  Padrao: 1,
  Turbo: 2,
  Hub: 2,
};

// Average kWh per recharge session (spreadsheet "Recarga Média")
const RECARGA_MEDIA_DC: Record<string, number> = {
  Essencial: 0,
  Basico: 20,
  Padrao: 20,
  Turbo: 20,
  Hub: 20,
};

const RECARGA_MEDIA_AC: Record<string, number> = {
  Essencial: 20,
  Basico: 0,
  Padrao: 10,
  Turbo: 10,
  Hub: 10,
};

// AC ratio: "Recargas AC = 20% das recargas DC" (per AC charger)
const AC_RATIO = 0.20;

// Activation fee R$2 per recharge
const TAXA_ATIVACAO = 2.0;

// Platform retention: 10% of revenue + R$600/year (R$50/month)
const RETENCAO_PERCENTUAL = 0.10;
const MENSALIDADE_ANUAL = 600;

// Energy loss factor: 5%
const PERDAS_ENERGIA = 1.05;

// Royalties PlugFácil: 12% of revenue
const ROYALTIES_PERCENTUAL = 0.12;

// Taxes: 10% of revenue
const IMPOSTOS_PERCENTUAL = 0.10;

// Provisioning: 8% of operational result
const PROVISIONAMENTO_PERCENTUAL = 0.08;

// Discount rate: CDI + risk premium for small franchise business (~15% p.a.)
const TAXA_DESCONTO_ANUAL = 0.15;

// Analysis horizon
const HORIZONTE_ANOS = 10;
const DIAS_ANO = 365;

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

export interface ModeloFranquia {
  modelo: string;
  investimento: number;
  carregadores: { dc: number; ac: number };
  potencia_kw: { dc: number; ac: number };
  tempo_recarga_min: { dc: number | null; ac: number | null };
  energia: { mercado_livre: boolean; custo_kwh: number };
  preco_recarga: { dc: number | null; ac: number | null };
}

export interface SimulationConfig {
  modelo: string;
  cenario: 'pessimista' | 'base' | 'otimista';
  quantidadeEstacoes: number;
}

export interface YearlyResult {
  ano: number;
  // Recharges
  recargasDCDia: number;
  recargasACDia: number;
  recargasDCAno: number;
  recargasACAno: number;
  recargasTotalAno: number;
  // Energy
  kwhDCAno: number;
  kwhACAno: number;
  kwhTotalAno: number;
  // Revenue
  receitaDC: number;
  receitaAC: number;
  receitaAtivacao: number;
  receitaTotal: number;
  // Costs
  retencaoPlataforma: number;
  custoEnergia: number;
  royalties: number;
  impostos: number;
  resultadoOperacional: number;
  provisionamento: number;
  custoTotal: number;
  // Cash flow
  lucroLiquido: number;
  fluxoCaixaLivre: number;
  fluxoCaixaAcumulado: number;
}

export interface SimulationResults {
  investimentoTotal: number;
  modeloInfo: ModeloFranquia;
  yearly: YearlyResult[];
  paybackMeses: number;
  roiPercent: number;
  vpl: number;
  tir: number;
  margemMedia: number;
  receitaMensalAno1: number;
  lucroMensalAno1: number;
}

// ══════════════════════════════════════════════
// DATA ACCESS
// ══════════════════════════════════════════════

export function getModelos(): ModeloFranquia[] {
  return modelosData?.modelos ?? [];
}

export function getModeloByName(name: string): ModeloFranquia | undefined {
  return getModelos().find((m: any) => m?.modelo === name);
}

export function getCenarioRecargas(cenario: string): number[] {
  const c = (cenariosData as any)?.cenarios_utilizacao?.[cenario];
  return c?.recargas_dc_dia ?? [5, 6, 8, 10, 10, 11, 11, 12, 12, 12];
}

// ══════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════

export function runSimulation(config: SimulationConfig): SimulationResults {
  const modelo = getModeloByName(config.modelo);
  if (!modelo) throw new Error('Modelo não encontrado');

  const qtd = config.quantidadeEstacoes ?? 1;
  const investimentoTotal = (modelo.investimento ?? 0) * qtd;
  const cenarioRecargas = getCenarioRecargas(config.cenario);

  // Model-specific parameters
  const dcSlots = (DC_SLOTS[config.modelo] ?? modelo.carregadores?.dc ?? 0) * qtd;
  const acChargers = (modelo.carregadores?.ac ?? 0) * qtd;
  const recargaMediaDC = RECARGA_MEDIA_DC[config.modelo] ?? 20;
  const recargaMediaAC = RECARGA_MEDIA_AC[config.modelo] ?? 10;
  const precoDC = modelo.preco_recarga?.dc ?? 0;
  const precoAC = modelo.preco_recarga?.ac ?? 0;
  const custoKwh = modelo.energia?.custo_kwh ?? 0.80;

  const yearly: YearlyResult[] = [];
  let paybackMeses = -1;
  let monthlyAccum = -investimentoTotal;

  for (let ano = 1; ano <= HORIZONTE_ANOS; ano++) {
    const cenVal = cenarioRecargas[ano - 1] ?? cenarioRecargas[cenarioRecargas.length - 1] ?? 10;

    // ── Recargas ──
    const recargasDCDia = cenVal * dcSlots;
    const recargasACDia = cenVal * AC_RATIO * acChargers;
    const recargasDCAno = recargasDCDia * DIAS_ANO;
    const recargasACAno = recargasACDia * DIAS_ANO;
    const recargasTotalAno = recargasDCAno + recargasACAno;

    // ── Energia (kWh) ──
    const kwhDCAno = recargasDCAno * recargaMediaDC;
    const kwhACAno = recargasACAno * recargaMediaAC;
    const kwhTotalAno = kwhDCAno + kwhACAno;

    // ── Receita ──
    const receitaDC = kwhDCAno * precoDC;
    const receitaAC = kwhACAno * precoAC;
    const receitaAtivacao = recargasTotalAno * TAXA_ATIVACAO;
    const receitaTotal = receitaDC + receitaAC + receitaAtivacao;

    // ── Custos ──
    const retencaoPlataforma = receitaTotal * RETENCAO_PERCENTUAL + MENSALIDADE_ANUAL * qtd;
    const custoEnergia = kwhTotalAno * PERDAS_ENERGIA * custoKwh;
    const royalties = receitaTotal * ROYALTIES_PERCENTUAL;
    const impostos = receitaTotal * IMPOSTOS_PERCENTUAL;

    // ── Resultado Operacional ──
    const resultadoOperacional = receitaTotal - retencaoPlataforma - custoEnergia - royalties;

    // ── Provisionamento (não é custo — é dinheiro que fica com o franqueado) ──
    const provisionamento = Math.max(0, resultadoOperacional * PROVISIONAMENTO_PERCENTUAL);

    // ── Custos totais (sem provisionamento) ──
    const custoTotal = retencaoPlataforma + custoEnergia + royalties + impostos;

    // ── Lucro líquido (antes investimento) — inclui provisionamento ──
    const lucroLiquido = resultadoOperacional - impostos;

    // ── Fluxo de Caixa Livre ──
    const fluxoCaixaLivre = ano === 1 ? lucroLiquido - investimentoTotal : lucroLiquido;

    // ── Payback mensal tracking ──
    const monthlyProfit = lucroLiquido / 12;
    for (let m = 1; m <= 12; m++) {
      monthlyAccum += monthlyProfit;
      if (paybackMeses < 0 && monthlyAccum >= 0) {
        paybackMeses = (ano - 1) * 12 + m;
      }
    }

    yearly.push({
      ano,
      recargasDCDia,
      recargasACDia,
      recargasDCAno,
      recargasACAno,
      recargasTotalAno,
      kwhDCAno,
      kwhACAno,
      kwhTotalAno,
      receitaDC,
      receitaAC,
      receitaAtivacao,
      receitaTotal,
      retencaoPlataforma,
      custoEnergia,
      royalties,
      impostos,
      resultadoOperacional,
      provisionamento,
      custoTotal,
      lucroLiquido,
      fluxoCaixaLivre,
      fluxoCaixaAcumulado: monthlyAccum,
    });
  }

  // ── VPL ──
  let vpl = 0;
  for (let i = 0; i < yearly.length; i++) {
    vpl += yearly[i].fluxoCaixaLivre / Math.pow(1 + TAXA_DESCONTO_ANUAL, i + 1);
  }

  // ── TIR ──
  const irrFlows = yearly.map((y) => y.fluxoCaixaLivre);
  const tir = calcIRR(irrFlows);

  // ── ROI ──
  const totalProfit = yearly.reduce((s, y) => s + y.lucroLiquido, 0);
  const roiPercent = investimentoTotal > 0 ? ((totalProfit - investimentoTotal) / investimentoTotal) * 100 : 0;

  // ── Margem média ──
  const margemMedia = yearly.length > 0
    ? yearly.reduce((s, y) => {
        const m = y.receitaTotal > 0 ? (y.lucroLiquido / y.receitaTotal) * 100 : 0;
        return s + m;
      }, 0) / yearly.length
    : 0;

  // ── Ano 1 metrics ──
  const y1 = yearly[0];
  const receitaMensalAno1 = y1 ? y1.receitaTotal / 12 : 0;
  const lucroMensalAno1 = y1 ? y1.lucroLiquido / 12 : 0;

  return {
    investimentoTotal,
    modeloInfo: modelo,
    yearly,
    paybackMeses: paybackMeses > 0 ? paybackMeses : HORIZONTE_ANOS * 12,
    roiPercent,
    vpl,
    tir: tir * 100,
    margemMedia,
    receitaMensalAno1,
    lucroMensalAno1,
  };
}

// ══════════════════════════════════════════════
// IRR via bisection
// ══════════════════════════════════════════════

function calcIRR(cashflows: number[]): number {
  let low = -0.5;
  let high = 5.0;
  for (let iter = 0; iter < 200; iter++) {
    const mid = (low + high) / 2;
    const npvVal = cashflows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + mid, i + 1), 0);
    if (Math.abs(npvVal) < 0.01) return mid;
    if (npvVal > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// ══════════════════════════════════════════════
// FORMATTING
// ══════════════════════════════════════════════

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

export function formatPercent(value: number): string {
  return `${(value ?? 0).toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value ?? 0);
}

// ══════════════════════════════════════════════
// MODEL PARAMETERS (for display)
// ══════════════════════════════════════════════

export function getModelParams(modelo: string) {
  const m = getModeloByName(modelo);
  if (!m) return null;
  return {
    dcSlots: DC_SLOTS[modelo] ?? m.carregadores?.dc ?? 0,
    acChargers: m.carregadores?.ac ?? 0,
    recargaMediaDC: RECARGA_MEDIA_DC[modelo] ?? 20,
    recargaMediaAC: RECARGA_MEDIA_AC[modelo] ?? 10,
    precoDC: m.preco_recarga?.dc ?? 0,
    precoAC: m.preco_recarga?.ac ?? 0,
    custoKwh: m.energia?.custo_kwh ?? 0.80,
    mercadoLivre: m.energia?.mercado_livre ?? false,
    taxaAtivacao: TAXA_ATIVACAO,
    retencaoPct: RETENCAO_PERCENTUAL * 100,
    royaltiesPct: Math.round(ROYALTIES_PERCENTUAL * 10000) / 100,
    impostosPct: Math.round(IMPOSTOS_PERCENTUAL * 10000) / 100,
    provisionamentoPct: Math.round(PROVISIONAMENTO_PERCENTUAL * 10000) / 100,
    mensalidadeMensal: MENSALIDADE_ANUAL / 12,
    perdasEnergia: Math.round((PERDAS_ENERGIA - 1) * 10000) / 100,
    acRatio: Math.round(AC_RATIO * 10000) / 100,
    taxaDescontoAnual: Math.round(TAXA_DESCONTO_ANUAL * 10000) / 100,
  };
}
