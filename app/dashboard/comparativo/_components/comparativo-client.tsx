'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  BarChart3, TrendingUp, DollarSign, Clock, Zap,
  Check, ArrowRight, Star, AlertTriangle
} from 'lucide-react';
import {
  getModelos, runSimulation, formatCurrency, formatPercent,
  type ModeloFranquia, type SimulationResults
} from '@/lib/financial-engine';
import { getModelMetadata, type ModelMetadata } from '@/lib/model-metadata';
import Link from 'next/link';
import { CDIComparison } from '../../_components/cdi-comparison';

const CompCharts = dynamic(() => import('./comp-charts'), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-500">Carregando gráficos...</div> });

export default function ComparativoClient() {
  const modelos = getModelos();
  const [cenario, setCenario] = useState<'pessimista' | 'base' | 'otimista'>('base');

  const allResults = useMemo(() => {
    return (modelos ?? []).map((m: ModeloFranquia) => {
      try {
        const r = runSimulation({
          modelo: m?.modelo ?? '',
          cenario,
          quantidadeEstacoes: 1,
        });
        return { modelo: m, results: r, meta: getModelMetadata(m?.modelo ?? '') };
      } catch {
        return null;
      }
    }).filter(Boolean) as { modelo: ModeloFranquia; results: SimulationResults; meta: ModelMetadata }[];
  }, [cenario]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" /> Comparativo de Modelos
        </h1>
        <p className="text-gray-500 text-sm mt-1">Compare investimento, faturamento, ROI e diferenciais de cada modelo.</p>
      </motion.div>

      {/* CDI Comparison */}
      <CDIComparison />

      {/* Cenário selector */}
      <div className="flex gap-2">
        {(['pessimista', 'base', 'otimista'] as const).map((c: string) => (
          <button
            key={c}
            onClick={() => setCenario(c as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              cenario === c
                ? 'gradient-accent text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {c === 'pessimista' ? 'Conservador' : c === 'base' ? 'Base (Realista)' : 'Otimista'}
          </button>
        ))}
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(allResults ?? []).map((item: any, i: number) => {
          const m = item?.modelo;
          const r = item?.results;
          const meta = item?.meta;
          const isRecommended = meta?.jsonName === 'Padrao';
          return (
            <motion.div
              key={m?.modelo ?? i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass rounded-2xl p-5 border ${meta?.colorBorder ?? 'border-white/10'} ${isRecommended ? 'ring-2 ring-yellow-500/40' : ''} hover:bg-white/5 transition relative`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" /> RECOMENDADO
                </div>
              )}
              <div className="flex items-center gap-2 mb-3 mt-1">
                <span className="text-xl">{meta?.emoji}</span>
                <div>
                  <h3 className={`font-bold text-lg ${meta?.colorText}`}>{meta?.displayName}</h3>
                  <p className="text-gray-500 text-xs">{meta?.tagline}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3">{meta?.carregadores}</p>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Investimento</p>
                  <p className="text-white font-bold text-sm">{formatCurrency(m?.investimento ?? 0)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Fat. mensal (Ano 1)</p>
                  <p className="text-emerald-400 font-bold text-sm">{formatCurrency(r?.receitaMensalAno1 ?? 0)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Payback</p>
                  <p className="text-amber-400 font-bold text-sm">{r?.paybackMeses ?? '-'} meses</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Lucro mensal (Ano 1)</p>
                  <p className="text-blue-400 font-bold text-sm">{formatCurrency(r?.lucroMensalAno1 ?? 0)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-500">VPL</p>
                  <p className={`font-bold text-sm ${(r?.vpl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(r?.vpl ?? 0)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-xs text-gray-500">TIR</p>
                  <p className="text-purple-400 font-bold text-sm">{formatPercent(r?.tir ?? 0)}</p>
                </div>
              </div>

              {/* Perfil */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1 font-medium">Perfil ideal:</p>
                <p className="text-gray-400 text-xs">{(meta?.perfil ?? []).join(', ')}</p>
              </div>

              {/* Atende / Não atende */}
              <div className="space-y-1 mb-3">
                {(meta?.atende ?? []).map((a: string, j: number) => (
                  <div key={j} className="flex items-center gap-1 text-xs">
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-400">{a}</span>
                  </div>
                ))}
                {(meta?.limitacoes ?? []).map((l: string, j: number) => (
                  <div key={j} className="flex items-center gap-1 text-xs">
                    <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="text-gray-500">{l}</span>
                  </div>
                ))}
              </div>

              {/* Insight */}
              <div className={`p-2 rounded-lg ${meta?.colorBg} mb-3`}>
                <p className="text-xs text-gray-300 italic">&ldquo;{meta?.fraseVenda}&rdquo;</p>
              </div>

              <Link
                href={`/dashboard/simulacao?modelo=${encodeURIComponent(m?.modelo ?? '')}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition"
              >
                Simular <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Why bigger models win */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6 border border-emerald-500/20"
      >
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" /> Por que modelos maiores ganham mais?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { text: 'Cobram mais caro (R$2,50)', icon: DollarSign },
            { text: 'Custo de energia menor', icon: Zap },
            { text: 'Atendem mais carros', icon: Check },
            { text: 'Giram mais rápido', icon: Clock },
            { text: 'Atendimento simultâneo', icon: Star },
          ].map((item: any, i: number) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-gray-400">{item.text}</span>
              </div>
            );
          })}
        </div>
        <p className="text-emerald-400 text-sm font-medium mt-3">
          Resultado: mais faturamento, mais margem, retorno mais rápido.
        </p>
      </motion.div>

      {/* Charts */}
      <CompCharts allResults={allResults} />
    </div>
  );
}
