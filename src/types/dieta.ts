import type { Refeicao } from './refeicao';
import type { Goal, CarbProfile, MacroTargets } from '@/utils/tdee';

export type TipoDieta = 'Ganho de massa' | 'Perda de gordura' | 'Manutenção';

export function goalToTipo(goal: Goal): TipoDieta {
  switch (goal) {
    case 'cutting':     return 'Perda de gordura';
    case 'maintenance': return 'Manutenção';
    case 'bulking':     return 'Ganho de massa';
    default:            return 'Manutenção';
  }
}

export type DiaSemana =
  | 'segunda' | 'terca' | 'quarta' | 'quinta'
  | 'sexta'   | 'sabado' | 'domingo';

// ─── Duração ─────────────────────────────────────────────────

export type DuracaoConfig =
  | { tipo: 'indefinida' }
  | { tipo: 'semanas'; quantidade: number; diaInicio: DiaSemana | null }
  | { tipo: 'dias';    quantidade: number; diaInicio: DiaSemana | null };

// ─── Dia / Semana ─────────────────────────────────────────────

export interface Dia {
  /** Dia da semana (segunda–domingo). */
  nome: DiaSemana;
  /**
   * Posição 1-based no plano geral da dieta.
   * Presente apenas no modo 'dias' com duração > 7.
   * Usado para distinguir dias com o mesmo `nome` (ex: dois 'quintas').
   */
  indice?: number;
  refeicoes: Refeicao[];
}

export interface Semana {
  id: string;
  /** Número 1-based da semana dentro da dieta. */
  numero: number;
  dias: Dia[];
}

// ─── Targets ─────────────────────────────────────────────────

export interface DietTargets {
  calories: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  goal: Goal;
  carbProfile: CarbProfile;
}

export function hasTargets(
  dieta: Dieta
): dieta is Dieta & { targets: DietTargets } {
  return dieta.targets !== undefined;
}

export function fromMacroTargets(m: MacroTargets): DietTargets {
  return {
    calories: m.kcal,
    proteinG: m.proteinG,
    carbG: m.carbG,
    fatG: m.fatG,
    goal: m.goal,
    carbProfile: m.carbProfile,
  };
}

// ─── Dieta ───────────────────────────────────────────────────

export interface Dieta {
  id: string;
  nome: string;
  tipo?: TipoDieta;
  /** Configuração de duração. Padrão: indefinida (comportamento original). */
  duracao: DuracaoConfig;
  /** Semanas da dieta. Sempre >= 1 elemento. */
  semanas: Semana[];
  criadaEm: number;
  atualizadaEm: number;
  targets?: DietTargets;
}
