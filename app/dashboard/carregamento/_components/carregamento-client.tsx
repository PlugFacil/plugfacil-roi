'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BatteryCharging, Zap, Clock, Car, AlertTriangle, Check,
  Info, ArrowRight, Timer, Gauge
} from 'lucide-react';
import { getVeiculos, type Veiculo } from '@/lib/veiculos-data';
import { getModelos, type ModeloFranquia } from '@/lib/financial-engine';
import { getModelMetadata, getAllMetadata, type ModelMetadata } from '@/lib/model-metadata';

export default function CarregamentoClient() {
  const veiculos = getVeiculos();
  const modelos = getModelos();
  const allMeta = getAllMetadata();

  const [selectedVeiculo, setSelectedVeiculo] = useState<string>(veiculos?.[0]?.modelo ?? '');
  const [selectedModelo, setSelectedModelo] = useState<string>('Padrao');
  const [soc, setSoc] = useState(20); // State of charge %
  const [targetSoc, setTargetSoc] = useState(80);

  // Hub simulation
  const [hubCarro1, setHubCarro1] = useState<string>(veiculos?.[0]?.modelo ?? '');
  const [hubCarro2, setHubCarro2] = useState<string>(veiculos?.[1]?.modelo ?? '');

  const veiculo = veiculos?.find((v: Veiculo) => v?.modelo === selectedVeiculo);
  const modelo = modelos?.find((m: ModeloFranquia) => m?.modelo === selectedModelo);
  const meta = getModelMetadata(selectedModelo);

  // Regra de ouro: potência real = MIN(carro, carregador)
  const calcCharging = (veiculo: Veiculo | undefined, modelo: ModeloFranquia | undefined) => {
    if (!veiculo || !modelo) return null;

    const hasDC = (modelo?.carregadores?.dc ?? 0) > 0;
    const hasAC = (modelo?.carregadores?.ac ?? 0) > 0;

    const potenciaDCCarregador = modelo?.potencia_kw?.dc ?? 0;
    const potenciaACCarregador = modelo?.potencia_kw?.ac ?? 0;
    const potenciaDCCarro = veiculo?.dc_max_kw ?? 0;
    const potenciaACCarro = veiculo?.ac_max_kw ?? 0;

    // Potência real = MIN(carro, carregador)
    const potenciaRealDC = hasDC && potenciaDCCarro > 0 ? Math.min(potenciaDCCarregador, potenciaDCCarro) : 0;
    const potenciaRealAC = hasAC ? Math.min(potenciaACCarregador, potenciaACCarro) : 0;

    const bateria = veiculo?.bateria_kwh ?? 0;
    const energiaNecessaria = bateria * ((targetSoc - soc) / 100);

    const tempoDCHoras = potenciaRealDC > 0 ? energiaNecessaria / potenciaRealDC : 0;
    const tempoACHoras = potenciaRealAC > 0 ? energiaNecessaria / potenciaRealAC : 0;

    const tempoDCMin = Math.round(tempoDCHoras * 60);
    const tempoACMin = Math.round(tempoACHoras * 60);

    const canDC = hasDC && potenciaDCCarro > 0;
    const canAC = hasAC;

    return {
      potenciaRealDC,
      potenciaRealAC,
      potenciaDCCarregador,
      potenciaACCarregador,
      potenciaDCCarro,
      potenciaACCarro,
      tempoDCMin,
      tempoACMin,
      energiaNecessaria: Math.round(energiaNecessaria * 10) / 10,
      canDC,
      canAC,
      bateria,
    };
  };

  const charging = calcCharging(veiculo, modelo);

  // Hub simulation: 2 carros no DC 120kW
  const hubVeiculo1 = veiculos?.find((v: Veiculo) => v?.modelo === hubCarro1);
  const hubVeiculo2 = veiculos?.find((v: Veiculo) => v?.modelo === hubCarro2);
  const hubModelo = modelos?.find((m: ModeloFranquia) => m?.modelo === 'Hub');

  const hubSimulation = useMemo(() => {
    if (!hubVeiculo1 || !hubVeiculo2 || !hubModelo) return null;
    const totalPower = hubModelo?.potencia_kw?.dc ?? 120;
    const demand1 = Math.min(hubVeiculo1?.dc_max_kw ?? 0, totalPower);
    const demand2 = Math.min(hubVeiculo2?.dc_max_kw ?? 0, totalPower);
    const totalDemand = demand1 + demand2;

    let allocated1: number;
    let allocated2: number;
    if (totalDemand <= totalPower) {
      allocated1 = demand1;
      allocated2 = demand2;
    } else {
      const ratio = totalPower / totalDemand;
      allocated1 = Math.round(demand1 * ratio);
      allocated2 = totalPower - allocated1;
    }

    return {
      totalPower,
      carro1: { modelo: hubVeiculo1?.modelo, demanda: demand1, alocado: allocated1 },
      carro2: { modelo: hubVeiculo2?.modelo, demanda: demand2, alocado: allocated2 },
    };
  }, [hubCarro1, hubCarro2, hubVeiculo1, hubVeiculo2, hubModelo]);

  // Compatibilidade por modelo
  const compatibilidade = useMemo(() => {
    return allMeta.map((meta: ModelMetadata) => {
      const mod = modelos?.find((m: ModeloFranquia) => m?.modelo === meta.jsonName);
      if (!mod) return { meta, compativel: [], incompativel: [] };

      const hasDC = (mod?.carregadores?.dc ?? 0) > 0;
      const hasAC = (mod?.carregadores?.ac ?? 0) > 0;

      const compativel: string[] = [];
      const incompativel: string[] = [];

      (veiculos ?? []).forEach((v: Veiculo) => {
        const canUseDC = hasDC && (v?.dc_max_kw ?? 0) > 0;
        const canUseAC = hasAC;
        if (canUseDC || canUseAC) {
          compativel.push(v?.modelo ?? '');
        } else {
          incompativel.push(v?.modelo ?? '');
        }
      });

      return { meta, compativel, incompativel };
    });
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BatteryCharging className="w-6 h-6 text-emerald-400" /> Simulador de Carregamento
        </h1>
        <p className="text-gray-500 text-sm mt-1">Simule tempos de carga, potência real e compatibilidade entre carros e carregadores.</p>
      </motion.div>

      {/* Regra de Ouro */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-4 border border-amber-500/20">
        <div className="flex items-center gap-3">
          <Gauge className="w-8 h-8 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm">⚡ Regra de Ouro: Potência Real = MIN(carro, carregador)</p>
            <p className="text-gray-400 text-xs">O carro sempre limita a potência de carga. Ex: BYD Dolphin aceita 60kW DC máx, mesmo em carregador de 120kW.</p>
          </div>
        </div>
      </motion.div>

      {/* Simulador Principal */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Timer className="w-5 h-5 text-emerald-400" /> Simulação de Tempo de Carga
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Veículo</label>
            <select
              value={selectedVeiculo}
              onChange={(e) => setSelectedVeiculo(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer text-sm"
            >
              {(veiculos ?? []).map((v: Veiculo) => (
                <option key={v?.modelo} value={v?.modelo ?? ''} className="bg-gray-900">
                  {v?.modelo} ({v?.tipo === 'eletrico' ? 'EV' : 'PHEV'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Modelo PlugFácil</label>
            <select
              value={selectedModelo}
              onChange={(e) => setSelectedModelo(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer text-sm"
            >
              {(modelos ?? []).map((m: ModeloFranquia) => {
                const mt = getModelMetadata(m?.modelo ?? '');
                return (
                  <option key={m?.modelo} value={m?.modelo ?? ''} className="bg-gray-900">
                    {mt.emoji} {mt.displayName}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Bateria Atual ({soc}%)</label>
            <input type="range" min={5} max={90} value={soc} onChange={(e) => setSoc(parseInt(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between text-xs text-gray-600"><span>5%</span><span>90%</span></div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Carregar Até ({targetSoc}%)</label>
            <input type="range" min={50} max={100} value={targetSoc} onChange={(e) => setTargetSoc(parseInt(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between text-xs text-gray-600"><span>50%</span><span>100%</span></div>
          </div>
        </div>

        {/* Resultado */}
        {charging && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DC */}
            <div className={`rounded-xl p-4 border ${charging.canDC ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/5 bg-white/5 opacity-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-bold">Carga DC (Rápida)</h3>
                {!charging.canDC && <span className="text-red-400 text-xs">Indisponível</span>}
              </div>
              {charging.canDC ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Potência do carregador</span>
                    <span className="text-white">{charging.potenciaDCCarregador} kW</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Limite do carro</span>
                    <span className="text-white">{charging.potenciaDCCarro} kW</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-amber-400">Potência real</span>
                    <span className="text-amber-400">{charging.potenciaRealDC} kW</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Energia necessária</span>
                    <span className="text-white">{charging.energiaNecessaria} kWh</span>
                  </div>
                  <div className="mt-2 p-3 rounded-lg bg-blue-500/10 text-center">
                    <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-400">{charging.tempoDCMin} min</p>
                    <p className="text-xs text-gray-500">Tempo estimado de carga DC</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Este modelo não possui carregador DC ou o veículo não suporta.</p>
              )}
            </div>

            {/* AC */}
            <div className={`rounded-xl p-4 border ${charging.canAC ? 'border-green-500/30 bg-green-500/5' : 'border-white/5 bg-white/5 opacity-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <BatteryCharging className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-bold">Carga AC (Lenta)</h3>
                {!charging.canAC && <span className="text-red-400 text-xs">Indisponível</span>}
              </div>
              {charging.canAC ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Potência do carregador</span>
                    <span className="text-white">{charging.potenciaACCarregador} kW</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Limite do carro</span>
                    <span className="text-white">{charging.potenciaACCarro} kW</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-amber-400">Potência real</span>
                    <span className="text-amber-400">{charging.potenciaRealAC} kW</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Energia necessária</span>
                    <span className="text-white">{charging.energiaNecessaria} kWh</span>
                  </div>
                  <div className="mt-2 p-3 rounded-lg bg-green-500/10 text-center">
                    <Clock className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-400">{charging.tempoACMin > 60 ? `${Math.floor(charging.tempoACMin / 60)}h${charging.tempoACMin % 60 > 0 ? ` ${charging.tempoACMin % 60}min` : ''}` : `${charging.tempoACMin} min`}</p>
                    <p className="text-xs text-gray-500">Tempo estimado de carga AC</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Este modelo não possui carregador AC.</p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Hub Simulation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" /> Simulação Hub — 2 Carros Simultâneos
        </h2>
        <p className="text-gray-500 text-xs mb-4">O Hub (120 kW DC, 2 plugs) distribui potência inteligente entre 2 carros ao mesmo tempo.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Carro A</label>
            <select value={hubCarro1} onChange={(e) => setHubCarro1(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer text-sm">
              {(veiculos ?? []).filter((v: Veiculo) => (v?.dc_max_kw ?? 0) > 0).map((v: Veiculo) => (
                <option key={v?.modelo} value={v?.modelo ?? ''} className="bg-gray-900">{v?.modelo} (DC: {v?.dc_max_kw}kW)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Carro B</label>
            <select value={hubCarro2} onChange={(e) => setHubCarro2(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer text-sm">
              {(veiculos ?? []).filter((v: Veiculo) => (v?.dc_max_kw ?? 0) > 0).map((v: Veiculo) => (
                <option key={v?.modelo} value={v?.modelo ?? ''} className="bg-gray-900">{v?.modelo} (DC: {v?.dc_max_kw}kW)</option>
              ))}
            </select>
          </div>
        </div>

        {hubSimulation && (
          <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/20">
            <div className="text-center mb-4">
              <p className="text-purple-400 font-bold text-sm">Potência Total Disponível: {hubSimulation.totalPower} kW</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Car className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                <p className="text-white text-sm font-bold">{hubSimulation.carro1.modelo}</p>
                <p className="text-gray-500 text-xs">Demanda: {hubSimulation.carro1.demanda} kW</p>
                <div className="mt-2 p-2 rounded-lg bg-blue-500/10">
                  <p className="text-blue-400 font-bold text-lg">{hubSimulation.carro1.alocado} kW</p>
                  <p className="text-xs text-gray-500">Potência alocada</p>
                </div>
              </div>
              <div className="text-center">
                <Car className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <p className="text-white text-sm font-bold">{hubSimulation.carro2.modelo}</p>
                <p className="text-gray-500 text-xs">Demanda: {hubSimulation.carro2.demanda} kW</p>
                <div className="mt-2 p-2 rounded-lg bg-emerald-500/10">
                  <p className="text-emerald-400 font-bold text-lg">{hubSimulation.carro2.alocado} kW</p>
                  <p className="text-xs text-gray-500">Potência alocada</p>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden flex">
                <div className="bg-blue-500 h-3 transition-all" style={{ width: `${(hubSimulation.carro1.alocado / hubSimulation.totalPower) * 100}%` }} />
                <div className="bg-emerald-500 h-3 transition-all" style={{ width: `${(hubSimulation.carro2.alocado / hubSimulation.totalPower) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{hubSimulation.carro1.modelo}: {Math.round((hubSimulation.carro1.alocado / hubSimulation.totalPower) * 100)}%</span>
                <span>{hubSimulation.carro2.modelo}: {Math.round((hubSimulation.carro2.alocado / hubSimulation.totalPower) * 100)}%</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Compatibilidade por Modelo */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-emerald-400" /> Compatibilidade de Veículos por Modelo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {compatibilidade.map((comp: any, i: number) => (
            <div key={i} className={`rounded-xl p-4 border ${comp.meta?.colorBorder}`}>
              <div className="flex items-center gap-2 mb-3">
                <span>{comp.meta?.emoji}</span>
                <h3 className={`font-bold ${comp.meta?.colorText}`}>{comp.meta?.displayName}</h3>
                <span className="text-gray-600 text-xs">({comp.meta?.carregadores})</span>
              </div>
              <div className="space-y-1">
                {(comp.compativel ?? []).map((v: string, j: number) => (
                  <div key={j} className="flex items-center gap-1 text-xs">
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-400">{v}</span>
                  </div>
                ))}
                {(comp.incompativel ?? []).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    {(comp.incompativel ?? []).map((v: string, j: number) => (
                      <div key={j} className="flex items-center gap-1 text-xs">
                        <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span className="text-gray-600">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {comp.compativel.length}/{veiculos.length} veículos compatíveis
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
