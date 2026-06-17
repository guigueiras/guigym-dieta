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
import { GOAL_CALORIE_PCT, MACRO_PROFILES, KCAL_PER_GRAM } from './constants';
import { calculateTDEE } from './calculateTDEE';
import { calculateMacros } from './calculateMacros';

// ─── Constantes locais ───────────────────────────────────────

const MIN_TARGET_KCAL = 800;

/** g de proteína por kg de LBM quando BF% é conhecido. */
const PROTEIN_PER_KG_LBM = 2.2;

// ─── Helpers locais ──────────────────────────────────────────

function err(error: TDEEError): Result<never> {
  return { ok: false, error };
}

function calculateGoalCalories(
  tdee: number,
  goal: Goal,
  options?: CalorieAdjustmentOptions
): number {
  const absoluteOverride = options?.absoluteCalorieDelta;
  if (absoluteOverride !== undefined && Number.isFinite(absoluteOverride)) {
    return Math.max(MIN_TARGET_KCAL, tdee + absoluteOverride);
  }
  const pct = GOAL_CALORIE_PCT[goal];
  return Math.max(MIN_TARGET_KCAL, tdee * (1 + pct));
}

/**
 * Distribui macros quando BF% é conhecido.
 *
 * Proteína fixada em 2.2g/kg de LBM (massa magra).
 * Gordura e carbo dividem o restante mantendo a proporção relativa
 * entre si do carbProfile escolhido.
 */
function calculateMacrosWithLBM(
  kcal: number,
  carbProfile: CarbProfile,
  lbm: number,
  goal: Goal
): MacroTargets {
  const dist = MACRO_PROFILES[carbProfile];

  const proteinG = Math.round(lbm * PROTEIN_PER_KG_LBM);
  const proteinKcal = proteinG * KCAL_PER_GRAM.protein;

  // Remaining kcal para fat + carb, com floor em 0
  const remaining = Math.max(0, kcal - proteinKcal);

  // Proporção relativa fat vs carb dentro do perfil escolhido
  const totalFatCarb = dist.fatPct + dist.carbPct;
  const fatShare = totalFatCarb > 0 ? dist.fatPct / totalFatCarb : 0.5;

  const fatG = Math.round((remaining * fatShare) / KCAL_PER_GRAM.fat);
  const carbKcalRemaining = remaining - fatG * KCAL_PER_GRAM.fat;
  const carbG = Math.max(0, Math.round(carbKcalRemaining / KCAL_PER_GRAM.carb));

  const kcalFinal =
    proteinG * KCAL_PER_GRAM.protein +
    carbG    * KCAL_PER_GRAM.carb +
    fatG     * KCAL_PER_GRAM.fat;

  return { kcal: kcalFinal, proteinG, carbG, fatG, goal, carbProfile };
}

// ─── Função principal ────────────────────────────────────────

/**
 * Gera o conjunto completo de alvos da dieta.
 *
 * Quando `stats.bodyFatPct` está presente:
 *   - BMR via Katch-McArdle (delegado a calculateBMR via calculateTDEE)
 *   - Proteína baseada em LBM (2.2g/kg) em vez de % das kcal totais
 *   - Gordura e carbo preservam a proporção relativa do carbProfile
 *
 * Quando ausente: comportamento original (Mifflin-St Jeor + distribuição %).
 */
export function calculateDietTargets(
  stats: UserStats,
  options?: CalculateTargetsOptions
): Result<DietTargetsSet> {
  const energyResult = calculateTDEE(stats);
  if (!energyResult.ok) return energyResult;

  const { tdee } = energyResult.value;

  const goals = Object.keys(GOAL_CALORIE_PCT) as Goal[];
  const carbProfiles = Object.keys(MACRO_PROFILES) as CarbProfile[];

  const lbm =
    stats.bodyFatPct !== undefined
      ? stats.weightKg * (1 - stats.bodyFatPct / 100)
      : null;

  const result: Partial<DietTargetsSet> = {};

  for (const goal of goals) {
    const goalCalories = calculateGoalCalories(tdee, goal, options?.[goal]);
    const macrosForGoal: Partial<Record<CarbProfile, MacroTargets>> = {};

    for (const carbProfile of carbProfiles) {
      if (lbm !== null) {
        // BF% conhecido: proteína por LBM
        macrosForGoal[carbProfile] = calculateMacrosWithLBM(
          goalCalories,
          carbProfile,
          lbm,
          goal
        );
      } else {
        // Sem BF%: distribuição percentual padrão
        const macrosResult = calculateMacros(goalCalories, carbProfile);
        if (!macrosResult.ok) return macrosResult;
        macrosForGoal[carbProfile] = {
          ...macrosResult.value,
          goal,
          carbProfile,
        };
      }
    }

    result[goal] = macrosForGoal as Record<CarbProfile, MacroTargets>;
  }

  return { ok: true, value: result as DietTargetsSet };
}
