import type { ActivityLevel, CarbProfile, Goal } from './types';

// ─── Constantes físicas ───────────────────────────────────────

/**
 * Calorias por grama de cada macronutriente (Atwater factors).
 * Constantes universais — não devem ser ajustadas.
 */
export const KCAL_PER_GRAM = {
  protein: 4,
  carb: 4,
  fat: 9,
} as const;

// ─── Multiplicadores de atividade (PAL — Physical Activity Level) ──

/**
 * Mifflin-St Jeor canônico. Multiplica BMR pra obter TDEE.
 *
 *  - sedentary  : pouco/nenhum exercício
 *  - light      : 1–3x/semana
 *  - moderate   : 3–5x/semana
 *  - high       : 6–7x/semana
 *  - very_high  : 2x/dia ou trabalho físico pesado
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  high:      1.725,
  very_high: 1.9,
} as const;

// ─── Ajuste calórico por objetivo ────────────────────────────

/**
 * Delta percentual padrão aplicado ao TDEE pra obter as calorias alvo.
 *  - cutting     : -20% (déficit moderado, sustentável)
 *  - maintenance : 0    (manutenção exata)
 *  - bulking     : +10% (superávit conservador, minimiza ganho de gordura)
 *
 * Valores percentuais escalam com o tamanho do indivíduo, diferentes
 * de delta absoluto que ficaria agressivo demais pra TDEEs baixos.
 *
 * Override absoluto disponível via `CalorieAdjustmentOptions.absoluteCalorieDelta`
 * (ex: usuário avançado pede -500 kcal exatos em vez do percentual).
 */
export const GOAL_CALORIE_PCT: Record<Goal, number> = {
  cutting:     -0.20,
  maintenance:  0,
  bulking:     +0.10,
} as const;

// ─── Perfis de distribuição de macros ────────────────────────

/**
 * Distribuição percentual das calorias totais por macronutriente.
 * As três porcentagens DEVEM somar 100 — validado em runtime no boot
 * (assertion abaixo). Se você editar esses valores, mantenha a soma.
 *
 * Proteína intencionalmente alta nos três perfis (≥30%) pra:
 *  - retenção muscular em cutting
 *  - saciedade
 *  - efeito térmico mais alto que carbo/gordura
 *
 * O que varia entre perfis: razão carbo↔gordura.
 */
export interface MacroDistribution {
  proteinPct: number; // 0–1
  fatPct: number;     // 0–1
  carbPct: number;    // 0–1
}

export const MACRO_PROFILES: Record<CarbProfile, MacroDistribution> = {
  low_carb: {
    proteinPct: 0.40,
    fatPct:     0.40,
    carbPct:    0.20,
  },
  medium_carb: {
    proteinPct: 0.30,
    fatPct:     0.35,
    carbPct:    0.35,
  },
  high_carb: {
    proteinPct: 0.30,
    fatPct:     0.20,
    carbPct:    0.50,
  },
} as const;

// ─── Validação de entrada ────────────────────────────────────

/**
 * Ranges aceitos pra inputs do usuário. Fora desses intervalos,
 * a engine retorna `Result.error` com `TDEEErrorCode` apropriado.
 *
 * Format: tuple `[min, max]` inclusivo em ambos os lados.
 */
export const VALIDATION_RANGES = {
  age:          [14, 100] as const,  // anos
  weightKg:     [30, 300] as const,
  heightCm:     [100, 250] as const,
  bodyFatPct:   [3, 60] as const,
} as const;

// ─── Validação de invariantes em boot ────────────────────────

/**
 * Garantia em runtime de que os perfis somam 100%. Executa uma única vez
 * quando este módulo é importado. Se um perfil quebrar a invariante, falha
 * imediatamente em dev (loud) e silenciosamente passa em produção via no-op
 * — em prod, a única consequência é cálculos com drift maior, não crash.
 *
 * Tolerância de 0.001 evita falsos positivos por erro de ponto flutuante.
 */
const PCT_SUM_TOLERANCE = 0.001;

function assertMacroProfilesSumTo100(): void {
  for (const [profile, dist] of Object.entries(MACRO_PROFILES)) {
    const sum = dist.proteinPct + dist.fatPct + dist.carbPct;
    if (Math.abs(sum - 1) > PCT_SUM_TOLERANCE) {
      const msg =
        `[tdee/constants] Macro profile "${profile}" sums to ${sum.toFixed(4)}, ` +
        `expected 1.0 (±${PCT_SUM_TOLERANCE}).`;
      if (__DEV__) {
        throw new Error(msg);
      } else {
        // eslint-disable-next-line no-console
        console.error(msg);
      }
    }
  }
}

assertMacroProfilesSumTo100();