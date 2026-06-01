'use client';
import dynamic from 'next/dynamic';
import { type SimulationResults } from '@/lib/financial-engine';

const ChartsInner = dynamic(
  () => import('./charts-inner').catch(() => {
    return { default: () => (
      <div className="glass rounded-2xl p-6 flex items-center justify-center h-64">
        <div className="text-gray-500">Erro ao carregar gráficos. Recarregue a página.</div>
      </div>
    )};
  }),
  {
    ssr: false,
    loading: () => (
      <div className="glass rounded-2xl p-6 flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando gráficos...</div>
      </div>
    ),
  }
);

export default function SimulationCharts({ results }: { results: SimulationResults }) {
  return <ChartsInner results={results} />;
}
