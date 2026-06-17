import { getDatabase } from '../database';
import type { UserProfile } from '@/types/userProfile';
import { MACRO_PROFILES, GOAL_CALORIE_PCT } from '@/utils/tdee';
import type { Sex, ActivityLevel } from '@/utils/tdee';

const PROFILE_ID = 'default';

// ─── Helpers de validação ────────────────────────────────────

function isSex(v: unknown): v is Sex {
  return v === 'male' || v === 'female';
}

function isActivityLevel(v: unknown): v is ActivityLevel {
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
  body_fat_pct: number | null;
  atualizada_em: number;
}

// ─── Operações ───────────────────────────────────────────────

export async function get(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserProfileRow>(
    `SELECT * FROM user_profile WHERE id = ?`,
    [PROFILE_ID]
  );

  if (!row) return null;

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
    bodyFatPct: row.body_fat_pct ?? undefined,
  };
}

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
  if (
    profile.bodyFatPct !== undefined &&
    (!Number.isFinite(profile.bodyFatPct) || profile.bodyFatPct < 3 || profile.bodyFatPct > 60)
  ) {
    throw new Error(
      `userProfileRepo.save: bodyFatPct inválido (${profile.bodyFatPct})`
    );
  }

  const db = await getDatabase();
  const now = Date.now();

  await db.runAsync(
    `INSERT OR REPLACE INTO user_profile
       (id, sex, age, weight_kg, height_cm, activity_level, body_fat_pct, atualizada_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      PROFILE_ID,
      profile.sex,
      profile.age,
      profile.weightKg,
      profile.heightCm,
      profile.activityLevel,
      profile.bodyFatPct ?? null,
      now,
    ]
  );
}
