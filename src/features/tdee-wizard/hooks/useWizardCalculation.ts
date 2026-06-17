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
  amount: number;
}

interface CalculationState {
  tdee: number | null;
  error: TDEEError | null;
  idle: boolean;
  usedKatchMcArdle: boolean;
}

// ─── Helper puro ─────────────────────────────────────────────

const MAINTENANCE_TOLERANCE = 5;

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

export function useWizardCalculation() {
  const [state, setState] = useState<CalculationState>({
    tdee: null,
    error: null,
    idle: true,
    usedKatchMcArdle: false,
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
        usedKatchMcArdle: false,
      });
      return false;
    }

    const energyResult = calculateTDEE(stats);
    if (!energyResult.ok) {
      setState({ tdee: null, idle: false, error: energyResult.error, usedKatchMcArdle: false });
      return false;
    }

    const targetsResult = calculateDietTargets(stats);
    if (!targetsResult.ok) {
      setState({ tdee: null, idle: false, error: targetsResult.error, usedKatchMcArdle: false });
      return false;
    }

    store.setResult(targetsResult.value);
    setState({
      tdee: energyResult.value.tdee,
      idle: false,
      error: null,
      usedKatchMcArdle: stats.bodyFatPct !== undefined,
    });
    return true;
  }, []);

  const getDeltaForGoal = useCallback(
    (goal: Goal): CalorieDelta | null => {
      const result = useTdeeWizardStore.getState().result;
      if (result === null || state.tdee === null) return null;
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
    usedKatchMcArdle: state.usedKatchMcArdle,
  };
}
