import type { CustomConfig, CustomResults } from './personalizado-types';

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const pct = (v: number) => `${v.toFixed(1)}%`;

const num = (v: number, decimals = 0) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals }).format(v);

function kpiCard(label: string, value: string, sub = '', color = '#1a1a1a') {
  return `
    <div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;">
      <div style="font-size:10px;color:#6b7280;margin-bottom:5px;line-height:1.3;">${label}</div>
      <div style="font-size:14px;font-weight:700;color:${color};line-height:1.3;word-break:break-word;">${value}</div>
      ${sub ? `<div style="font-size:10px;color:#9ca3af;margin-top:3px;line-height:1.3;">${sub}</div>` : ''}
    </div>`;
}

function section(title: string, content: string) {
  return `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
                 color:#00B386;border-bottom:2px solid #00B386;padding-bottom:6px;margin-bottom:14px;">
        ${title}
      </h2>
      ${content}
    </div>`;
}

function premissaRow(label: string, value: string, note = '') {
  return `
    <tr>
      <td style="padding:7px 10px;font-size:12px;color:#374151;border-bottom:1px solid #f3f4f6;width:40%;">${label}</td>
      <td style="padding:7px 10px;font-size:12px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #f3f4f6;width:25%;">${value}</td>
      <td style="padding:7px 10px;font-size:11px;color:#9ca3af;border-bottom:1px solid #f3f4f6;">${note}</td>
    </tr>`;
}

