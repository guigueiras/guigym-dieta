import { nanoid } from 'nanoid/non-secure';
import { getDatabase } from '../database';
import { DIAS_SEMANA, REFEICOES_PADRAO } from '@/constants';
import type { Dieta, TipoDieta, DiaSemana, DietTargets, DuracaoConfig, Semana, Dia } from '@/types';
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

interface TargetsRow {
  target_calories: number | null;
  target_protein_g: number | null;
  target_carb_g: number | null;
  target_fat_g: number | null;
  target_goal: string | null;
  target_carb_profile: string | null;
}

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

function parseDuracao(
  tipo: string | null,
  quantidade: number | null,
  diaInicio: string | null,
): DuracaoConfig {
  if (tipo === 'semanas' && quantidade != null && quantidade >= 1) {
    return { tipo: 'semanas', quantidade, diaInicio: (diaInicio as DiaSemana | null) };
  }
  if (tipo === 'dias' && quantidade != null && quantidade >= 1) {
    return { tipo: 'dias', quantidade, diaInicio: (diaInicio as DiaSemana | null) };
  }
  return { tipo: 'indefinida' };
}

// ─── Leitura ─────────────────────────────────────────────────

type DietaRow = {
  id: string; nome: string; tipo: TipoDieta | null;
  criada_em: number; atualizada_em: number;
  target_calories: number | null; target_protein_g: number | null;
  target_carb_g: number | null; target_fat_g: number | null;
  target_goal: string | null; target_carb_profile: string | null;
  duracao_tipo: string | null; duracao_quantidade: number | null;
  duracao_dia_inicio: string | null;
};

type SemanaRow = { id: string; dieta_id: string; numero: number };

type RefeicaoRow = {
  id: string; semana_id: string; dia: DiaSemana;
  nome: string; ordem: number; dia_indice: number | null;
};

type ItemRow = {
  id: string; refeicao_id: string;
  alimento_id: string; quantidade: number; ordem: number;
};

function buildSemanas(
  semanaRows: SemanaRow[],
  refeicaoRows: RefeicaoRow[],
  itemRows: ItemRow[],
  dietaId: string,
  duracao: DuracaoConfig,
): Semana[] {
  const meusSemanas = semanaRows
    .filter((s) => s.dieta_id === dietaId)
    .sort((a, b) => a.numero - b.numero);

  return meusSemanas.map((s) => {
    const minhasRefs = refeicaoRows
      .filter((r) => r.semana_id === s.id)
      .sort((a, b) => a.ordem - b.ordem);

    // Determina quais chaves de dia usar
    const diasKeys = getDiasParaSemana(s.numero, duracao);

    const dias: Dia[] = diasKeys.map((diaKey) => ({
      nome: diaKey.nome,
      ...(diaKey.indice !== undefined ? { indice: diaKey.indice } : {}),
      refeicoes: minhasRefs
        .filter((r) =>
          r.dia === diaKey.nome &&
          (diaKey.indice === undefined || r.dia_indice === diaKey.indice)
        )
        .map((r) => ({
          id: r.id,
          nome: r.nome,
          ordem: r.ordem,
          alimentos: itemRows
            .filter((i) => i.refeicao_id === r.id)
            .sort((a, b) => a.ordem - b.ordem)
            .map((i) => ({
              id: i.id,
              alimentoId: i.alimento_id,
              quantidade: i.quantidade,
            })),
        })),
    }));

    return { id: s.id, numero: s.numero, dias };
  });
}

/** Chave de identificação de um dia dentro de uma semana. */
interface DiaKey {
  nome: DiaSemana;
  indice?: number; // só para modo dias
}

const ORDEM_DIAS: DiaSemana[] = [
  'segunda','terca','quarta','quinta','sexta','sabado','domingo',
];

