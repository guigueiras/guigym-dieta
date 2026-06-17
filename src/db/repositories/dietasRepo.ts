import { nanoid } from 'nanoid/non-secure';
import { getDatabase } from '../database';
import { DIAS_SEMANA, REFEICOES_PADRAO } from '@/constants';
import type { Dieta, TipoDieta, DiaSemana, DietTargets } from '@/types';
import { goalToTipo } from '@/types';
import { MACRO_PROFILES, GOAL_CALORIE_PCT } from '@/utils/tdee';
import type { Goal, CarbProfile } from '@/utils/tdee';

// ─── Helpers de targets ──────────────────────────────────────

function isGoal(v: string): v is Goal {
  return Object.prototype.hasOwnProperty.call(GOAL_CALORIE_PCT, v);
}

function isCarbProfile(v: string): v is CarbProfile {
  return Object.prototype.hasOwnProperty.call(MACRO_PROFILES, v);
}

function isPositiveNumber(v: number | null): v is number {
  return v != null && Number.isFinite(v) && v > 0;
}

function isNonNegativeNumber(v: number | null): v is number {
  return v != null && Number.isFinite(v) && v >= 0;
}

/**
 * Shape SQL dos targets — sub-conjunto da row de dietas com os 6 campos novos.
 * Definido em separado pra reusar entre `listAll` e `getById` (futuro) sem duplicar.
 */
interface TargetsRow {
  target_calories: number | null;
  target_protein_g: number | null;
  target_carb_g: number | null;
  target_fat_g: number | null;
  target_goal: string | null;
  target_carb_profile: string | null;
}

/**
 * Reconstrói `DietTargets` a partir das 6 colunas SQL da row.
 *
 * Regra: atomicidade. TODOS os 6 campos devem ser válidos pra targets existir.
 * Se algum falhar (null, NaN, valor não-reconhecido), retorna `undefined` —
 * dieta aparece como "sem meta" em vez de meta parcialmente corrompida.
 *
 * Validação:
 *  - calories, proteinG: devem ser > 0 (faz sentido em qualquer dieta)
 *  - carbG, fatG: aceita 0 (dietas extremas como keto podem zerar carbo)
 *  - goal, carbProfile: devem bater com os enums canônicos da engine
 *
 * Defesa em camadas: complementa a validação que é feita na escrita
 * (`atualizarTargets`). Mesmo se um bug futuro escrever valores inconsistentes,
 * a leitura é segura — pior caso é a dieta aparecer sem targets.
 */
function extractTargetsFromRow(r: TargetsRow): DietTargets | undefined {
  if (!isPositiveNumber(r.target_calories)) return undefined;
  if (!isPositiveNumber(r.target_protein_g)) return undefined;
  if (!isNonNegativeNumber(r.target_carb_g)) return undefined;
  if (!isNonNegativeNumber(r.target_fat_g)) return undefined;
  if (r.target_goal == null || !isGoal(r.target_goal)) return undefined;
  if (r.target_carb_profile == null || !isCarbProfile(r.target_carb_profile)) return undefined;

  return {
    calories: r.target_calories,
    proteinG: r.target_protein_g,
    carbG: r.target_carb_g,
    fatG: r.target_fat_g,
    goal: r.target_goal,
    carbProfile: r.target_carb_profile,
  };
}

