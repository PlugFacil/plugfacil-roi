'use client';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, Legend, ReferenceLine
} from 'recharts';

interface Month {
  mes: number;
  parcelaCartao: number;
  lucroEstacao: number;
  fluxoLiquido: number;
  fluxoAcumulado: number;
  saldoDevedor: number;
}

export default function FinanciamentoCharts({ months, parcelas }: { months: Month[]; parcelas: number }) {
  const displayMonths = months.slice(0, Math.min(48, months.length));
  const data = displayMonths.map(m => ({
    name: `M${m.mes}`,
    parcela: Math.round(m.parcelaCartao),
    lucro: Math.round(m.lucroEstacao),
    fluxoLiquido: Math.round(m.fluxoLiquido),
    acumulado: Math.round(m.fluxoAcumulado),
    saldoDevedor: Math.round(m.saldoDevedor),
  }));

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
        <h3 className="text-sm font-semibold text-white mb-4">Lucro Estação vs Parcela Cartão</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={Math.floor(data.length / 10)} />
              <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmt} />
              <Tooltip contentStyle={ts} formatter={(v: any) => fmt(v)} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="lucro" name="Lucro" fill="#00B386" radius={[2, 2, 0, 0]} />
              <Bar dataKey="parcela" name="Parcela" fill="#FF6363" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Fluxo de Caixa Acumulado</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <defs>
                <linearGradient id="colorFinAcum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B386" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00B386" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={Math.floor(data.length / 10)} />
              <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmt} />
              <Tooltip contentStyle={ts} formatter={(v: any) => fmt(v)} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="acumulado" name="Acumulado" stroke="#00B386" fill="url(#colorFinAcum)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 lg:col-span-2">
        <h3 className="text-sm font-semibold text-white mb-4">Fluxo Líquido Mensal (Lucro - Parcela)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={Math.floor(data.length / 10)} />
              <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={fmt} />
              <Tooltip contentStyle={ts} formatter={(v: any) => fmt(v)} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
              <Bar dataKey="fluxoLiquido" name="Fluxo Líquido" radius={[3, 3, 0, 0]}
                fill="#00B386"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