function getDiasParaSemana(
  numeroSemana: number,
  duracao: DuracaoConfig,
): DiaKey[] {
  if (duracao.tipo === 'indefinida' || duracao.tipo === 'semanas') {
    return DIAS_SEMANA.map((d) => ({ nome: d.key as DiaSemana }));
  }

  // Modo dias
  const { quantidade, diaInicio } = duracao;
  const startIdx = diaInicio
    ? ORDEM_DIAS.indexOf(diaInicio)
    : 0;

  // Semana 1: índices 1..min(7,quantidade)
  // Semana 2: índices 8..min(14,quantidade) — mas no modo dias usamos 1 semana só
  const inicio = (numeroSemana - 1) * 7 + 1;
  const fim = Math.min(numeroSemana * 7, quantidade);

  const keys: DiaKey[] = [];
  for (let i = inicio; i <= fim; i++) {
    const diaNome = ORDEM_DIAS[(startIdx + i - 1) % 7];
    keys.push({ nome: diaNome, indice: quantidade > 7 ? i : undefined });
  }
  return keys;
}

export async function listAll(): Promise<Dieta[]> {
  const db = await getDatabase();

  const dietasRaw = await db.getAllAsync<DietaRow>(
    'SELECT * FROM dietas ORDER BY atualizada_em DESC'
  );
  if (dietasRaw.length === 0) return [];

  const dietaIds = dietasRaw.map((d) => d.id);
  const ph = dietaIds.map(() => '?').join(',');

  const semanaRows = await db.getAllAsync<SemanaRow>(
    `SELECT id, dieta_id, numero FROM semanas WHERE dieta_id IN (${ph}) ORDER BY numero ASC`,
    dietaIds
  );

  const semanaIds = semanaRows.map((s) => s.id);
  if (semanaIds.length === 0) {
    return dietasRaw.map((d) => ({
      id: d.id, nome: d.nome,
      duracao: { tipo: 'indefinida' } as DuracaoConfig,
      semanas: [],
      criadaEm: d.criada_em, atualizadaEm: d.atualizada_em,
      ...(d.tipo !== null ? { tipo: d.tipo } : {}),
      ...(extractTargetsFromRow(d) !== undefined ? { targets: extractTargetsFromRow(d) } : {}),
    }));
  }

  const semPh = semanaIds.map(() => '?').join(',');
  const refeicaoRows = await db.getAllAsync<RefeicaoRow>(
    `SELECT id, semana_id, dia, nome, ordem, dia_indice
     FROM refeicoes WHERE semana_id IN (${semPh}) ORDER BY ordem ASC`,
    semanaIds
  );

  const refIds = refeicaoRows.map((r) => r.id);
  const itemRows = refIds.length === 0 ? [] : await db.getAllAsync<ItemRow>(
    `SELECT id, refeicao_id, alimento_id, quantidade, ordem
     FROM alimentos_refeicao WHERE refeicao_id IN (${refIds.map(() => '?').join(',')}) ORDER BY ordem ASC`,
    refIds
  );

  return dietasRaw.map((d) => {
    const duracao = parseDuracao(d.duracao_tipo, d.duracao_quantidade, d.duracao_dia_inicio);
    const targets = extractTargetsFromRow(d);
    const semanas = buildSemanas(semanaRows, refeicaoRows, itemRows, d.id, duracao);
    return {
      id: d.id, nome: d.nome, duracao, semanas,
      criadaEm: d.criada_em, atualizadaEm: d.atualizada_em,
      ...(d.tipo !== null ? { tipo: d.tipo } : {}),
      ...(targets !== undefined ? { targets } : {}),
    };
  });
}

// ─── Escrita ─────────────────────────────────────────────────

function duracaoToRow(duracao: DuracaoConfig): {
  tipo: string; quantidade: number | null; diaInicio: string | null;
} {
  if (duracao.tipo === 'indefinida') {
    return { tipo: 'indefinida', quantidade: null, diaInicio: null };
  }
  return {
    tipo: duracao.tipo,
    quantidade: duracao.quantidade,
    diaInicio: duracao.diaInicio,
  };
}

