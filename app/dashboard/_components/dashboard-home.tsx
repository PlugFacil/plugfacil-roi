'use client';
import { motion } from 'framer-motion';
import {
  Zap, ArrowRight, Star, Shield, Clock,
  Users, Smartphone, CreditCard, ShoppingCart, Check, ChevronRight,
  Wifi
} from 'lucide-react';
import Link from 'next/link';
import { getModelos, formatCurrency, type ModeloFranquia } from '@/lib/financial-engine';
import { getAllMetadata, type ModelMetadata } from '@/lib/model-metadata';

export default function DashboardHome() {
  const modelos = getModelos();
  const allMeta = getAllMetadata();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-accent p-8 md:p-10 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-medium text-white/80 uppercase tracking-wide">Ferramenta de Vendas</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-3">Simulador Financeiro PlugFácil</h1>
          <p className="text-white/80 mb-2 max-w-2xl text-lg">
            Você transforma <strong>fluxo de pessoas</strong> em <strong>receita recorrente</strong> com energia.
          </p>
          <p className="text-white/60 mb-6 max-w-xl text-sm">
            Franquia de eletropostos 100% digital, sem custo fixo, sem funcionários. Gestão completa via app TUPI.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/simulacao"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              <Zap className="w-5 h-5" />
              Iniciar Simulação
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/comparativo"
              className="inline-flex items-center gap-2 bg-white/15 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/25 transition border border-white/20"
            >
              Comparar Modelos
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Comparação CDI vs Eletroposto - DESTAQUE PRINCIPAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-2xl p-8 border border-green-500/30 bg-gradient-to-r from-green-500/5 to-transparent"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CDI */}
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2 uppercase tracking-wide">Seguro, Previsível</p>
            <h3 className="text-gray-300 font-semibold mb-1">CDI / CDB</h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-300">0.84%</p>
              <p className="text-xs text-gray-500">por mês</p>
              <div className="h-px bg-gray-700 my-2"></div>
              <p className="text-xl font-bold text-gray-300">10.5%</p>
              <p className="text-xs text-gray-500">por ano</p>
            </div>
          </div>

          {/* Arrow / Comparison */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="hidden md:block text-gray-500">🔄</div>
            <p className="text-xs text-gray-500 text-center">Investidor inteligente</p>
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-green-500/50 to-transparent hidden md:block"></div>
          </div>

          {/* Eletroposto PlugFácil */}
          <div className="text-center bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-4">
            <p className="text-green-400 text-sm mb-2 uppercase tracking-wide font-semibold">⚡ 3x Maior</p>
            <h3 className="text-green-300 font-semibold mb-1">Eletroposto PlugFácil</h3>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-green-400">2.6%</p>
              <p className="text-xs text-gray-400">por mês</p>
              <div className="h-px bg-green-500/30 my-2"></div>
              <p className="text-2xl font-bold text-green-400">31%</p>
              <p className="text-xs text-gray-400">por ano</p>
            </div>
          </div>
        </div>

        {/* Bottom insight */}
        <div className="mt-6 pt-6 border-t border-green-500/20">
          <p className="text-gray-400 text-sm text-center">
            <strong className="text-green-400">Em 10 anos:</strong> R$97k investido no eletroposto rende <strong className="text-white">R$931k</strong> vs <strong className="text-gray-500">R$326k no CDI</strong>. Diferença: <strong className="text-green-400">+R$605k</strong>
          </p>
        </div>
      </motion.div>

      {/* Diferenciais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Wifi, label: 'Operação 100% Digital', value: 'Zero burocracia', color: 'emerald' },
          { icon: Users, label: 'Sem Funcionários', value: 'Custo fixo zero', color: 'blue' },
          { icon: ShoppingCart, label: 'Consumo no Local', value: '91%', desc: 'dos usuários', color: 'amber' },
          { icon: Smartphone, label: 'Gestão via App', value: 'TUPI', color: 'purple' },
        ].map((h: any, i: number) => {
          const Icon = h.icon;
          const colorMap: Record<string, string> = {
            emerald: 'bg-emerald-500/15 text-emerald-400',
            blue: 'bg-blue-500/15 text-blue-400',
            amber: 'bg-amber-500/15 text-amber-400',
            purple: 'bg-purple-500/15 text-purple-400',
          };
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-xl p-4 hover:bg-white/10 transition"
            >
              <div className={`w-10 h-10 rounded-lg ${colorMap[h.color]} flex items-center justify-center mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-lg font-bold text-white">{h.value}</p>
              {h.desc && <p className="text-xs text-gray-500">{h.desc}</p>}
              <p className="text-xs text-gray-500 mt-0.5">{h.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Insight principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 border border-emerald-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">🔥 Receita Oculta — 91% consomem no local</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              O eletroposto <strong className="text-white">não vende energia — ele traz cliente</strong>. Restaurantes vendem mais, postos vendem mais combustível, shoppings aumentam o ticket médio. É uma máquina de gerar fluxo e receita recorrente.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Escada de Valor */}
      <div>
        <h2 className="text-lg font-bold text-white mb-1">🚀 Escada de Valor</h2>
        <p className="text-gray-500 text-sm mb-4">Do modelo de entrada ao máximo retorno</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {allMeta.map((meta: ModelMetadata, i: number) => {
            const modelo = modelos?.find((m: ModeloFranquia) => m?.modelo === meta.jsonName);
            return (
              <motion.div
                key={meta.jsonName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className={`glass rounded-xl p-4 border ${meta.colorBorder} hover:bg-white/10 transition group relative`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <h3 className={`font-bold ${meta.colorText}`}>{meta.displayName}</h3>
                </div>
                <p className="text-gray-500 text-xs mb-3">{meta.tagline}</p>
                <div className="space-y-1.5 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Investimento</span>
                    <span className="text-white font-semibold">{formatCurrency(modelo?.investimento ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Faturamento</span>
                    <span className="text-emerald-400 font-medium">{meta.faturamentoAprox}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retorno</span>
                    <span className="text-amber-400 font-medium">{meta.roiAprox}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Carregadores</span>
                    <span className="text-white text-[10px]">{meta.carregadores}</span>
                  </div>
                </div>
                {/* Atende */}
                <div className="space-y-1 mb-3">
                  {meta.atende.slice(0, 2).map((a: string, j: number) => (
                    <div key={j} className="flex items-center gap-1 text-xs">
                      <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="text-gray-400 truncate">{a}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${meta.colorText}`}>{meta.escadaValor}</span>
                  <Link
                    href={`/dashboard/simulacao?modelo=${encodeURIComponent(meta.jsonName)}`}
                    className="text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Precificação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" /> Precificação por Tipo de Carga
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { tipo: 'AC 7 kW', preco: 'R$ 1,95/kWh', vel: 'Lento (~4h)', desc: 'Para híbridos plug-in', color: 'bg-green-500/15 text-green-400' },
            { tipo: 'DC 30–40 kW', preco: 'R$ 2,25/kWh', vel: 'Rápido (~35min)', desc: 'Para elétricos', color: 'bg-blue-500/15 text-blue-400' },
            { tipo: 'DC 80–120 kW', preco: 'R$ 2,50/kWh', vel: 'Ultra-rápido (~20min)', desc: 'Quanto mais rápido, mais caro', color: 'bg-red-500/15 text-red-400' },
          ].map((p: any, i: number) => (
            <div key={i} className={`rounded-xl p-4 border border-white/5 ${i === 2 ? 'ring-1 ring-red-500/30' : ''}`}>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${p.color}`}>
                <Zap className="w-3 h-3" /> {p.tipo}
              </div>
              <p className="text-2xl font-bold text-white mb-1">{p.preco}</p>
              <p className="text-gray-500 text-xs">{p.vel}</p>
              <p className="text-gray-600 text-xs mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3 italic">
          ⚡ Justificativa: quanto mais rápido o carregamento, menos tempo parado — por isso cobra mais.
        </p>
      </motion.div>

      {/* Estratégia Cartão */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass rounded-2xl p-6 border border-amber-500/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">💳 Estratégia de Venda: Cartão</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              <strong className="text-white">“Você não precisa investir à vista”</strong> — parcelamento em até <strong className="text-amber-400">18x no cartão</strong>. O franqueado começa a faturar enquanto paga. Fluxo de caixa leve, milhas do cartão e ROI percebido muito melhor.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Shield, title: 'Análise Completa', desc: 'ROI, Payback, VPL, TIR e margem de lucro em uma única simulação.' },
          { icon: Star, title: '3 Cenários', desc: 'Conservador, Base e Otimista para apresentações transparentes ao prospect.' },
          { icon: Clock, title: 'Projeção 10 Anos', desc: 'Visão de longo prazo com fluxo de caixa anual detalhado.' },
        ].map((f: any, i: number) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass rounded-xl p-6 hover:bg-white/10 transition"
            >
              <Icon className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Frase final */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-6"
      >
        <p className="text-gray-600 text-xs uppercase tracking-widest mb-2">Posicionamento</p>
        <p className="text-white text-lg md:text-xl font-bold max-w-2xl mx-auto">
          “Você está comprando uma <span className="text-emerald-400">máquina de gerar fluxo</span> e <span className="text-emerald-400">receita recorrente</span>”
        </p>
      </motion.div>
    </div>
  );
}
