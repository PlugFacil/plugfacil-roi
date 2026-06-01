export interface CustomConfig {
  dcChargers: number;
  acChargers: number;
  potenciaDC: number;
  potenciaAC: number;
  horasAbertura: number;
  platoDCDia: number;
  platoACDia: number;
  recargasDCDiaAno1: number;
  recargasACDiaAno1: number;
  crescimentoAnual: number;
  recargaMediaDC: number;
  recargaMediaAC: number;
  precoDC: number;
  precoAC: number;
  taxaAtivacao: number;
  custoKwh: number;
  mercadoLivre: boolean;
  perdasEnergia: number;
  // Costs (% of revenue)
  retencaoPct: number;        // platform retention (TUPI) — internal to PlugFácil
  mensalidadeMensal: number;  // monthly platform fee
  royaltiesPct: number;       // PlugFácil royalties — internal to PlugFácil
  taxaFranquiaMensal: number; // monthly franchise fee charged to franchisee (future)
  impostosPct: number;
  provisionamentoPct: number;
  // Investment split
  investimentoTotal: number;       // derived: custoEquipamento + custoInstalacao
  custoEquipamento: number;
  custoInstalacao: number;
  vidaUtilMeses: number;
  prazoContratoMeses: number;
  horizonteAnos: number;
  taxaDescontoAnual: number;
  taxaCDI: number;
}

export interface CustomYearlyResult {
  ano: number;
  recargasDCDia: number;
  recargasACDia: number;
  recargasTotalAno: number;
  kwhTotalAno: number;
  receitaTotal: number;
  custoTotal: number;
  // Cash view
  lucroLiquido: number;
  fluxoCaixaLivre: number;
  fluxoCaixaAcumulado: number;
  // Revenue breakdown
  receitaDC: number;
  receitaAC: number;
  receitaAtivacao: number;
  // Cost breakdown
  custoEnergia: number;
  custoGestaoPlatforma: number;  // retencao + royalties + mensalidade (consolidated)
  taxaFranquiaAno: number;
  resultadoOperacional: number;
  impostos: number;
  provisionamento: number;
  // kept for internal use (not shown in PDF)
  retencaoPlataforma: number;
  royalties: number;
  // Depreciation / economic view
  depreciacaoEquipamentoAno: number;
  amortizacaoInstalacaoAno: number;
  lucroLiquidoEconomico: number;
  fluxoCaixaLivreEconomico: number;
  fluxoCaixaAcumuladoEconomico: number;
  valorResidualEquipamento: number;
  // CDI comparison (cumulative wealth at end of each year)
  patrimonioEletropostoAcum: number;  // CDI-compounded profits + equipment residual
  patrimonioCDIPuroAcum: number;      // initial investment × (1+CDI)^year
}

export interface CustomResults {
  yearly: CustomYearlyResult[];
  // Cash view
  paybackMeses: number;
  roiPercent: number;
  vpl: number;
  tir: number;
  margemMedia: number;
  receitaMensalAno1: number;
  lucroMensalAno1: number;
  // Economic view
  paybackMesesEconomico: number;
  roiPercentEconomico: number;
  vplEconomico: number;
  tirEconomica: number;
  margemMediaEconomica: number;
  valorResidualFinal: number;
  // CDI comparison
  patrimonioEletropostoFinal: number;
  patrimonioCDIPuroFinal: number;
  ganhoSobreCDI: number;
}
