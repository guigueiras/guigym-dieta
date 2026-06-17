import type { Result, UserStats, TDEEError } from './types';
import { VALIDATION_RANGES } from './constants';

// ─── Helpers locais ──────────────────────────────────────────

function inRange(value: number, range: readonly [number, number]): boolean {
  return Number.isFinite(value) && value >= range[0] && value <= range[1];
}

function err(error: TDEEError): Result<never> {
  return { ok: false, error };
}

// ─── Validação de UserStats ──────────────────────────────────

function validateUserStats(stats: UserStats): TDEEError | null {
  if (stats.sex !== 'male' && stats.sex !== 'female') {
    return {
      code: 'INVALID_SEX',
      field: 'sex',
      message: 'Sexo inválido. Use "male" ou "female".',
    };
  }

  if (!Number.isInteger(stats.age) || !inRange(stats.age, VALIDATION_RANGES.age)) {
    const [min, max] = VALIDATION_RANGES.age;
    return {
      code: 'INVALID_AGE',
      field: 'age',
      message: `Idade deve ser um número inteiro entre ${min} e ${max} anos.`,
    };
  }

  if (!inRange(stats.weightKg, VALIDATION_RANGES.weightKg)) {
    const [min, max] = VALIDATION_RANGES.weightKg;
    return {
      code: 'INVALID_WEIGHT',
      field: 'weightKg',
      message: `Peso deve estar entre ${min} e ${max} kg.`,
    };
  }

  if (!inRange(stats.heightCm, VALIDATION_RANGES.heightCm)) {
    const [min, max] = VALIDATION_RANGES.heightCm;
    return {
      code: 'INVALID_HEIGHT',
      field: 'heightCm',
      message: `Altura deve estar entre ${min} e ${max} cm.`,
    };
  }

  if (typeof stats.activityLevel !== 'string' || stats.activityLevel.length === 0) {
    return {
      code: 'INVALID_ACTIVITY_LEVEL',
      field: 'activityLevel',
      message: 'Nível de atividade inválido.',
    };
  }

  if (stats.bodyFatPct !== undefined) {
    if (!inRange(stats.bodyFatPct, VALIDATION_RANGES.bodyFatPct)) {
      const [min, max] = VALIDATION_RANGES.bodyFatPct;
      return {
        code: 'INVALID_BODY_FAT',
        field: 'bodyFatPct',
        message: `Percentual de gordura corporal deve estar entre ${min} e ${max}%.`,
      };
    }
  }

  return null;
}

// ─── Cálculo ─────────────────────────────────────────────────

/**
 * Calcula a BMR com a fórmula mais precisa disponível:
 *
 * Quando `bodyFatPct` presente → **Katch-McArdle**:
 *   LBM = weightKg × (1 − bodyFatPct / 100)
 *   BMR = 370 + 21.6 × LBM
 *   Mais preciso porque usa massa magra real; ignora sexo/idade/altura.
 *
 * Quando ausente → **Mifflin-St Jeor**:
 *   Homem:  BMR = 10·W + 6.25·H − 5·A + 5
 *   Mulher: BMR = 10·W + 6.25·H − 5·A − 161
 */
export function calculateBMR(stats: UserStats): Result<number> {
  const validationError = validateUserStats(stats);
  if (validationError) return err(validationError);

  let bmr: number;

  if (stats.bodyFatPct !== undefined) {
    // Katch-McArdle
    const lbm = stats.weightKg * (1 - stats.bodyFatPct / 100);
    bmr = 370 + 21.6 * lbm;
  } else {
    // Mifflin-St Jeor
    const { sex, age, weightKg, heightCm } = stats;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    bmr = sex === 'male' ? base + 5 : base - 161;
  }

  if (!Number.isFinite(bmr) || bmr <= 0) {
    return err({
      code: 'COMPUTATION_FAILED',
      message: 'Falha ao calcular BMR: resultado inválido.',
    });
  }

  return { ok: true, value: bmr };
}

export { validateUserStats };
