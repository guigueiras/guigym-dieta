import type {
  Result,
  UserStats,
  Goal,
  CarbProfile,
  MacroTargets,
  DietTargetsSet,
  CalculateTargetsOptions,
  CalorieAdjustmentOptions,
  TDEEError,
} from './types';
import { GOAL_CALORIE_PCT, MACRO_PROFILES } from './constants';
import { calculateTDEE } from './calculateTDEE';
import { calculateMacros } from './calculateMacros';

// ─── Constantes locais ───────────────────────────────────────

/**
 * Floor mínimo pra alvo calórico, mesmo com override agressivo do usuário.
 * 800 kcal é território de VLCD (Very Low Calorie Diet) — abaixo disso
 * requer supervisão médica. Nunca retornar target abaixo desse valor.
 */
const MIN_TARGET_KCAL = 800;

// ─── Helper local ────────────────────────────────────────────

function err(error: TDEEError): Result<never> {
  return { ok: false, error };
}

/**
 * Calcula o alvo calórico final pra um objetivo, aplicando:
 *  - override absoluto (se fornecido e válido), OU
 *  - delta percentual padrão de GOAL_CALORIE_PCT
 *
 * Aplica MIN_TARGET_KCAL como floor pra evitar alvos perigosos.
 */
function calculateGoalCalories(
  tdee: number,
  goal: Goal,
  options?: CalorieAdjustmentOptions
): number {
  // Override absoluto tem prioridade, mas validado: deve ser finito.
  // NaN/Infinity são ignorados silenciosamente (fallback pro percentual).
  const absoluteOverride = options?.absoluteCalorieDelta;
  if (absoluteOverride !== undefined && Number.isFinite(absoluteOverride)) {
    return Math.max(MIN_TARGET_KCAL, tdee + absoluteOverride);
  }

  // Padrão: aplica delta percentual.
  const pct = GOAL_CALORIE_PCT[goal];
  return Math.max(MIN_TARGET_KCAL, tdee * (1 + pct));
}

// ─── Função principal ────────────────────────────────────────

/**
 * Gera o conjunto completo de alvos da dieta a partir do perfil do usuário.
 *
 * Composição:
 *   1. calculateTDEE(stats) → { bmr, tdee }
 *   2. Pra cada goal (cutting/maintenance/bulking):
 *        2a. Calcula alvo calórico ajustando TDEE
 *            (default: percentual de GOAL_CALORIE_PCT; override: options[goal])
 *        2b. Pra cada carbProfile (low/medium/high):
 *             calculateMacros(kcalAlvo, carbProfile) → MacroTargets
 *
 * Retorna `DietTargetsSet`: matriz 3×3 indexável por `[goal][carbProfile]`.
 *
 * Validações são herdadas das funções compostas — qualquer falha
 * (sexo/idade/peso/altura/activityLevel/carbProfile) propaga sem reembrulho.
 *
 * BMR/TDEE não são incluídos no retorno. Pra obter, chame `calculateTDEE` direto.
 */
export function calculateDietTargets(
  stats: UserStats,
  options?: CalculateTargetsOptions
): Result<DietTargetsSet> {
  // 1) Estimativa de energia (valida UserStats internamente)
  const energyResult = calculateTDEE(stats);
  if (!energyResult.ok) return energyResult;

  const { tdee } = energyResult.value;

  // 2) Itera sobre goals e perfis (em vez de hardcode) — extensível.
  const goals = Object.keys(GOAL_CALORIE_PCT) as Goal[];
  const carbProfiles = Object.keys(MACRO_PROFILES) as CarbProfile[];

  // Acumulador: começa vazio, populado em duas dimensões.
  // Inicializado com `Partial` porque preenchimento é incremental.
  const result: Partial<DietTargetsSet> = {};

  for (const goal of goals) {
    const goalCalories = calculateGoalCalories(tdee, goal, options?.[goal]);

    const macrosForGoal: Partial<Record<CarbProfile, MacroTargets>> = {};

    for (const carbProfile of carbProfiles) {
      const macrosResult = calculateMacros(goalCalories, carbProfile);
      if (!macrosResult.ok) return macrosResult;

      macrosForGoal[carbProfile] = {
        ...macrosResult.value,
        goal,
        carbProfile,
      };
    }

    // Type assertion controlada: sabemos que populamos todos os carbProfiles
    // (loop sobre Object.keys(MACRO_PROFILES) cobre o tipo CarbProfile exaustivamente).
    result[goal] = macrosForGoal as Record<CarbProfile, MacroTargets>;
  }

  return { ok: true, value: result as DietTargetsSet };
}