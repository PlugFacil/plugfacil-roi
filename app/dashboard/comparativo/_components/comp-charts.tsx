'use client';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { getModelMetadata } from '@/lib/model-metadata';
import { formatCurrency } from '@/lib/financial-engine';

interface Props {
  allResults: { modelo: any; results: any; meta?: any }[];
}

export default function CompCharts({ allResults }: Props) {
  const barData = (allResults ?? []).map((item: any) => {
    const meta = item?.meta ?? getModelMetadata(item?.modelo?.modelo ?? '');
    return {
      name: meta?.displayName ?? item?.modelo?.modelo ?? '',
      investimento: (item?.modelo?.investimento ?? 0) / 1000,
      payback: item?.results?.paybackMeses ?? 0,
      roi: Math.round(item?.results?.roiPercent ?? 0),
      vpl: Math.round((item?.results?.vpl ?? 0) / 1000),
      tir: Math.round(item?.results?.tir ?? 0),
      margem: Math.round(item?.results?.margemMedia ?? 0),
      fatMensal: Math.round((item?.results?.receitaMensalAno1 ?? 0) / 1000),
    };
  });

  const maxROI = Math.max(...(allResults ?? []).map((i: any) => i?.results?.roiPercent ?? 0), 1);
  const maxVPL = Math.max(...(allResults ?? []).map((i: any) => i?.results?.vpl ?? 0), 1);
  const maxMargem = Math.max(...(allResults ?? []).map((i: any) => i?.results?.margemMedia ?? 0), 1);
  const maxTIR = Math.max(...(allResults ?? []).map((i: any) => i?.results?.tir ?? 0), 1);

  const radarData = [
    { subject: 'ROI', ...(allResults ?? []).reduce((acc: any, i: any) => { const meta = i?.meta ?? getModelMetadata(i?.modelo?.modelo ?? ''); acc[meta?.displayName ?? ''] = Math.round(((i?.results?.roiPercent ?? 0) / maxROI) * 100); return acc; }, {}) },
    { subject: 'VPL', ...(allResults ?? []).reduce((acc: any, i: any) => { const meta = i?.meta ?? getModelMetadata(i?.modelo?.modelo ?? ''); acc[meta?.displayName ?? ''] = Math.round(((i?.results?.vpl ?? 0) / maxVPL) * 100); return acc; }, {}) },
    { subject: 'Margem', ...(allResults ?? []).reduce((acc: any, i: any) => { const meta = i?.meta ?? getModelMetadata(i?.modelo?.modelo ?? ''); acc[meta?.displayName ?? ''] = Math.round(((i?.results?.margemMedia ?? 0) / maxMargem) * 100); return acc; }, {}) },
    { subject: 'TIR', ...(allResults ?? []).reduce((acc: any, i: any) => { const meta = i?.meta ?? getModelMetadata(i?.modelo?.modelo ?? ''); acc[meta?.displayName ?? ''] = Math.round(((i?.results?.tir ?? 0) / maxTIR) * 100); return acc; }, {}) },
  ];

  const COLORS = ['#22C55E', '#3B82F6', '#EAB308', '#EF4444', '#8B5CF6'];

  const tooltipStyle = { backgroundColor: '#1A2238', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 11, color: '#fff' };

  const formatBRL = (val: any) => {
    const num = Number(val) ?? 0;
    return `R$${num}k`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Payback por Modelo (meses)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 30 }}>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-15} textAnchor="end" height={50} />
              <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="payback" name="Payback (meses)" fill="#EAB308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Análise Comparativa (Radar)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#666' }} />
              {(allResults ?? []).map((item: any, idx: number) => {
                const meta = item?.meta ?? getModelMetadata(item?.modelo?.modelo ?? '');
                return (
                  <Radar
                    key={meta?.displayName ?? idx}
                    name={meta?.displayName ?? ''}
                    dataKey={meta?.displayName ?? ''}
                    stroke={COLORS?.[idx % COLORS.length] ?? '#00B386'}
                    fill={COLORS?.[idx % COLORS.length] ?? '#00B386'}
                    fillOpacity={0.1}
                  />
                );
              })}
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 lg:col-span-2">
        <h3 className="text-sm font-semibold text-white mb-4">Investimento vs Faturamento Mensal vs VPL</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 30 }}>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-15} textAnchor="end" height={50} />
              <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={formatBRL} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => `R$${val}k`} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="investimento" name="Invest. (R$ mil)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fatMensal" name="Fat. Mensal (R$ mil)" fill="#00B386" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vpl" name="VPL (R$ mil)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
