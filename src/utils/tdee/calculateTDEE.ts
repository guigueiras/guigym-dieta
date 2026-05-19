import type { Result, UserStats, EnergyEstimate, TDEEError } from './types';
import { ACTIVITY_MULTIPLIERS } from './constants';
import { calculateBMR } from './calculateBMR';

// ─── Helper local ────────────────────────────────────────────

function err(error: TDEEError): Result<never> {
  return { ok: false, error };
}

/**
 * Type guard: garante que a string é uma chave válida de ACTIVITY_MULTIPLIERS.
 * Necessário porque `UserStats.activityLevel` é `ActivityLevel` em compile-time,
 * mas em runtime pode chegar qualquer string (de JSON externo, formulário, etc).
 */
function isValidActivityLevel(level: string): level is keyof typeof ACTIVITY_MULTIPLIERS {
  return Object.prototype.hasOwnProperty.call(ACTIVITY_MULTIPLIERS, level);
}

// ─── Cálculo principal ───────────────────────────────────────

/**
 * Estima o gasto energético total diário (TDEE) a partir do perfil do usuário.
 *
 *   TDEE = BMR × multiplicadorDeAtividade
 *
 * Onde `multiplicadorDeAtividade` (PAL — Physical Activity Level) vem de
 * `ACTIVITY_MULTIPLIERS`, baseado em Mifflin-St Jeor canônico.
 *
 * Retorna `EnergyEstimate` contendo BMR e TDEE (ambos em kcal/dia, não arredondados):
 *  - `bmr` permite UI exibir o intermediário ("você queima X em repouso")
 *  - `tdee` é o número que vira input pros cálculos de objetivo (cutting/bulking)
 *
 * Validação:
 *  - Reusa `calculateBMR` (idade/peso/altura/sexo/BF%)
 *  - Valida adicionalmente `activityLevel` contra ACTIVITY_MULTIPLIERS
 *
 * Sem arredondamento: precisão preservada pra pipeline downstream.
 */
export function calculateTDEE(stats: UserStats): Result<EnergyEstimate> {
  // 1) BMR (já valida idade/peso/altura/sexo/BF%)
  const bmrResult = calculateBMR(stats);
  if (!bmrResult.ok) return bmrResult;

  // 2) Validação do activityLevel contra a tabela de multiplicadores.
  // Esse check é mais estrito que o de calculateBMR (que só valida string não-vazia).
  if (!isValidActivityLevel(stats.activityLevel)) {
    return err({
      code: 'INVALID_ACTIVITY_LEVEL',
      field: 'activityLevel',
      message: `Nível de atividade "${stats.activityLevel}" não é reconhecido.`,
    });
  }

  // 3) Cálculo do TDEE
  const bmr = bmrResult.value;
  const multiplier = ACTIVITY_MULTIPLIERS[stats.activityLevel];
  const tdee = bmr * multiplier;

  // 4) Sanity check defensivo
  if (!Number.isFinite(tdee) || tdee <= 0) {
    return err({
      code: 'COMPUTATION_FAILED',
      message: 'Falha ao calcular TDEE: resultado inválido.',
    });
  }

  return { ok: true, value: { bmr, tdee } };
}