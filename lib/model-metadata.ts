// Business intelligence metadata for each franchise model
// Maps JSON model names to display names and business insights

export interface ModelMetadata {
  jsonName: string;
  displayName: string;
  color: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  emoji: string;
  tagline: string;
  investimentoAprox: string;
  faturamentoAprox: string;
  roiAprox: string;
  perfil: string[];
  limitacoes: string[];
  insight: string;
  fraseVenda: string;
  carregadores: string;
  atende: string[];
  naoAtende: string[];
  escadaValor: string;
  ordem: number;
}

export const MODEL_METADATA: Record<string, ModelMetadata> = {
  Essencial: {
    jsonName: 'Essencial',
    displayName: 'Essencial',
    color: '#22C55E',
    colorBg: 'bg-green-500/15',
    colorText: 'text-green-400',
    colorBorder: 'border-green-500/30',
    emoji: '🟢',
    tagline: 'Entrada no mercado EV',
    investimentoAprox: '~R$23k',
    faturamentoAprox: '~R$2k/mês',
    roiAprox: '~3 anos',
    perfil: ['Hotéis e pousadas', 'Estacionamentos', 'Condomínios'],
    limitacoes: ['Apenas cargas lentas (AC)', 'Baixo faturamento mensal'],
    insight: 'Ideal para atrair clientes com tempo de permanência longo. O carro carrega enquanto o cliente aproveita o local.',
    fraseVenda: 'Comece a atrair o público EV com baixo investimento',
    carregadores: '2x AC 7 kW',
    atende: ['Híbridos plug-in (BYD Song, King)'],
    naoAtende: ['Elétricos puros (carga lenta demais)'],
    escadaValor: 'Atrai clientes',
    ordem: 1,
  },
  Basico: {
    jsonName: 'Basico',
    displayName: 'Start',
    color: '#3B82F6',
    colorBg: 'bg-blue-500/15',
    colorText: 'text-blue-400',
    colorBorder: 'border-blue-500/30',
    emoji: '🔵',
    tagline: 'DC básico para começar a faturar',
    investimentoAprox: '~R$65k',
    faturamentoAprox: '~R$7k/mês',
    roiAprox: '~2,5 anos',
    perfil: ['Restaurantes', 'Mercados', 'Postos de combustível'],
    limitacoes: ['Não atende híbridos (sem AC)', 'Fluxo médio de carros'],
    insight: 'Primeiro passo para receita recorrente real com carga rápida. Ideal para locais com fluxo de elétricos puros.',
    fraseVenda: 'Comece a faturar com carga rápida DC',
    carregadores: '1x DC 30 kW',
    atende: ['Elétricos puros (Dolphin, Yuan Plus, Ora 03)'],
    naoAtende: ['Híbridos plug-in (sem porta AC)'],
    escadaValor: 'Começa a faturar',
    ordem: 2,
  },
  Padrao: {
    jsonName: 'Padrao',
    displayName: 'Pro',
    color: '#EAB308',
    colorBg: 'bg-yellow-500/15',
    colorText: 'text-yellow-400',
    colorBorder: 'border-yellow-500/30',
    emoji: '🟡',
    tagline: 'Modelo ideal — atende TODOS os carros',
    investimentoAprox: '~R$85k',
    faturamentoAprox: '~R$9.5k/mês',
    roiAprox: '~2,5 anos',
    perfil: ['Shoppings', 'Centros comerciais', 'Postos premium', 'Restaurantes de alto fluxo'],
    limitacoes: [],
    insight: 'O melhor equilíbrio do mercado. Atende 100% dos veículos: híbridos no AC e elétricos no DC. Nenhum cliente fica sem carga.',
    fraseVenda: 'Não é sobre potência — é sobre atender TODOS os clientes',
    carregadores: '1x AC 7 kW + 1x DC 40 kW',
    atende: ['Híbridos plug-in (AC)', 'Elétricos puros (DC)'],
    naoAtende: [],
    escadaValor: 'Modelo ideal',
    ordem: 3,
  },
  Turbo: {
    jsonName: 'Turbo',
    displayName: 'Turbo',
    color: '#EF4444',
    colorBg: 'bg-red-500/15',
    colorText: 'text-red-400',
    colorBorder: 'border-red-500/30',
    emoji: '🔴',
    tagline: 'Alta performance + mercado livre',
    investimentoAprox: '~R$160k',
    faturamentoAprox: '~R$15.5k/mês',
    roiAprox: '~1,9 anos',
    perfil: ['Rodovias', 'Postos de grande fluxo', 'Centros logísticos'],
    limitacoes: [],
    insight: 'Entra no mercado livre de energia com custo ~R$0,40/kWh. A margem explode. DC 80kW carrega em 25 minutos.',
    fraseVenda: 'Escale seu faturamento com energia mais barata e carga ultra-rápida',
    carregadores: '2x AC 7 kW + 1x DC 80 kW',
    atende: ['Todos os híbridos (AC)', 'Todos os elétricos (DC ultra-rápido)'],
    naoAtende: [],
    escadaValor: 'Escala',
    ordem: 4,
  },
  Hub: {
    jsonName: 'Hub',
    displayName: 'Hub',
    color: '#8B5CF6',
    colorBg: 'bg-purple-500/15',
    colorText: 'text-purple-400',
    colorBorder: 'border-purple-500/30',
    emoji: '⚫',
    tagline: 'Máximo retorno — 2 carros ao mesmo tempo',
    investimentoAprox: '~R$215k',
    faturamentoAprox: '~R$22k/mês',
    roiAprox: '~1,7 anos',
    perfil: ['Hubs de recarga', 'Postos estratégicos em rodovias', 'Centros urbanos de alto fluxo'],
    limitacoes: [],
    insight: 'DC 120kW com 2 plugs carrega 2 carros ao mesmo tempo com distribuição inteligente. Ex: Carro A = 30kW + Carro B = 80kW. Mercado livre com custo mínimo.',
    fraseVenda: 'Maximize seu lucro com o maior giro e menor custo de energia',
    carregadores: '3x AC 7 kW + 1x DC 120 kW (2 plugs)',
    atende: ['Todos os veículos', '2 carros DC simultâneos'],
    naoAtende: [],
    escadaValor: 'Maximiza lucro',
    ordem: 5,
  },
};

export function getModelMetadata(jsonName: string): ModelMetadata {
  return MODEL_METADATA[jsonName] ?? MODEL_METADATA['Padrao'];
}

export function getDisplayName(jsonName: string): string {
  return MODEL_METADATA[jsonName]?.displayName ?? jsonName;
}

export function getAllMetadata(): ModelMetadata[] {
  return Object.values(MODEL_METADATA).sort((a, b) => a.ordem - b.ordem);
}

// Pricing info
export const PRICING = {
  ac_7kw: { preco: 1.95, label: 'AC 7 kW', velocidade: 'Lento' },
  dc_30_40kw: { preco: 2.25, label: 'DC 30–40 kW', velocidade: 'Rápido' },
  dc_ultra: { preco: 2.50, label: 'DC 80–120 kW', velocidade: 'Ultra-rápido' },
};

export const ENERGY_COSTS = {
  cativo: { min: 0.60, max: 0.80, label: 'Mercado Cativo' },
  livre: { value: 0.40, label: 'Mercado Livre' },
};

// Key selling stats
export const SELLING_STATS = {
  consumoLocal: 91, // 91% consomem no local
  operacaoDigital: true,
  semCustoFixo: true,
  semFuncionarios: true,
  receitaRecorrente: true,
  gestaoApp: 'TUPI',
};
