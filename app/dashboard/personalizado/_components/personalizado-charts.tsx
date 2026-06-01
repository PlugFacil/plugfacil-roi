'use client';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

interface YR {
  ano: number;
  receitaTotal: number;
  custoTotal: number;
  lucroLiquido: number;
  fluxoCaixaAcumulado: number;
  custoEnergia: number;
  royalties: number;
  retencaoPlataforma: number;
  impostos: number;
  provisionamento: number;
}

export default function PersonalizadoCharts({ results }: { results: { yearly: YR[] } }) {
  const data = (results?.yearly ?? []).map((y: YR) => ({
    name: `Ano ${y.ano}`,
    receita: Math.round(y.receitaTotal),
    custos: Math.round(y.custoTotal),
    lucro: Math.round(y.lucroLiquido),
    acumulado: Math.round(y.fluxoCaixaAcumulado),
  }));

  const y1 = results?.yearly?.[0];
  const costPie = y1 ? [
    { name: 'Energia', value: Math.round(y1.custoEnergia) },
    { name: 'Royalties', value: Math.round(y1.royalties) },
    { name: 'Plataforma', value: Math.round(y1.retencaoPlataforma) },
    { name: 'Impostos', value: Math.round(y1.impostos) },
  ].filter(d => d.value > 0) : [];

  const fmt = (val: any) => {
    const n = Number(val);
    if (Math.abs(n) >= 1e6) return `R$${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `R$${(n / 1e3).toFixed(0)}k`;
    return `R$${n}`;
  };

  const ts = { backgroundColor: '#1A2238', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 11, color: '#fff' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Receita vs Custos</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmt} />
              <Tooltip contentStyle={ts} formatter={(v: any) => fmt(v)} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="receita" name="Receita" fill="#00B386" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custos" name="Custos" fill="#FF6363" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">FCL Acumulado</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <defs>
                <linearGradient id="colorAcumCustom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B386" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00B386" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmt} />
              <Tooltip contentStyle={ts} formatter={(v: any) => fmt(v)} />
              <Area type="monotone" dataKey="acumulado" name="Acumulado" stroke="#00B386" fill="url(#colorAcumCustom)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Composição de Custos (Ano 1)</h3>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              <span className="text-gray-400">% do Total</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">Cada fatia mostra a proporção do custo total do ano. Passe o mouse para ver o valor em reais.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={costPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {costPie.map((_, i) => (
                  <Cell key={i} fill={['#FF9149', '#A19AD3', '#60B5FF', '#FF6363', '#80D8C3'][i % 5]} />
                ))}
              </Pie>
              <Tooltip contentStyle={ts} formatter={(v: any) => `Custo: ${fmt(v)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