export async function listAll(): Promise<Dieta[]> {
  const db = await getDatabase();
  const dietasRaw = await db.getAllAsync<{
    id: string;
    nome: string;
    tipo: TipoDieta | null;
    criada_em: number;
    atualizada_em: number;
    target_calories: number | null;
    target_protein_g: number | null;
    target_carb_g: number | null;
    target_fat_g: number | null;
    target_goal: string | null;
    target_carb_profile: string | null;
  }>('SELECT * FROM dietas ORDER BY atualizada_em DESC');

  if (dietasRaw.length === 0) return [];

  const ids = dietasRaw.map((d) => d.id);
  const placeholders = ids.map(() => '?').join(',');

  const refsRaw = await db.getAllAsync<{
    id: string; dieta_id: string; dia: DiaSemana; nome: string; ordem: number;
  }>(`SELECT * FROM refeicoes WHERE dieta_id IN (${placeholders}) ORDER BY ordem ASC`, ids);

  const refIds = refsRaw.map((r) => r.id);
  const itensRaw = refIds.length === 0 ? [] : await db.getAllAsync<{
    id: string; refeicao_id: string; alimento_id: string; quantidade: number; ordem: number;
  }>(
    `SELECT * FROM alimentos_refeicao WHERE refeicao_id IN (${refIds.map(() => '?').join(',')}) ORDER BY ordem ASC`,
    refIds
  );

  return dietasRaw.map((d) => {
    const dias = DIAS_SEMANA.map((dia) => ({
      nome: dia.key as DiaSemana,
      refeicoes: refsRaw
        .filter((r) => r.dieta_id === d.id && r.dia === dia.key)
        .sort((a, b) => a.ordem - b.ordem)
        .map((r) => ({
          id: r.id,
          nome: r.nome,
          ordem: r.ordem,
          alimentos: itensRaw
            .filter((i) => i.refeicao_id === r.id)
            .sort((a, b) => a.ordem - b.ordem)
            .map((i) => ({
              id: i.id,
              alimentoId: i.alimento_id,
              quantidade: i.quantidade,
            })),
        })),
    }));

    const targets = extractTargetsFromRow(d);
    return {
      id: d.id,
      nome: d.nome,
      dias,
      criadaEm: d.criada_em,
      atualizadaEm: d.atualizada_em,
      ...(d.tipo !== null ? { tipo: d.tipo } : {}),
      ...(targets !== undefined ? { targets } : {}),
    };
  });
}

/**
 * Cria uma nova dieta.
 *
 * Targets opcionais: se fornecidos, a dieta nasce com meta configurada
 * e o `tipo` é derivado de `targets.goal` (via goalToTipo). Sem targets,
 * `tipo` fica null (sem categoria visual).
 *
 * Transação atômica: dieta + refeições + (opcionalmente) targets são
 * gravados juntos. Se qualquer parte falhar, rollback completo.
 */
export async function criar(
  nome: string,
  targets?: DietTargets
): Promise<Dieta> {
  const db = await getDatabase();
  const id = nanoid();
  const now = Date.now();

  // Tipo é derivado do goal (quando há meta) ou null (sem meta)
  const tipo: TipoDieta | null = targets ? goalToTipo(targets.goal) : null;

  const dias = DIAS_SEMANA.map((dia) => ({
    nome: dia.key as DiaSemana,
    refeicoes: REFEICOES_PADRAO.map((nomeRef, i) => ({
      id: nanoid(),
      nome: nomeRef,
      ordem: i,
      alimentos: [],
    })),
  }));

  await db.withTransactionAsync(async () => {
    // 1) Insere a dieta. Se há targets, grava as 6 colunas junto.
    if (targets) {
      await db.runAsync(
        `INSERT INTO dietas
           (id, nome, tipo, criada_em, atualizada_em,
            target_calories, target_protein_g, target_carb_g, target_fat_g,
            target_goal, target_carb_profile)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, nome, tipo, now, now,
          targets.calories, targets.proteinG, targets.carbG, targets.fatG,
          targets.goal, targets.carbProfile,
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO dietas (id, nome, tipo, criada_em, atualizada_em)
         VALUES (?, ?, ?, ?, ?)`,
        [id, nome, tipo, now, now]
      );
    }

    // 2) Insere as refeições padrão pra cada dia
    for (const d of dias) {
      for (const r of d.refeicoes) {
        await db.runAsync(
          `INSERT INTO refeicoes (id, dieta_id, dia, nome, ordem) VALUES (?, ?, ?, ?, ?)`,
          [r.id, id, d.nome, r.nome, r.ordem]
        );
      }
    }
  });

  // Monta o objeto Dieta retornado
  const dieta: Dieta = {
    id,
    nome,
    dias,
    criadaEm: now,
    atualizadaEm: now,
    ...(tipo !== null ? { tipo } : {}),
    ...(targets !== undefined ? { targets } : {}),
  };

  return dieta;
}

