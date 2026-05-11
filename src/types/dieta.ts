import type { Refeicao } from './refeicao';

export type TipoDieta = 'Ganho de massa' | 'Perda de gordura' | 'Manutenção' | 'Definição';
export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';

export interface Dia {
  nome: DiaSemana;
  refeicoes: Refeicao[];
}

export interface Dieta {
  id: string;
  nome: string;
  tipo: TipoDieta;
  dias: Dia[];
  criadaEm: number;
  atualizadaEm: number;
}
