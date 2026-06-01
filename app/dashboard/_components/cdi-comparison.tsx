'use client';
import { motion } from 'framer-motion';

export function CDIComparison() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-2xl p-8 border border-green-500/30 bg-gradient-to-r from-green-500/5 to-transparent mb-8"
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
  );
}
