import { useState, useCallback } from 'react';
import {
  calculateTDEE,
  calculateDietTargets,
  type TDEEError,
  type Goal,
} from '@/utils/tdee';
import { useTdeeWizardStore } from '../stores/useTdeeWizardStore';

// ─── Tipos derivados ─────────────────────────────────────────

export type DeltaKind = 'deficit' | 'surplus' | 'maintenance';

export interface CalorieDelta {
  kind: DeltaKind;
  /** Magnitude absoluta em kcal (sempre positiva). 0 quando maintenance. */
  amount: number;
}

interface CalculationState {
  /** TDEE base (kcal/dia) — usado pra derivar deltas. null antes de calcular. */
  tdee: number | null;
  /** Erro da engine, se o cálculo falhou. */
  error: TDEEError | null;
  /** True enquanto não houve nenhuma tentativa de cálculo. */
  idle: boolean;
}

// ─── Helper puro ─────────────────────────────────────────────

const MAINTENANCE_TOLERANCE = 5; // kcal

/**
 * Deriva o contexto (déficit/superávit/manutenção) comparando o alvo
 * calórico de um goal com o TDEE base.
 *
 * Tolerância de ±5 kcal pra "maintenance" absorve o drift de arredondamento
 * de macros (maintenance é TDEE exato, mas o kcal final pode variar ±2).
 */
export function computeDelta(goalCalories: number, tdee: number): CalorieDelta {
  const diff = goalCalories - tdee;
  if (Math.abs(diff) <= MAINTENANCE_TOLERANCE) {
    return { kind: 'maintenance', amount: 0 };
  }
  if (diff < 0) {
    return { kind: 'deficit', amount: Math.round(Math.abs(diff)) };
  }
  return { kind: 'surplus', amount: Math.round(diff) };
}

// ─── Hook ────────────────────────────────────────────────────

/**
 * Conecta o store do wizard à engine TDEE.
 *
 * Expõe:
 *  - `calculate()`: monta UserStats do draft, chama a engine, guarda o
 *    resultado (9 targets) no store e o TDEE localmente. Imperativo — o
 *    componente (step 4) chama ao montar.
 *  - `tdee`: TDEE base, pra derivar deltas via `computeDelta`.
 *  - `error`: erro da engine (input inválido), se houver.
 *  - `idle`: true antes da primeira chamada de `calculate`.
 *  - `getDeltaForGoal(goal)`: helper que retorna o CalorieDelta de um goal,
 *    usando o resultado já calculado no store.
 *
 * NÃO roda automaticamente — sem useEffect interno. O componente controla
 * o timing chamando `calculate()`.
 */
export function useWizardCalculation() {
  const [state, setState] = useState<CalculationState>({
    tdee: null,
    error: null,
    idle: true,
  });

  const calculate = useCallback((): boolean => {
    const store = useTdeeWizardStore.getState();
    const stats = store.buildUserStats();

    if (stats === null) {
      setState({
        tdee: null,
        idle: false,
        error: {
          code: 'COMPUTATION_FAILED',
          message: 'Dados incompletos para calcular.',
        },
      });
      return false;
    }

    // Duas chamadas à engine: TDEE (pra deltas) + targets (os 9 alvos).
    // Ambas validam o mesmo input; se uma falha, a outra falharia igual.
    const energyResult = calculateTDEE(stats);
    if (!energyResult.ok) {
      setState({ tdee: null, idle: false, error: energyResult.error });
      return false;
    }

    const targetsResult = calculateDietTargets(stats);
    if (!targetsResult.ok) {
      setState({ tdee: null, idle: false, error: targetsResult.error });
      return false;
    }

    // Sucesso: guarda os targets no store, TDEE localmente.
    store.setResult(targetsResult.value);
    setState({ tdee: energyResult.value.tdee, idle: false, error: null });
    return true;
  }, []);

  /**
   * Retorna o CalorieDelta de um goal específico, baseado no resultado já
   * calculado no store + o TDEE local. Retorna null se ainda não calculado.
   */
  const getDeltaForGoal = useCallback(
    (goal: Goal): CalorieDelta | null => {
      const result = useTdeeWizardStore.getState().result;
      if (result === null || state.tdee === null) return null;
      // Qualquer carbProfile serve pro kcal do goal (kcal é igual entre perfis
      // do mesmo goal — só a distribuição de macros muda).
      const goalCalories = result[goal].medium_carb.kcal;
      return computeDelta(goalCalories, state.tdee);
    },
    [state.tdee]
  );

  return {
    calculate,
    getDeltaForGoal,
    tdee: state.tdee,
    error: state.error,
    idle: state.idle,
  };
}