/**
 * Engine TDEE/macros — superfície pública.
 *
 * Convenções:
 *  - Sistema métrico (kg, cm, anos, kcal, gramas).
 *  - Funções retornam `Result<T>` — nunca lançam exceções.
 *  - Macros arredondados pra inteiros; kcal final é a soma realizada
 *    (não o target de entrada).
 *
 * Uso típico:
 *   import { calculateDietTargets, type UserStats } from '@/utils/tdee';
 *
 *   const result = calculateDietTargets({
 *     sex: 'male', age: 30, weightKg: 80, heightCm: 180,
 *     activityLevel: 'moderate',
 *   });
 *
 *   if (result.ok) {
 *     const cuttingMediumCarb = result.value.cutting.medium_carb;
 *     // → { kcal, proteinG, carbG, fatG, goal, carbProfile }
 *   } else {
 *     // result.error.code / field / message
 *   }
 */

// ─── Funções principais ──────────────────────────────────────

export { calculateBMR } from './calculateBMR';
export { calculateTDEE } from './calculateTDEE';
export { calculateMacros } from './calculateMacros';
export { calculateDietTargets } from './calculateDietTargets';

// ─── Tipos do domínio ────────────────────────────────────────

export type {
  // Entradas
  Sex,
  ActivityLevel,
  Goal,
  CarbProfile,
  UserStats,

  // Saídas
  Macros,
  MacroTargets,
  DietTargetsSet,
  EnergyEstimate,

  // Resultado e erros
  Result,
  TDEEError,
  TDEEErrorCode,

  // Opções
  CalorieAdjustmentOptions,
  CalculateTargetsOptions,
} from './types';

// ─── Constantes públicas ─────────────────────────────────────

/**
 * Expostos pra UI poder:
 *  - Renderizar selects/sliders com os mesmos valores da engine
 *  - Validar inputs antes de chamar a engine (UX responsiva)
 *  - Exibir percentuais/multiplicadores ao usuário
 */
export {
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_PCT,
  MACRO_PROFILES,
  VALIDATION_RANGES,
} from './constants';