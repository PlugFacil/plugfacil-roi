import veiculosData from '@/data/plugfacil_veiculos.json';

export interface Veiculo {
  modelo: string;
  tipo: string;
  bateria_kwh: number;
  ac_max_kw: number;
  dc_max_kw: number;
}

export function getVeiculos(): Veiculo[] {
  return veiculosData?.veiculos_eletricos ?? [];
}

export function getVeiculosEletricos(): Veiculo[] {
  return getVeiculos().filter((v: Veiculo) => v?.tipo === 'eletrico');
}

export function getVeiculosHibridos(): Veiculo[] {
  return getVeiculos().filter((v: Veiculo) => v?.tipo === 'hibrido_plugin');
}
