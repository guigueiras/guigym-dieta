import { getDatabase } from '../database';
import type { UserProfile } from '@/types/userProfile';
import { MACRO_PROFILES, GOAL_CALORIE_PCT } from '@/utils/tdee';
import type { Sex, ActivityLevel } from '@/utils/tdee';

/**
 * Repository do UserProfile.
 *
 * Modelo: single-row. A tabela tem 0 ou 1 linha, sempre com id='default'.
 *
 * Semântica:
 *  - get(): retorna o perfil se completo e válido, null se faltar
 *    qualquer campo ou estiver corrompido. Defesa em camadas.
 *  - save(): grava (INSERT OR REPLACE) o perfil completo. Valida antes
 *    de gravar — perfil parcial não pode ser persistido por design.
 */

const PROFILE_ID = 'default';

// ─── Helpers de validação ────────────────────────────────────

function isSex(v: unknown): v is Sex {
  return v === 'male' || v === 'female';
}

function isActivityLevel(v: unknown): v is ActivityLevel {
  // Usa MACRO_PROFILES ou GOAL_CALORIE_PCT? Nenhum dos dois lista atividades.
  // ACTIVITY_MULTIPLIERS é o canônico, mas pra manter import enxuto,
  // hardcode os 5 valores (espelha o enum da engine).
  return (
    v === 'sedentary' ||
    v === 'light' ||
    v === 'moderate' ||
    v === 'high' ||
    v === 'very_high'
  );
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

function isPositiveNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

// Marca para silenciar warning de imports não utilizados (mantemos as
// importações disponíveis caso futuras validações usem essas constantes).
void MACRO_PROFILES;
void GOAL_CALORIE_PCT;

// ─── Tipo da row SQL ─────────────────────────────────────────

interface UserProfileRow {
  id: string;
  sex: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: string | null;
  atualizada_em: number;
}

// ─── Operações ───────────────────────────────────────────────

/**
 * Lê o perfil salvo.
 *
 * Regra: retorna UserProfile APENAS se todos os 5 campos estão
 * preenchidos e válidos. Caso contrário, retorna null (perfil
 * inexistente do ponto de vista do app). Defesa em camadas: se um
 * bug futuro escrever dados parciais, leitura permanece segura.
 */
export async function get(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserProfileRow>(
    `SELECT * FROM user_profile WHERE id = ?`,
    [PROFILE_ID]
  );

  if (!row) return null;

  // Validação atômica: todos os campos devem ser válidos
  if (!isSex(row.sex)) return null;
  if (!isPositiveInt(row.age)) return null;
  if (!isPositiveNumber(row.weight_kg)) return null;
  if (!isPositiveNumber(row.height_cm)) return null;
  if (!isActivityLevel(row.activity_level)) return null;

  return {
    sex: row.sex,
    age: row.age,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    activityLevel: row.activity_level,
  };
}

/**
 * Grava o perfil completo (INSERT OR REPLACE).
 *
 * Valida o input antes de gravar. Se receber valores inválidos,
 * lança erro — quem chama deve garantir input correto (UI é a
 * camada responsável, este é defesa).
 *
 * Atualiza `atualizada_em` automaticamente.
 */
export async function save(profile: UserProfile): Promise<void> {
  if (!isSex(profile.sex)) {
    throw new Error(`userProfileRepo.save: sex inválido (${profile.sex})`);
  }
  if (!isPositiveInt(profile.age)) {
    throw new Error(`userProfileRepo.save: age inválido (${profile.age})`);
  }
  if (!isPositiveNumber(profile.weightKg)) {
    throw new Error(`userProfileRepo.save: weightKg inválido (${profile.weightKg})`);
  }
  if (!isPositiveNumber(profile.heightCm)) {
    throw new Error(`userProfileRepo.save: heightCm inválido (${profile.heightCm})`);
  }
  if (!isActivityLevel(profile.activityLevel)) {
    throw new Error(
      `userProfileRepo.save: activityLevel inválido (${profile.activityLevel})`
    );
  }

  const db = await getDatabase();
  const now = Date.now();

  await db.runAsync(
    `INSERT OR REPLACE INTO user_profile
       (id, sex, age, weight_kg, height_cm, activity_level, atualizada_em)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      PROFILE_ID,
      profile.sex,
      profile.age,
      profile.weightKg,
      profile.heightCm,
      profile.activityLevel,
      now,
    ]
  );
}
