'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Battery, Zap, Search, Check, AlertTriangle, Info } from 'lucide-react';
import { getVeiculos, type Veiculo } from '@/lib/veiculos-data';
import { getModelos, type ModeloFranquia } from '@/lib/financial-engine';
import { getModelMetadata } from '@/lib/model-metadata';

export default function VeiculosClient() {
  const veiculos = getVeiculos();
  const modelos = getModelos();
  const [filter, setFilter] = useState<'todos' | 'eletrico' | 'hibrido_plugin'>('todos');
  const [search, setSearch] = useState('');

  const filtered = (veiculos ?? []).filter((v: Veiculo) => {
    if (filter !== 'todos' && v?.tipo !== filter) return false;
    if (search && !(v?.modelo ?? '')?.toLowerCase?.()?.includes?.(search?.toLowerCase?.())) return false;
    return true;
  });

  // Check compatibility of a vehicle with a model
  const isCompatible = (v: Veiculo, m: ModeloFranquia) => {
    const hasDC = (m?.carregadores?.dc ?? 0) > 0;
    const hasAC = (m?.carregadores?.ac ?? 0) > 0;
    const canDC = hasDC && (v?.dc_max_kw ?? 0) > 0;
    const canAC = hasAC;
    return canDC || canAC;
  };

  const getBestChargeType = (v: Veiculo) => {
    if ((v?.dc_max_kw ?? 0) > 0) return 'DC';
    return 'AC';
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Car className="w-6 h-6 text-emerald-400" /> Veículos Compatíveis
        </h1>
        <p className="text-gray-500 text-sm mt-1">Veículos elétricos e híbridos compatíveis com as estações PlugFácil.</p>
      </motion.div>

      {/* Mix de carros insight */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-bold text-sm mb-1">🔥 Mix de Carros no Brasil</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-amber-500/10 rounded-lg p-2">
                <p className="text-amber-400 font-bold">Híbridos (BYD Song)</p>
                <p className="text-gray-500">Precisa: AC</p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-2">
                <p className="text-blue-400 font-bold">Elétrico Básico</p>
                <p className="text-gray-500">Precisa: DC 30+</p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-2">
                <p className="text-purple-400 font-bold">Elétrico Premium</p>
                <p className="text-gray-500">Precisa: DC 80+</p>
              </div>
            </div>
            <p className="text-emerald-400 text-xs mt-2 font-medium">O modelo Pro atende todos. O Hub maximiza o giro.</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition text-sm"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'eletrico', label: '⚡ Elétricos' },
            { key: 'hibrido_plugin', label: '🔌 Híbridos' },
          ].map((f: any) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.key
                  ? 'gradient-accent text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(filtered ?? []).map((v: Veiculo, i: number) => (
          <motion.div
            key={v?.modelo ?? i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5 hover:bg-white/10 transition group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  v?.tipo === 'eletrico' ? 'bg-blue-500/20' : 'bg-amber-500/20'
                }`}>
                  {v?.tipo === 'eletrico'
                    ? <Zap className="w-5 h-5 text-blue-400" />
                    : <Battery className="w-5 h-5 text-amber-400" />}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{v?.modelo ?? 'N/A'}</h3>
                  <span className={`text-xs ${v?.tipo === 'eletrico' ? 'text-blue-400' : 'text-amber-400'}`}>
                    {v?.tipo === 'eletrico' ? 'Elétrico' : 'Híbrido Plug-in'}
                  </span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getBestChargeType(v) === 'DC' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                {getBestChargeType(v)}
              </span>
            </div>

            {/* Specs highlights */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Bateria</p>
                <p className="text-white font-bold text-sm">{v?.bateria_kwh ?? 0}</p>
                <p className="text-gray-500 text-[10px]">kWh</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Carga AC</p>
                <p className="text-green-400 font-bold text-sm">{v?.ac_max_kw ?? 0}</p>
                <p className="text-gray-500 text-[10px]">kW máx</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Carga DC</p>
                <p className={`font-bold text-sm ${(v?.dc_max_kw ?? 0) > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                  {(v?.dc_max_kw ?? 0) > 0 ? v.dc_max_kw : '—'}
                </p>
                <p className="text-gray-500 text-[10px]">{(v?.dc_max_kw ?? 0) > 0 ? 'kW máx' : 'N/A'}</p>
              </div>
            </div>
            {/* Battery bar */}
            <div className="mb-4">
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(((v?.bateria_kwh ?? 0) / 90) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Compatibilidade rápida */}
            <div className="border-t border-white/5 pt-3">
              <p className="text-gray-600 text-[10px] uppercase tracking-wide mb-1.5">Compatível com:</p>
              <div className="flex flex-wrap gap-1">
                {(modelos ?? []).map((m: ModeloFranquia) => {
                  const mt = getModelMetadata(m?.modelo ?? '');
                  const ok = isCompatible(v, m);
                  return (
                    <span key={m?.modelo} className={`text-[10px] px-1.5 py-0.5 rounded ${ok ? mt.colorBg + ' ' + mt.colorText : 'bg-white/5 text-gray-600 line-through'}`}>
                      {mt.displayName}
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {(filtered?.length ?? 0) === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum veículo encontrado.</p>
        </div>
      )}
    </div>
  );
}