/**
 * Renomeia uma dieta. Não toca em outros campos (tipo, targets, refeições).
 * O `tipo` é derivado de targets na criação/atualização de meta — nunca aqui.
 */
export async function renomear(id: string, nome: string): Promise<Dieta> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    `UPDATE dietas SET nome = ?, atualizada_em = ? WHERE id = ?`,
    [nome, now, id]
  );
  const todas = await listAll();
  const found = todas.find((d) => d.id === id);
  if (!found) throw new Error('Dieta não encontrada após atualização');
  return found;
}

export async function excluir(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM dietas WHERE id = ?`, [id]);
}

/**
 * Atualiza (ou limpa) os targets nutricionais de uma dieta.
 *
 * Comportamento:
 *  - `targets: DietTargets` → preenche as 6 colunas + atualiza `tipo`
 *    derivado do `targets.goal`.
 *  - `targets: null` → seta as 6 colunas e o `tipo` pra NULL
 *    (volta ao estado "sem meta, sem tipo").
 *
 * Sanitização: valida o objeto antes de gravar. Se `targets` tem campos
 * inválidos (NaN, negativos, goal inválido), lança erro. UI deve garantir
 * input válido — esta função é a última linha de defesa, não substitui
 * validação no formulário.
 *
 * Atualiza `atualizada_em` automaticamente. Não toca em outros campos
 * (nome, refeições) — chamadas isoladas e atômicas.
 */
export async function atualizarTargets(
  dietaId: string,
  targets: DietTargets | null
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();

  if (targets === null) {
    await db.runAsync(
      `UPDATE dietas SET
         tipo = NULL,
         target_calories = NULL,
         target_protein_g = NULL,
         target_carb_g = NULL,
         target_fat_g = NULL,
         target_goal = NULL,
         target_carb_profile = NULL,
         atualizada_em = ?
       WHERE id = ?`,
      [now, dietaId]
    );
    return;
  }

  // Validação defensiva antes de gravar
  if (!Number.isFinite(targets.calories) || targets.calories <= 0) {
    throw new Error(`atualizarTargets: calories inválido (${targets.calories})`);
  }
  if (!Number.isFinite(targets.proteinG) || targets.proteinG <= 0) {
    throw new Error(`atualizarTargets: proteinG inválido (${targets.proteinG})`);
  }
  if (!Number.isFinite(targets.carbG) || targets.carbG < 0) {
    throw new Error(`atualizarTargets: carbG inválido (${targets.carbG})`);
  }
  if (!Number.isFinite(targets.fatG) || targets.fatG < 0) {
    throw new Error(`atualizarTargets: fatG inválido (${targets.fatG})`);
  }
  if (!isGoal(targets.goal)) {
    throw new Error(`atualizarTargets: goal inválido (${targets.goal})`);
  }
  if (!isCarbProfile(targets.carbProfile)) {
    throw new Error(`atualizarTargets: carbProfile inválido (${targets.carbProfile})`);
  }

  const tipo: TipoDieta = goalToTipo(targets.goal);

  await db.runAsync(
    `UPDATE dietas SET
       tipo = ?,
       target_calories = ?,
       target_protein_g = ?,
       target_carb_g = ?,
       target_fat_g = ?,
       target_goal = ?,
       target_carb_profile = ?,
       atualizada_em = ?
     WHERE id = ?`,
    [
      tipo,
      targets.calories,
      targets.proteinG,
      targets.carbG,
      targets.fatG,
      targets.goal,
      targets.carbProfile,
      now,
      dietaId,
    ]
  );
}
