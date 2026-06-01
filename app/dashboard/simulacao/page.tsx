import { Suspense } from 'react';
import SimulacaoClient from './_components/simulacao-client';

export default function SimulacaoPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-center py-12">Carregando simulação...</div>}>
      <SimulacaoClient />
    </Suspense>
  );
}
