import type { Macros, CarbProfile, Result, TDEEError } from './types';
import { KCAL_PER_GRAM, MACRO_PROFILES } from './constants';

// ─── Helper local ────────────────────────────────────────────

function err(error: TDEEError): Result<never> {
  return { ok: false, error };
}

function isValidCarbProfile(p: string): p is CarbProfile {
  return Object.prototype.hasOwnProperty.call(MACRO_PROFILES, p);
}

// ─── Cálculo principal ───────────────────────────────────────

/**
 * Distribui um alvo calórico em proteína, carbo e gordura segundo um perfil.
 *
 * Estratégia de rounding (combinada):
 *  1. proteinG e fatG calculados em float e arredondados (Math.round).
 *  2. carbG calculado por DIFERENÇA: (kcal − proteinG·4 − fatG·9) / 4,
 *     depois arredondado. Carbo absorve qualquer drift de arredondamento
 *     (escolha consciente — carbo é o macro mais flexível na prática).
 *  3. kcal retornado é o RECALCULADO a partir dos macros arredondados,
 *     garantindo coerência visual entre soma e total (UI exibe valores
 *     consistentes; sem "2200 kcal" exibido com macros que somam 2198).
 *
 * Drift máximo esperado vs `kcal` de entrada: ±2 kcal. Aceitável.
 *
 * Função 100% pura. Não recebe perfil de usuário — só alvo calórico
 * + perfil de carbo. Validações:
 *  - kcal finito e > 0
 *  - carbProfile presente em MACRO_PROFILES
 */
export function calculateMacros(kcal: number, carbProfile: CarbProfile): Result<Macros> {
  // 1) Validação
  if (!Number.isFinite(kcal) || kcal <= 0) {
    return err({
      code: 'COMPUTATION_FAILED',
      message: `Alvo calórico inválido: ${kcal}.`,
    });
  }

  if (!isValidCarbProfile(carbProfile)) {
    return err({
      code: 'INVALID_CARB_PROFILE',
      message: `Perfil de carbo "${carbProfile}" não é reconhecido.`,
    });
  }

  const distribution = MACRO_PROFILES[carbProfile];

  // 2) Calcula proteína e gordura (gramas) — arredondamento padrão
  const proteinG = Math.round((kcal * distribution.proteinPct) / KCAL_PER_GRAM.protein);
  const fatG     = Math.round((kcal * distribution.fatPct)     / KCAL_PER_GRAM.fat);

  // 3) Carbo absorve o drift: calculado pelo que sobra do alvo após P e F.
  // Math.max evita carbo negativo em caso extremo (kcal muito baixo + perfil
  // com proteinPct + fatPct levando a P·4 + F·9 > kcal após arredondar).
  const remainingKcal = kcal - proteinG * KCAL_PER_GRAM.protein - fatG * KCAL_PER_GRAM.fat;
  const carbG = Math.max(0, Math.round(remainingKcal / KCAL_PER_GRAM.carb));

  // 4) kcal retornado é o REALIZADO (soma dos macros arredondados)
  // Garante: kcal_final ≡ proteinG·4 + carbG·4 + fatG·9
  const kcalFinal =
    proteinG * KCAL_PER_GRAM.protein +
    carbG    * KCAL_PER_GRAM.carb +
    fatG     * KCAL_PER_GRAM.fat;

  return {
    ok: true,
    value: { kcal: kcalFinal, proteinG, carbG, fatG },
  };
}