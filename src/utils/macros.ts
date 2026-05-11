import type { Alimento } from '@/types';

export interface MacrosCalculados {
  proteina: number;
  carbo: number;
  gordura: number;
  calorias: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function calcMacros(alimento: Alimento, quantidade: number): MacrosCalculados {
  const f = quantidade / 100;
  const proteina = round1(alimento.proteina * f);
  const carbo    = round1(alimento.carbo    * f);
  const gordura  = round1(alimento.gordura  * f);
  const calorias = Math.round(proteina * 4 + carbo * 4 + gordura * 9);
  return { proteina, carbo, gordura, calorias };
}

export function somarMacros(lista: MacrosCalculados[]): MacrosCalculados {
  return lista.reduce(
    (acc, m) => ({
      proteina: round1(acc.proteina + m.proteina),
      carbo:    round1(acc.carbo + m.carbo),
      gordura:  round1(acc.gordura + m.gordura),
      calorias: acc.calorias + m.calorias,
    }),
    { proteina: 0, carbo: 0, gordura: 0, calorias: 0 }
  );
}
