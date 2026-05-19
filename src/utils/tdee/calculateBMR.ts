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

/**
 * Valida os campos de UserStats que afetam BMR (e os reservados, como bodyFatPct).
 * Centralizado aqui porque BMR é a porta de entrada de toda a cadeia de cálculo.
 *
 * Retorna `null` se tudo ok, ou um TDEEError descrevendo a primeira falha.
 * Estratégia "fail-fast": para na primeira inconsistência pra evitar mensagens
 * de erro ambíguas ("3 campos inválidos") na UI.
 */
function validateUserStats(stats: UserStats): TDEEError | null {
  // Sexo: union literal, mas TS não impede atribuição via `as any`.
  // Defesa em runtime contra entrada de fonte externa (JSON, formulário).
  if (stats.sex !== 'male' && stats.sex !== 'female') {
    return {
      code: 'INVALID_SEX',
      field: 'sex',
      message: 'Sexo inválido. Use "male" ou "female".',
    };
  }

  // Idade: inteiro dentro do range
  if (!Number.isInteger(stats.age) || !inRange(stats.age, VALIDATION_RANGES.age)) {
    const [min, max] = VALIDATION_RANGES.age;
    return {
      code: 'INVALID_AGE',
      field: 'age',
      message: `Idade deve ser um número inteiro entre ${min} e ${max} anos.`,
    };
  }

  // Peso
  if (!inRange(stats.weightKg, VALIDATION_RANGES.weightKg)) {
    const [min, max] = VALIDATION_RANGES.weightKg;
    return {
      code: 'INVALID_WEIGHT',
      field: 'weightKg',
      message: `Peso deve estar entre ${min} e ${max} kg.`,
    };
  }

  // Altura
  if (!inRange(stats.heightCm, VALIDATION_RANGES.heightCm)) {
    const [min, max] = VALIDATION_RANGES.heightCm;
    return {
      code: 'INVALID_HEIGHT',
      field: 'heightCm',
      message: `Altura deve estar entre ${min} e ${max} cm.`,
    };
  }

  // Nível de atividade: validação leve aqui (string check). Multiplicador é
  // resolvido em calculateTDEE — se inválido, lá retorna INVALID_ACTIVITY_LEVEL.
  // Não checamos contra o Record aqui pra manter este módulo independente
  // de ACTIVITY_MULTIPLIERS.
  if (typeof stats.activityLevel !== 'string' || stats.activityLevel.length === 0) {
    return {
      code: 'INVALID_ACTIVITY_LEVEL',
      field: 'activityLevel',
      message: 'Nível de atividade inválido.',
    };
  }

  // BF% (opcional): valida se presente. Não influencia BMR nesta versão,
  // mas a engine rejeita valores absurdos pra coerência com a reserva do campo.
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
 * Calcula a Basal Metabolic Rate (BMR) usando Mifflin-St Jeor.
 *
 *   Homem:  BMR = 10·W + 6.25·H − 5·A + 5
 *   Mulher: BMR = 10·W + 6.25·H − 5·A − 161
 *
 * onde:
 *   W = peso em kg
 *   H = altura em cm
 *   A = idade em anos
 *
 * Mifflin-St Jeor é a fórmula recomendada pela Academy of Nutrition and Dietetics
 * (2005) por ter o menor erro vs calorimetria indireta em populações ocidentais.
 *
 * Retorna `Result<number>`:
 *  - `{ ok: true, value: bmr }` em kcal/dia (não arredondado)
 *  - `{ ok: false, error }` se input inválido
 *
 * O valor retornado é float — arredondamento é responsabilidade do consumidor
 * (UI ou função de composição), pra evitar perda cumulativa de precisão
 * em pipelines multi-step.
 */
export function calculateBMR(stats: UserStats): Result<number> {
  const validationError = validateUserStats(stats);
  if (validationError) return err(validationError);

  const { sex, age, weightKg, heightCm } = stats;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === 'male' ? base + 5 : base - 161;

  // Sanity check defensivo: BMR realista vai de ~800 a ~3000 kcal/dia.
  // Se passou validação mas resultou em valor absurdo, algo está muito errado.
  if (!Number.isFinite(bmr) || bmr <= 0) {
    return err({
      code: 'COMPUTATION_FAILED',
      message: 'Falha ao calcular BMR: resultado inválido.',
    });
  }

  return { ok: true, value: bmr };
}

// Exportado pra reuso em calculateTDEE e calculateDietTargets sem duplicação.
export { validateUserStats };