export function exportPersonalizadoPDF(config: CustomConfig, results: CustomResults): void {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Permita popups para exportar o PDF.'); return; }

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const y1 = results.yearly[0];

  // Consolidated PlugFácil fee (not broken down for client)
  const custoGestaoPlatformaAnual1 = y1 ? y1.custoGestaoPlatforma : 0;
  const custoGestaoPctEfetivo = y1 && y1.receitaTotal > 0
    ? (custoGestaoPlatformaAnual1 / y1.receitaTotal * 100)
    : (config.retencaoPct + config.royaltiesPct);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Análise de Viabilidade – PlugFácil</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      background: #fff;
      padding: 40px 48px;
      font-size: 13px;
      line-height: 1.5;
    }
    @media print {
      body { padding: 20px 28px; }
      .no-print { display: none !important; }
      @page { margin: 15mm 12mm; size: A4; }
    }
    table { width: 100%; border-collapse: collapse; }
    h1 { font-size: 22px; font-weight: 800; color: #111; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .tag {
      display: inline-block;
      background: #e6f9f3;
      color: #00B386;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 20px;
      margin-right: 6px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 8px;
    }
    .alert-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #166534;
    }
    .footer {
      margin-top: 40px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- ── CABEÇALHO ─────────────────────────────── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;
              border-bottom:3px solid #00B386;padding-bottom:20px;">
    <div>
      <div style="font-size:20px;font-weight:900;color:#00B386;letter-spacing:-.3px;">PlugFácil</div>
      <h1 style="margin-top:6px;">Análise de Viabilidade Financeira</h1>
      <div class="subtitle">Cenário Personalizado — gerado em ${hoje}</div>
      <div style="margin-top:10px;">
        <span class="tag">Cenário customizado</span>
        <span class="tag">${config.horizonteAnos} anos</span>
        <span class="tag">TMA ${pct(config.taxaDescontoAnual)} a.a.</span>
      </div>
    </div>
    <div style="text-align:right;font-size:11px;color:#9ca3af;line-height:1.8;">
      <div>Investimento total</div>
      <div style="font-size:22px;font-weight:800;color:#1a1a1a;">${brl(config.custoEquipamento + config.custoInstalacao)}</div>
    </div>
  </div>

  <!-- ── KPIs: VISÃO CAIXA ─────────────────────── -->
  ${section('Resultados — Visão Caixa', `
    <div style="font-size:11px;color:#6b7280;margin-bottom:10px;">
      Fluxo de caixa real — sem considerar depreciação dos ativos. Métricas para avaliação do investimento.
    </div>
    <div class="kpi-grid">
      ${kpiCard('Payback', `${results.paybackMeses} meses`, 'Recuperação do investimento', '#d97706')}
      ${kpiCard('ROI ' + config.horizonteAnos + ' anos', pct(results.roiPercent), 'Ganho líquido / investimento', results.roiPercent >= 0 ? '#059669' : '#dc2626')}
      ${kpiCard('VPL', brl(results.vpl), 'Valor presente líquido', results.vpl >= 0 ? '#059669' : '#dc2626')}
      ${kpiCard('TIR', pct(results.tir), 'Taxa interna de retorno a.a.', '#2563eb')}
      ${kpiCard('Margem líquida', pct(results.margemMedia), 'Média dos ' + config.horizonteAnos + ' anos', '#7c3aed')}
      ${kpiCard('Fat. mensal Ano 1', brl(results.receitaMensalAno1), 'Faturamento bruto', '#059669')}
      ${kpiCard('Lucro mensal Ano 1', brl(results.lucroMensalAno1), 'Após todos os custos', '#059669')}
    </div>
    ${results.vpl >= 0
      ? `<div class="alert-box">✅ VPL positivo — o retorno supera a taxa mínima de atratividade de ${pct(config.taxaDescontoAnual)} ao ano (referência CDI + prêmio de risco). O capital investido no eletroposto rende mais do que em renda fixa nas premissas adotadas.</div>`
      : `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;font-size:12px;color:#991b1b;">⚠️ VPL negativo — nas premissas atuais, o retorno não supera ${pct(config.taxaDescontoAnual)} ao ano. Revise as premissas de utilização ou o nível de investimento.</div>`
    }
  `)}

  <!-- ── KPIs: VISÃO ECONÔMICA ──────────────────── -->
  ${section('Resultados — Visão Econômica (com depreciação e amortização)', `
    ${(() => {
      const inv = config.custoEquipamento + config.custoInstalacao;
      const deprecAno = (config.custoEquipamento / config.vidaUtilMeses + config.custoInstalacao / config.prazoContratoMeses) * 12;
      const taxaAno = inv > 0 ? (deprecAno / inv * 100) : 0;
      return `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px 14px;font-size:11px;color:#92400e;margin-bottom:10px;">
        Visão conservadora: considera a perda de valor do investimento ao longo do tempo.
        Depreciação linear: <strong>${brl(deprecAno)}/ano</strong> — equivale a <strong>${taxaAno.toFixed(1)}% ao ano</strong> sobre o investimento total de <strong>${brl(inv)}</strong>.
      </div>`;
    })()}
    <div class="kpi-grid">
      ${kpiCard('Payback Eco.', `${results.paybackMesesEconomico} meses`, 'C/ reserva de reposição', '#d97706')}
      ${kpiCard('ROI Eco.', pct(results.roiPercentEconomico), 'Visão contábil', results.roiPercentEconomico >= 0 ? '#059669' : '#dc2626')}
      ${kpiCard('VPL Eco.', brl(results.vplEconomico), 'C/ depreciação', results.vplEconomico >= 0 ? '#059669' : '#dc2626')}
      ${kpiCard('TIR Eco.', pct(results.tirEconomica), 'Visão contábil', '#2563eb')}
      ${kpiCard('Margem Eco.', pct(results.margemMediaEconomica), 'Média ' + config.horizonteAnos + ' anos', '#7c3aed')}
      ${kpiCard('Valor Residual', brl(results.valorResidualFinal), 'Equipamento ao final', '#ea580c')}
    </div>
  `)}

  <!-- ── PREMISSAS: INFRAESTRUTURA ─────────────── -->
  ${section('Premissas — Infraestrutura e Investimento', `
    <table>
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:40%;">Premissa</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:25%;">Valor</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Observação</th>
        </tr>
      </thead>
      <tbody>
        ${premissaRow('Investimento total (capex)', brl(config.custoEquipamento + config.custoInstalacao), 'Inclui equipamentos, obra civil, elétrica, projeto, licenças e alvará')}
        ${premissaRow('Carregadores DC (carga rápida)', `${config.dcChargers} unid. · ${config.potenciaDC} kW`, `Tempo médio de recarga: ~${Math.round(20 / config.potenciaDC * 60)} min para 20 kWh`)}
        ${config.acChargers > 0 ? premissaRow('Carregadores AC (carga lenta)', `${config.acChargers} unid. · ${config.potenciaAC} kW`, 'Ideal para híbridos plug-in e permanência longa') : ''}
        ${premissaRow('Mercado de energia', config.mercadoLivre ? 'Mercado Livre' : 'Mercado Cativo', config.mercadoLivre ? 'Contrato direto com geradora — custo reduzido' : 'Distribuição convencional (ANEEL)')}
      </tbody>
    </table>
  `)}

  <!-- ── PREMISSAS: UTILIZAÇÃO ─────────────────── -->
  ${section('Premissas — Utilização e Demanda', `
    <table>
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:40%;">Premissa</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:25%;">Valor</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Observação</th>
        </tr>
      </thead>
      <tbody>
        ${(() => {
          // Use the plateau values from config — may be auto-computed or manually overridden by user
          const maxDC = config.platoDCDia;
          const maxAC = config.platoACDia;
          const sessaoDCMin = config.potenciaDC > 0 ? Math.round((config.recargaMediaDC / config.potenciaDC) * 60 + 10) : 0;
          const sessaoACMin = config.potenciaAC > 0 ? Math.round((config.recargaMediaAC / config.potenciaAC) * 60 + 10) : 0;
          return `
            ${premissaRow('Horário de operação', `${config.horasAbertura} horas/dia`, 'Define o teto físico diário — crescimento da demanda é travado neste limite')}
            ${maxDC > 0 ? premissaRow('Platô máximo DC', `${maxDC} sessões/dia`, `${sessaoDCMin} min/sessão (${config.recargaMediaDC} kWh ÷ ${config.potenciaDC} kW + 10 min troca) × ${config.dcChargers} carregador${config.dcChargers > 1 ? 'es' : ''}`) : ''}
            ${maxAC > 0 ? premissaRow('Platô máximo AC', `${maxAC} sessões/dia`, `${sessaoACMin} min/sessão (${config.recargaMediaAC} kWh ÷ ${config.potenciaAC} kW + 10 min troca) × ${config.acChargers} carregador${config.acChargers > 1 ? 'es' : ''}`) : ''}
            ${premissaRow('Recargas DC/dia (Ano 1)', `${num(config.recargasDCDiaAno1, 1)} sessões/dia`, `${num(config.recargasDCDiaAno1 * 365)} sessões/ano — cresce ${pct(config.crescimentoAnual)} a.a. até o platô de ${maxDC} sess./dia`)}
            ${config.acChargers > 0 ? premissaRow('Recargas AC/dia (Ano 1)', `${num(config.recargasACDiaAno1, 1)} sessões/dia`, `${num(config.recargasACDiaAno1 * 365)} sessões/ano — platô de ${maxAC} sess./dia`) : ''}
            ${premissaRow('Energia média/sessão DC', `${config.recargaMediaDC} kWh`, 'Carga parcial típica — veículo raramente chega zerado')}
            ${config.acChargers > 0 ? premissaRow('Energia média/sessão AC', `${config.recargaMediaAC} kWh`, 'Sessão mais curta — bateria de híbrido geralmente menor') : ''}
            ${premissaRow('Total sessões Ano 1', `${num((config.recargasDCDiaAno1 + config.recargasACDiaAno1) * 365)} sessões`, `Energia total: ${num((config.recargasDCDiaAno1 * 365 * config.recargaMediaDC) + (config.recargasACDiaAno1 * 365 * config.recargaMediaAC))} kWh/ano`)}
          `;
        })()}
      </tbody>
    </table>
  `)}

  <!-- ── PREMISSAS: RECEITA ─────────────────────── -->
  ${section('Premissas — Precificação e Receita', `
    <table>
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:40%;">Premissa</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:25%;">Valor</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Observação</th>
        </tr>
      </thead>
      <tbody>
        ${premissaRow('Preço cobrado DC (por kWh)', `R$ ${config.precoDC.toFixed(2)}/kWh`, 'Carga rápida tem valor percebido maior — justifica preço premium')}
        ${config.acChargers > 0 && config.precoAC > 0 ? premissaRow('Preço cobrado AC (por kWh)', `R$ ${config.precoAC.toFixed(2)}/kWh`, 'Carga lenta — preço menor, sessão mais longa') : ''}
        ${premissaRow('Taxa de ativação por sessão', `R$ ${config.taxaAtivacao.toFixed(2)}/sessão`, 'Cobrada em toda sessão — cobre custos fixos de transação na plataforma')}
        ${premissaRow('Faturamento bruto mensal (Ano 1)', brl(results.receitaMensalAno1), y1 ? `DC: ${brl(y1.receitaDC / 12)} + AC: ${brl(y1.receitaAC / 12)} + Ativação: ${brl(y1.receitaAtivacao / 12)}` : '')}
      </tbody>
    </table>
  `)}

  <!-- ── PREMISSAS: CUSTOS ──────────────────────── -->
  ${section('Premissas — Estrutura de Custos', `
    <table>
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:40%;">Premissa</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:25%;">Valor</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Observação</th>
        </tr>
      </thead>
      <tbody>
        ${premissaRow('Custo de energia', `R$ ${config.custoKwh.toFixed(2)}/kWh (+ ${config.perdasEnergia}% perdas técnicas)`, config.mercadoLivre ? 'Mercado Livre — contrato direto com geradora' : 'Mercado Cativo — tarifa regulada pela distribuidora')}
        ${premissaRow('Retenção de plataforma (TUPI)', `${config.retencaoPct}% da receita${config.mensalidadeMensal > 0 ? ` + ${brl(config.mensalidadeMensal)}/mês` : ''}`, 'Plataforma digital de carregamento: app, monitoramento 24/7, suporte ao motorista e gestão remota')}
        ${premissaRow('Royalties PlugFácil', `${config.royaltiesPct}% da receita`, 'Contrapartida pelo uso da marca, rede de franquias, know-how operacional e suporte comercial')}
        ${config.taxaFranquiaMensal > 0
          ? premissaRow('Taxa de Franquia PlugFácil', `${brl(config.taxaFranquiaMensal)}/mês`, 'Mensalidade pelo direito de uso da franquia PlugFácil')
          : premissaRow('Taxa de Franquia PlugFácil', 'A definir', 'Futura taxa de franquia PlugFácil — a ser estabelecida')}
        ${premissaRow('Impostos sobre receita', `${config.impostosPct}% da receita`, 'Estimativa de PIS/COFINS/ISS — varia conforme o regime tributário adotado')}
        ${premissaRow('Reserva de manutenção', `${config.provisionamentoPct}% da receita`, 'Provisionamento para manutenção preventiva, peças e imprevistos operacionais')}
        ${y1 ? premissaRow('Custo operacional total (Ano 1)', brl(y1.custoTotal), `Energia: ${brl(y1.custoEnergia)} · Plataforma: ${brl(y1.retencaoPlataforma)} · Royalties: ${brl(y1.royalties)} · Impostos: ${brl(y1.impostos)} · Manutenção: ${brl(y1.provisionamento)}${y1.taxaFranquiaAno > 0 ? ` · Franquia: ${brl(y1.taxaFranquiaAno)}` : ''}`) : ''}
      </tbody>
    </table>
  `)}

  <!-- ── PREMISSAS: DEPRECIAÇÃO ────────────────── -->
  ${section('Premissas — Depreciação do Investimento', `
    <table>
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:40%;">Premissa</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:25%;">Valor</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Observação</th>
        </tr>
      </thead>
      <tbody>
        ${(() => {
          const inv = config.custoEquipamento + config.custoInstalacao;
          const deprecAno = (config.custoEquipamento / config.vidaUtilMeses + config.custoInstalacao / config.prazoContratoMeses) * 12;
          const taxaAno = inv > 0 ? (deprecAno / inv * 100) : 0;
          const deprecMes = deprecAno / 12;
          return `
            ${premissaRow('Investimento total depreciado', brl(inv), 'Base de cálculo da depreciação linear')}
            ${premissaRow('Depreciação anual', `${brl(deprecAno)}/ano (${taxaAno.toFixed(1)}% ao ano)`, 'Encargo econômico — não impacta o caixa, representa o consumo do investimento')}
            ${premissaRow('Depreciação mensal', `${brl(deprecMes)}/mês`, `${brl(deprecAno)}/ano ÷ 12 meses`)}
            ${premissaRow('Valor residual ao final', brl(results.valorResidualFinal), `Valor contábil remanescente no ano ${config.horizonteAnos}`)}
          `;
        })()}
      </tbody>
    </table>
  `)}

  <!-- ── PREMISSAS: FINANCEIRAS ─────────────────── -->
  ${section('Premissas — Parâmetros Financeiros', `
    <table>
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:40%;">Premissa</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;width:25%;">Valor</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;">Observação</th>
        </tr>
      </thead>
      <tbody>
        ${premissaRow('Horizonte de análise', `${config.horizonteAnos} anos`, 'Período de projeção do retorno do investimento')}
        ${premissaRow('Taxa mínima de atratividade (TMA)', pct(config.taxaDescontoAnual), 'CDI + prêmio de risco do negócio — custo de oportunidade do capital')}
        ${premissaRow('Taxa CDI (comparação)', pct(config.taxaCDI), 'Referência de renda fixa usada na comparação patrimonial — CDI/SELIC estimado')}
        ${premissaRow('Critério VPL', 'Fluxo de caixa descontado', 'VPL positivo = retorno supera a TMA — capital trabalha melhor no eletroposto do que em renda fixa')}
        ${premissaRow('Critério TIR', 'Bisseção numérica', 'Taxa que zera o VPL — TIR > TMA indica projeto economicamente viável')}
        ${premissaRow('Critério Payback', 'Granularidade mensal', 'Mês exato em que o fluxo acumulado cobre o investimento inicial')}
      </tbody>
    </table>
  `)}

  <!-- ── COMPARAÇÃO CDI ───────────────────────────── -->
  ${section('Comparação com Renda Fixa (CDI)', `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:11px;color:#92400e;margin-bottom:14px;">
      <strong>Metodologia:</strong> cada ano, o lucro líquido gerado pelo eletroposto é reinvestido no CDI pelo restante do período.
      O patrimônio final inclui todos esses juros acumulados mais o valor residual do equipamento.
      O cenário CDI considera o capital inicial de ${brl(config.custoEquipamento + config.custoInstalacao)} aplicado
      integralmente a ${pct(config.taxaCDI)} a.a. durante ${config.horizonteAnos} anos — sem tocar no principal.
    </div>
    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);">
      ${kpiCard(`Patrimônio eletroposto (Ano ${config.horizonteAnos})`, brl(results.patrimonioEletropostoFinal), `Saldo CDI dos lucros + valor residual do equipamento (${brl(results.valorResidualFinal)})`, '#059669')}
      ${kpiCard(`CDI puro (Ano ${config.horizonteAnos})`, brl(results.patrimonioCDIPuroFinal), `${brl(config.custoEquipamento + config.custoInstalacao)} a ${pct(config.taxaCDI)} a.a. por ${config.horizonteAnos} anos`, '#d97706')}
      ${kpiCard(
        results.ganhoSobreCDI >= 0 ? 'Vantagem do eletroposto' : 'Desvantagem vs. CDI',
        (results.ganhoSobreCDI >= 0 ? '+' : '') + brl(results.ganhoSobreCDI),
        results.ganhoSobreCDI >= 0
          ? `O eletroposto superou o CDI em ${brl(results.ganhoSobreCDI)}`
          : `O CDI superou o eletroposto em ${brl(Math.abs(results.ganhoSobreCDI))}`,
        results.ganhoSobreCDI >= 0 ? '#059669' : '#dc2626'
      )}
    </div>
    <p style="font-size:11px;color:#6b7280;margin:10px 0 8px;">
      Saldo real na conta — começa em R$&nbsp;0,00 no D0. Cada ano: saldo anterior rende CDI, depois deposita o lucro líquido do eletroposto.
    </p>
    <table>
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="padding:7px 10px;text-align:center;font-size:11px;color:#6b7280;font-weight:600;">Ano</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;color:#6b7280;font-weight:600;">Lucro líquido</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;color:#059669;font-weight:600;">Saldo na conta (CDI)</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;color:#d97706;font-weight:600;">CDI puro</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;color:#6b7280;font-weight:600;">Diferença</th>
        </tr>
      </thead>
      <tbody>
        ${results.yearly.map((y, i) => {
          const diff = y.patrimonioEletropostoAcum - y.patrimonioCDIPuroAcum;
          return `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'};">
              <td style="padding:6px 10px;text-align:center;font-size:12px;color:#374151;">Ano ${y.ano}</td>
              <td style="padding:6px 10px;text-align:right;font-size:12px;color:#374151;">${brl(y.lucroLiquido)}</td>
              <td style="padding:6px 10px;text-align:right;font-size:12px;color:#059669;font-weight:600;">${brl(y.patrimonioEletropostoAcum)}</td>
              <td style="padding:6px 10px;text-align:right;font-size:12px;color:#d97706;font-weight:600;">${brl(y.patrimonioCDIPuroAcum)}</td>
              <td style="padding:6px 10px;text-align:right;font-size:12px;font-weight:600;color:${diff >= 0 ? '#059669' : '#dc2626'};">${diff >= 0 ? '+' : ''}${brl(diff)}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>
  `)}

  <!-- ── PROJEÇÃO ANUAL ─────────────────────────── -->
  ${section('Projeção Anual Detalhada', `
    <table>
      <thead>
        <tr style="background:#00B386;color:#fff;">
          <th style="padding:8px 10px;text-align:center;font-size:11px;font-weight:700;">Ano</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;">Sessões/dia</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;">Faturamento</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;">Custos op.</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;">Lucro (caixa)</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;">Lucro (econômico)</th>
        </tr>
      </thead>
      <tbody>
        ${results.yearly.map((y, i) => `
          <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'};">
            <td style="padding:7px 10px;text-align:center;font-weight:600;font-size:12px;">Ano ${y.ano}</td>
            <td style="padding:7px 10px;text-align:right;font-size:12px;color:#374151;">
              ${y.recargasDCDia > 0 ? `${num(y.recargasDCDia, 1)} DC` : ''}${y.recargasDCDia > 0 && y.recargasACDia > 0 ? ' + ' : ''}${y.recargasACDia > 0 ? `${num(y.recargasACDia, 1)} AC` : ''}
            </td>
            <td style="padding:7px 10px;text-align:right;font-size:12px;color:#059669;font-weight:600;">${brl(y.receitaTotal)}</td>
            <td style="padding:7px 10px;text-align:right;font-size:12px;color:#dc2626;">${brl(y.custoTotal)}</td>
            <td style="padding:7px 10px;text-align:right;font-size:12px;font-weight:600;">${brl(y.lucroLiquido)}</td>
            <td style="padding:7px 10px;text-align:right;font-size:12px;font-weight:600;color:${y.lucroLiquidoEconomico >= 0 ? '#ea580c' : '#dc2626'};">${brl(y.lucroLiquidoEconomico)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  `)}

  <!-- ── RENDIMENTO MENSAL ────────────────────────── -->
  ${(() => {
    const inv = config.custoEquipamento + config.custoInstalacao;
    const meses = config.horizonteAnos * 12;
    const lucroMensalMedio = results.yearly.reduce((s: number, y: any) => s + y.lucroLiquido, 0) / meses;
    const jurosCDITotal = results.patrimonioCDIPuroFinal - inv;
    const rendimentoCDIMensalMedio = jurosCDITotal / meses;
    const vantagem = lucroMensalMedio - rendimentoCDIMensalMedio;
    return section(`Rendimento Mensal Médio: Eletroposto vs. CDI — média dos ${config.horizonteAnos} anos`, `
      <p style="font-size:11px;color:#6b7280;margin-bottom:10px;">
        CDI: total de juros gerados em ${config.horizonteAnos} anos ÷ ${meses} meses.
        Eletroposto: soma do lucro líquido de todos os anos ÷ ${meses} meses.
      </p>
      <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px;">
        ${kpiCard('CDI — rendimento médio/mês', brl(rendimentoCDIMensalMedio) + '/mês', `${brl(jurosCDITotal)} de juros em ${config.horizonteAnos} anos ÷ ${meses} meses — capital de ${brl(inv)} intacto`, '#d97706')}
        ${kpiCard('Eletroposto — lucro médio/mês', brl(lucroMensalMedio) + '/mês', `Média dos ${config.horizonteAnos} anos — começa menor, cresce com a demanda`, '#059669')}
        ${kpiCard(
          vantagem >= 0 ? 'Vantagem do eletroposto' : 'CDI supera o eletroposto',
          (vantagem >= 0 ? '+' : '') + brl(vantagem) + '/mês',
          vantagem >= 0
            ? `Na média dos ${config.horizonteAnos} anos, o eletroposto rende ${brl(vantagem)}/mês a mais que o CDI`
            : `Na média dos ${config.horizonteAnos} anos, o CDI ainda supera — revise utilização ou preços`,
          vantagem >= 0 ? '#059669' : '#dc2626'
        )}
      </div>
      <p style="font-size:11px;color:#6b7280;">
        O CDI preserva o capital de ${brl(inv)} integralmente ao final dos ${config.horizonteAnos} anos. No eletroposto, o capital é convertido em ativo produtivo que gera renda operacional mensal crescente — o lucro do Ano 1 é menor que a média, mas cresce conforme a demanda aumenta até o platô.
      </p>
    `);
  })()}

  <!-- ── DISCLAIMER ─────────────────────────────── -->
  <div class="footer">
    <p style="margin-bottom:4px;">
      Esta análise é uma <strong>projeção financeira baseada exclusivamente nas premissas declaradas acima</strong> e não constitui garantia de retorno.
      Resultados reais dependem da localização do ponto, fluxo local de veículos elétricos, mix de clientes e condições de mercado ao longo do período.
    </p>
    <p>PlugFácil © ${new Date().getFullYear()} &nbsp;·&nbsp; Simulador Financeiro de Franquias &nbsp;·&nbsp; Documento gerado em ${hoje}</p>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
