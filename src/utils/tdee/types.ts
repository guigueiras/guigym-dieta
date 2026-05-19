/**
 * Tipos do domínio TDEE/macros.
 *
 * Convenções:
 *  - Sistema métrico em todo o domínio (kg, cm, anos).
 *  - Todas as calorias em kcal.
 *  - Todas as massas de macro em gramas.
 *  - Funções públicas retornam `Result<T>` — nunca lançam.
 */

// ─── Entradas do usuário ──────────────────────────────────────

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'high'
  | 'very_high';

export type Goal = 'cutting' | 'maintenance' | 'bulking';

export type CarbProfile = 'low_carb' | 'medium_carb' | 'high_carb';

/**
 * Dados antropométricos + atividade. Single source of truth pra todos os cálculos.
 * `bodyFatPct` é opcional: quando presente, prioriza-se LBM (massa magra) pra proteína.
 */
export interface UserStats {
  sex: Sex;
  age: number;          // anos, inteiro
  weightKg: number;     // peso total
  heightCm: number;
  activityLevel: ActivityLevel;
  bodyFatPct?: number;  // 0–100, opcional
}

// ─── Saídas dos cálculos ──────────────────────────────────────

/**
 * Distribuição de macros pra um único alvo calórico.
 * Os valores em gramas são arredondados (regra definida em constants.ts).
 */
export interface Macros {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

/**
 * Macros com contexto: qual objetivo e qual perfil de carbo geraram.
 * Útil pra UI exibir sem precisar carregar contexto externo, e pra
 * persistência futura (serializável direto).
 */
export interface MacroTargets extends Macros {
  goal: Goal;
  carbProfile: CarbProfile;
}

/**
 * Conjunto completo gerado por `calculateDietTargets`:
 * 3 objetivos × 3 perfis = 9 alvos, indexáveis por chave dupla.
 *
 * Shape escolhido (objeto aninhado) pra que a UI possa fazer
 * `targets[goal][carbProfile]` direto sem busca linear.
 */
export type DietTargetsSet = Record<Goal, Record<CarbProfile, MacroTargets>>;

/**
 * Snapshot intermediário com os números brutos antes da distribuição em macros.
 * Útil pra debug, telemetria futura, e pra exibir BMR/TDEE na UI do wizard.
 */
export interface EnergyEstimate {
  bmr: number;   // kcal/dia
  tdee: number;  // kcal/dia
}

// ─── Resultado e erros ────────────────────────────────────────

export type TDEEErrorCode =
  | 'INVALID_SEX'
  | 'INVALID_AGE'
  | 'INVALID_WEIGHT'
  | 'INVALID_HEIGHT'
  | 'INVALID_ACTIVITY_LEVEL'
  | 'INVALID_BODY_FAT'
  | 'INVALID_GOAL'
  | 'INVALID_CARB_PROFILE'
  | 'COMPUTATION_FAILED';

/**
 * Erro do domínio TDEE.
 * `code` é estável (use em testes, i18n, telemetria).
 * `message` é human-readable em pt-BR (use só pra fallback ou debug).
 * `field` aponta qual campo de entrada falhou (quando aplicável).
 */
export interface TDEEError {
  code: TDEEErrorCode;
  message: string;
  field?: keyof UserStats;
}

/**
 * Resultado discriminated union. Toda função pública da engine retorna isso.
 * Consumidor deve checar `result.ok` antes de acessar `value`.
 */
export type Result<T, E = TDEEError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// ─── Opções (extensibilidade futura) ──────────────────────────

/**
 * Overrides opcionais pros cálculos. Hoje suportamos:
 *  - `absoluteCalorieDelta`: força um delta absoluto (ex: -500 kcal) em vez do
 *    percentual padrão. Útil pra preferência manual do usuário (wizard avançado).
 *
 * Estrutura preparada pra crescer: futuras opções (refeed days, cycling,
 * ajustes por gênero, etc) entram aqui sem breaking change.
 */
export interface CalorieAdjustmentOptions {
  absoluteCalorieDelta?: number; // em kcal; positivo = surplus, negativo = déficit
}

export interface CalculateTargetsOptions {
  cutting?: CalorieAdjustmentOptions;
  bulking?: CalorieAdjustmentOptions;
  maintenance?: CalorieAdjustmentOptions;
}