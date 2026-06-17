import type { Refeicao } from './refeicao';
import type { Goal, CarbProfile, MacroTargets } from '@/utils/tdee';

export type TipoDieta = 'Ganho de massa' | 'Perda de gordura' | 'Manutenção';

/**
 * Mapeia um `Goal` da engine TDEE pro `TipoDieta` correspondente.
 * Usado na criação/edição da dieta — quando há meta, o `tipo` é
 * derivado do `targets.goal` em vez de selecionado manualmente.
 */
export function goalToTipo(goal: Goal): TipoDieta {
  switch (goal) {
    case 'cutting':     return 'Perda de gordura';
    case 'maintenance': return 'Manutenção';
    case 'bulking':     return 'Ganho de massa';
  }
}
export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';

export interface Dia {
  nome: DiaSemana;
  refeicoes: Refeicao[];
}

/**
 * Metas nutricionais de uma dieta, persistidas no banco.
 *
 * Semântica:
 *  - "Não configurado" é representado por `dieta.targets === undefined`.
 *    Nunca usar zero como sentinela ("sem meta" ≠ "meta zero").
 *  - Quando presente, TODOS os 6 campos estão preenchidos (atomicidade).
 *    Nunca existe "calorias sem proteína" ou variação parcial.
 *
 * Origem dos valores:
 *  - Calculadora TDEE → função `fromMacroTargets` converte o output da engine.
 *  - Manualmente (futuro) → UI direta, sem passar pela engine.
 *
 * Domínio: persistência da dieta. NÃO confundir com `MacroTargets` da engine
 * (que vive em `@/utils/tdee`). Os tipos têm shape quase idêntico, mas:
 *  - `MacroTargets.kcal` ≡ `DietTargets.calories` (nome muda por convenção
 *    semântica: engine trabalha em unidade técnica, dieta fala em conceito).
 *  - Os outros campos preservam nome.
 */
export interface DietTargets {
  /** Calorias alvo por dia. */
  calories: number;
  /** Proteína alvo em gramas por dia. */
  proteinG: number;
  /** Carboidrato alvo em gramas por dia. */
  carbG: number;
  /** Gordura alvo em gramas por dia. */
  fatG: number;
  /** Objetivo da dieta (técnico, vindo da engine TDEE). */
  goal: Goal;
  /** Perfil de distribuição de macros escolhido. */
  carbProfile: CarbProfile;
}

/**
 * Type predicate: refina `dieta.targets` de `DietTargets | undefined` pra `DietTargets`.
 *
 * Uso:
 *   if (hasTargets(dieta)) {
 *     dieta.targets.calories  // TS sabe que existe
 *   }
 *
 * Equivalente a `dieta.targets !== undefined`, mas com narrowing mais ergonômico
 * no callsite (especialmente útil em `.filter()` e destructuring).
 */
export function hasTargets(
  dieta: Dieta
): dieta is Dieta & { targets: DietTargets } {
  return dieta.targets !== undefined;
}

/**
 * Converte o output da engine TDEE (`MacroTargets`) para o tipo persistido
 * da dieta (`DietTargets`).
 *
 * Único campo que muda: `kcal` → `calories`. Os outros são preservados.
 *
 * Função pura. Usar quando o usuário confirmar uma escolha no wizard futuro:
 *   const escolhido = result.value.cutting.medium_carb; // MacroTargets
 *   const persistido = fromMacroTargets(escolhido);     // DietTargets
 *   await dietaRepo.atualizarTargets(dietaId, persistido);
 */
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

export interface Dieta {
  id: string;
  nome: string;
  /**
   * Tipo derivado de `targets.goal`. Opcional:
   *  - `undefined`: dieta sem meta nutricional configurada.
   *  - presente: derivado automaticamente do goal ('Cutting' → 'Perda de gordura',
   *    'Manutenção' → 'Manutenção', 'Bulking' → 'Ganho de massa').
   *
   * Gravado no banco em conjunto com os targets — não selecionado manualmente.
   */
  tipo?: TipoDieta;
  dias: Dia[];
  criadaEm: number;
  atualizadaEm: number;
  /**
   * Metas nutricionais da dieta. Opcional:
   *  - `undefined`: dieta criada manualmente, sem calculadora.
   *  - presente: definida via calculadora TDEE ou edição manual de targets.
   *
   * Quando presente, todos os 6 sub-campos estão preenchidos atomicamente.
   * Use o type predicate `hasTargets(dieta)` pra narrowing.
   */
  targets?: DietTargets;
}