export async function criar(
  nome: string,
  duracao: DuracaoConfig = { tipo: 'indefinida' },
  targets?: DietTargets,
): Promise<Dieta> {
  const db = await getDatabase();
  const id = nanoid();
  const semanaId = nanoid();
  const now = Date.now();
  const tipo: TipoDieta | null = targets ? goalToTipo(targets.goal) : null;
  const dur = duracaoToRow(duracao);

  // Monta semanas e dias
  const numSemanas = duracao.tipo === 'semanas'
    ? duracao.quantidade
    : duracao.tipo === 'dias'
      ? Math.ceil(duracao.quantidade / 7)
      : 1;
  const semanas: Semana[] = [];

  await db.withTransactionAsync(async () => {
    // Insere dieta
    await db.runAsync(
      `INSERT INTO dietas
         (id, nome, tipo, criada_em, atualizada_em,
          target_calories, target_protein_g, target_carb_g, target_fat_g,
          target_goal, target_carb_profile,
          duracao_tipo, duracao_quantidade, duracao_dia_inicio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, nome, tipo, now, now,
        targets?.calories ?? null, targets?.proteinG ?? null,
        targets?.carbG ?? null, targets?.fatG ?? null,
        targets?.goal ?? null, targets?.carbProfile ?? null,
        dur.tipo, dur.quantidade, dur.diaInicio,
      ]
    );

    for (let n = 1; n <= numSemanas; n++) {
      const sId = n === 1 ? semanaId : nanoid();
      await db.runAsync(
        'INSERT INTO semanas (id, dieta_id, numero) VALUES (?, ?, ?)',
        [sId, id, n]
      );

      const diasKeys = getDiasParaSemana(n, duracao);
      const diasDaSemana: Dia[] = [];

      for (const diaKey of diasKeys) {
        const refeicoes = REFEICOES_PADRAO.map((nomeRef, i) => ({
          id: nanoid(), nome: nomeRef, ordem: i, alimentos: [],
        }));

        for (const r of refeicoes) {
          await db.runAsync(
            `INSERT INTO refeicoes (id, semana_id, dia, nome, ordem, dia_indice)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [r.id, sId, diaKey.nome, r.nome, r.ordem, diaKey.indice ?? null]
          );
        }

        diasDaSemana.push({
          nome: diaKey.nome,
          ...(diaKey.indice !== undefined ? { indice: diaKey.indice } : {}),
          refeicoes,
        });
      }

      semanas.push({ id: sId, numero: n, dias: diasDaSemana });
    }
  });

  return {
    id, nome, duracao, semanas,
    criadaEm: now, atualizadaEm: now,
    ...(tipo !== null ? { tipo } : {}),
    ...(targets !== undefined ? { targets } : {}),
  };
}

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

export async function atualizarTargets(
  dietaId: string,
  targets: DietTargets | null
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();

  if (targets === null) {
    await db.runAsync(
      `UPDATE dietas SET
         tipo = NULL, target_calories = NULL, target_protein_g = NULL,
         target_carb_g = NULL, target_fat_g = NULL,
         target_goal = NULL, target_carb_profile = NULL,
         atualizada_em = ?
       WHERE id = ?`,
      [now, dietaId]
    );
    return;
  }

  if (!Number.isFinite(targets.calories) || targets.calories <= 0)
    throw new Error(`atualizarTargets: calories inválido (${targets.calories})`);
  if (!Number.isFinite(targets.proteinG) || targets.proteinG <= 0)
    throw new Error(`atualizarTargets: proteinG inválido (${targets.proteinG})`);
  if (!Number.isFinite(targets.carbG) || targets.carbG < 0)
    throw new Error(`atualizarTargets: carbG inválido (${targets.carbG})`);
  if (!Number.isFinite(targets.fatG) || targets.fatG < 0)
    throw new Error(`atualizarTargets: fatG inválido (${targets.fatG})`);
  if (!isGoal(targets.goal))
    throw new Error(`atualizarTargets: goal inválido (${targets.goal})`);
  if (!isCarbProfile(targets.carbProfile))
    throw new Error(`atualizarTargets: carbProfile inválido (${targets.carbProfile})`);

  const tipo: TipoDieta = goalToTipo(targets.goal);
  await db.runAsync(
    `UPDATE dietas SET
       tipo = ?, target_calories = ?, target_protein_g = ?,
       target_carb_g = ?, target_fat_g = ?,
       target_goal = ?, target_carb_profile = ?,
       atualizada_em = ?
     WHERE id = ?`,
    [
      tipo, targets.calories, targets.proteinG,
      targets.carbG, targets.fatG,
      targets.goal, targets.carbProfile,
      now, dietaId,
    ]
  );
}
