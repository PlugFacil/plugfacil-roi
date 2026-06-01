'use client';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { type SimulationResults, type YearlyResult } from '@/lib/financial-engine';

const COLORS = ['#00B386', '#60B5FF', '#FF9149', '#FF90BB', '#A19AD3', '#80D8C3', '#FF6363', '#72BF78'];

export default function ChartsInner({ results }: { results: SimulationResults }) {
  const yearlyData = (results?.yearly ?? []).map((y: YearlyResult) => ({
    name: `Ano ${y?.ano ?? 0}`,
    receita: Math.round(y?.receitaTotal ?? 0),
    custos: Math.round(y?.custoTotal ?? 0),
    lucro: Math.round(y?.lucroLiquido ?? 0),
    acumulado: Math.round(y?.fluxoCaixaAcumulado ?? 0),
  }));

  // Cost breakdown for year 1
  const y1 = results?.yearly?.[0];
  const costPieData = y1 ? [
    { name: 'Energia', value: Math.round(y1.custoEnergia) },
    { name: 'Royalties 12%', value: Math.round(y1.royalties) },
    { name: 'Plataforma 10%', value: Math.round(y1.retencaoPlataforma) },
    { name: 'Impostos 10%', value: Math.round(y1.impostos) },
    { name: 'Provis. 8%', value: Math.round(y1.provisionamento) },
  ].filter((d) => (d.value ?? 0) > 0) : [];

  // Revenue breakdown year 1
  const revPieData = y1 ? [
    { name: 'Receita DC', value: Math.round(y1.receitaDC) },
    { name: 'Receita AC', value: Math.round(y1.receitaAC) },
    { name: 'Ativação', value: Math.round(y1.receitaAtivacao) },
  ].filter((d) => (d.value ?? 0) > 0) : [];

  const formatBRL = (val: any) => {
    const num = Number(val) ?? 0;
    if (Math.abs(num) >= 1000000) return `R$${(num / 1000000)?.toFixed?.(1)}M`;
    if (Math.abs(num) >= 1000) return `R$${(num / 1000)?.toFixed?.(0)}k`;
    return `R$${num}`;
  };

  const tooltipStyle = { backgroundColor: '#1A2238', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 11, color: '#fff' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Revenue vs Costs Bar Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Receita vs Custos (Anual)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={formatBRL} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => formatBRL(val)} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="receita" name="Receita" fill="#00B386" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custos" name="Custos" fill="#FF6363" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cumulative FCL Area Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">FCL Acumulado (10 anos)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearlyData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <defs>
                <linearGradient id="colorAcum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B386" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00B386" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={formatBRL} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => formatBRL(val)} />
              <Area type="monotone" dataKey="acumulado" name="Acumulado" stroke="#00B386" fill="url(#colorAcum)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Breakdown Pie */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Composição de Custos (Ano 1)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100)?.toFixed?.(0)}%`}
              >
                {(costPieData ?? []).map((_: any, idx: number) => (
                  <Cell key={idx} fill={['#FF9149', '#A19AD3', '#60B5FF', '#FF6363', '#80D8C3'][idx % 5]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => formatBRL(val)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Split Pie */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Composição de Receita (Ano 1)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100)?.toFixed?.(0)}%`}
              >
                {(revPieData ?? []).map((_: any, idx: number) => (
                  <Cell key={idx} fill={COLORS?.[idx % COLORS.length] ?? '#00B386'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => formatBRL(val)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
