import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid/non-secure';
import type { Dieta, DiaSemana, Refeicao, AlimentoNaRefeicao } from '@/types';
import { useDietasStore } from './useDietasStore';
import * as repo from '@/db/repositories/editDietaRepo';

interface EditState {
  dietaOriginal: Dieta | null;
  dietaEditada: Dieta | null;
  semanaAtiva: number;
  diaAtivo: DiaSemana;
  isDirty: boolean;
  saving: boolean;

  iniciar: (dieta: Dieta) => void;
  setSemanaAtiva: (n: number) => void;
  setDiaAtivo: (d: DiaSemana) => void;
  descartar: () => void;
  salvar: () => Promise<void>;

  addRefeicao: (dia: DiaSemana, nome?: string) => void;
  removeRefeicao: (dia: DiaSemana, refeicaoId: string) => void;
  renameRefeicao: (dia: DiaSemana, refeicaoId: string, nome: string) => void;
  reorderRefeicoes: (dia: DiaSemana, novaOrdemIds: string[]) => void;

  addAlimentoNaRefeicao: (dia: DiaSemana, refeicaoId: string, alimentoId: string, quantidade: number) => string;
  updateQuantidade: (dia: DiaSemana, refeicaoId: string, alimentoNaRefId: string, quantidade: number) => void;
  removeAlimento: (dia: DiaSemana, refeicaoId: string, alimentoNaRefId: string) => void;
}

const REFEICAO_PADRAO_NOME = 'Nova refeição';

function deepEqualDieta(a: Dieta, b: Dieta): boolean {
  if (a.nome !== b.nome || a.tipo !== b.tipo) return false;
  if (a.semanas.length !== b.semanas.length) return false;
  for (let si = 0; si < a.semanas.length; si++) {
    const sa = a.semanas[si], sb = b.semanas[si];
    if (sa.dias.length !== sb.dias.length) return false;
    for (let i = 0; i < sa.dias.length; i++) {
      const da = sa.dias[i], db = sb.dias[i];
      if (da.refeicoes.length !== db.refeicoes.length) return false;
      for (let j = 0; j < da.refeicoes.length; j++) {
        const ra = da.refeicoes[j], rb = db.refeicoes[j];
        if (ra.id !== rb.id || ra.nome !== rb.nome || ra.ordem !== rb.ordem) return false;
        if (ra.alimentos.length !== rb.alimentos.length) return false;
        for (let k = 0; k < ra.alimentos.length; k++) {
          const aa = ra.alimentos[k], ab = rb.alimentos[k];
          if (aa.id !== ab.id || aa.alimentoId !== ab.alimentoId || aa.quantidade !== ab.quantidade) return false;
        }
      }
    }
  }
  return true;
}

const updateDirty = (s: EditState): boolean =>
  !!s.dietaOriginal && !!s.dietaEditada && !deepEqualDieta(s.dietaOriginal, s.dietaEditada);

const mutateDia = (
  dieta: Dieta,
  semanaNumero: number,
  dia: DiaSemana,
  fn: (refs: Refeicao[]) => Refeicao[]
): Dieta => ({
  ...dieta,
  semanas: dieta.semanas.map((s) =>
    s.numero === semanaNumero
      ? {
          ...s,
          dias: s.dias.map((d) =>
            d.nome === dia ? { ...d, refeicoes: fn(d.refeicoes) } : d
          ),
        }
      : s
  ),
});

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

export const useEditDietaStore = create<EditState>((set, get) => ({
  dietaOriginal: null,
  dietaEditada: null,
  semanaAtiva: 1,
  diaAtivo: 'segunda',
  isDirty: false,
  saving: false,

  iniciar: (dieta) => {
    set({
      dietaOriginal: clone(dieta),
      dietaEditada: clone(dieta),
      semanaAtiva: 1,
      diaAtivo: 'segunda',
      isDirty: false,
      saving: false,
    });
  },

  setSemanaAtiva: (n) => set({ semanaAtiva: n }),
  setDiaAtivo: (d) => set({ diaAtivo: d }),

  descartar: () => set({
    dietaOriginal: null,
    dietaEditada: null,
    isDirty: false,
    saving: false,
  }),

  salvar: async () => {
    const { dietaOriginal, dietaEditada } = get();
    if (!dietaOriginal || !dietaEditada) return;
    set({ saving: true });
    try {
      await repo.salvarDietaCompleta(dietaEditada);
      useDietasStore.getState().upsertLocal(dietaEditada);
      set({ dietaOriginal: clone(dietaEditada), isDirty: false, saving: false });
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  addRefeicao: (dia, nome = REFEICAO_PADRAO_NOME) => set((s) => {
    if (!s.dietaEditada) return s;
    const nova: Refeicao = { id: nanoid(), nome, ordem: 999, alimentos: [] };
    const editada = mutateDia(s.dietaEditada, s.semanaAtiva, dia, (refs) =>
      [...refs, nova].map((r, i) => ({ ...r, ordem: i }))
    );
    const next = { ...s, dietaEditada: editada };
    return { ...next, isDirty: updateDirty(next) };
  }),

  removeRefeicao: (dia, refeicaoId) => set((s) => {
    if (!s.dietaEditada) return s;
    const editada = mutateDia(s.dietaEditada, s.semanaAtiva, dia, (refs) =>
      refs.filter((r) => r.id !== refeicaoId).map((r, i) => ({ ...r, ordem: i }))
    );
    const next = { ...s, dietaEditada: editada };
    return { ...next, isDirty: updateDirty(next) };
  }),

  renameRefeicao: (dia, refeicaoId, nome) => set((s) => {
    if (!s.dietaEditada) return s;
    const editada = mutateDia(s.dietaEditada, s.semanaAtiva, dia, (refs) =>
      refs.map((r) => r.id === refeicaoId ? { ...r, nome } : r)
    );
    const next = { ...s, dietaEditada: editada };
    return { ...next, isDirty: updateDirty(next) };
  }),

  reorderRefeicoes: (dia, novaOrdemIds) => set((s) => {
    if (!s.dietaEditada) return s;
    const editada = mutateDia(s.dietaEditada, s.semanaAtiva, dia, (refs) => {
      const map = new Map(refs.map((r) => [r.id, r]));
      return novaOrdemIds
        .map((id, i) => { const r = map.get(id); return r ? { ...r, ordem: i } : null; })
        .filter(Boolean) as Refeicao[];
    });
    const next = { ...s, dietaEditada: editada };
    return { ...next, isDirty: updateDirty(next) };
  }),

  addAlimentoNaRefeicao: (dia, refeicaoId, alimentoId, quantidade) => {
    const novoId = nanoid();
    set((s) => {
      if (!s.dietaEditada) return s;
      const novo: AlimentoNaRefeicao = { id: novoId, alimentoId, quantidade };
      const editada = mutateDia(s.dietaEditada, s.semanaAtiva, dia, (refs) =>
        refs.map((r) => r.id === refeicaoId
          ? { ...r, alimentos: [...r.alimentos, novo] } : r)
      );
      const next = { ...s, dietaEditada: editada };
      return { ...next, isDirty: updateDirty(next) };
    });
    return novoId;
  },

  updateQuantidade: (dia, refeicaoId, alimentoNaRefId, quantidade) => set((s) => {
    if (!s.dietaEditada) return s;
    const editada = mutateDia(s.dietaEditada, s.semanaAtiva, dia, (refs) =>
      refs.map((r) => r.id === refeicaoId
        ? { ...r, alimentos: r.alimentos.map((a) => a.id === alimentoNaRefId ? { ...a, quantidade } : a) }
        : r)
    );
    const next = { ...s, dietaEditada: editada };
    return { ...next, isDirty: updateDirty(next) };
  }),

  removeAlimento: (dia, refeicaoId, alimentoNaRefId) => set((s) => {
    if (!s.dietaEditada) return s;
    const editada = mutateDia(s.dietaEditada, s.semanaAtiva, dia, (refs) =>
      refs.map((r) => r.id === refeicaoId
        ? { ...r, alimentos: r.alimentos.filter((a) => a.id !== alimentoNaRefId) }
        : r)
    );
    const next = { ...s, dietaEditada: editada };
    return { ...next, isDirty: updateDirty(next) };
  }),
}));

export const useEditIsDirty = () => useEditDietaStore((s) => s.isDirty);
export const useEditSaving = () => useEditDietaStore((s) => s.saving);
export const useEditDiaAtivo = () => useEditDietaStore((s) => s.diaAtivo);
export const useEditSemanaAtiva = () => useEditDietaStore((s) => s.semanaAtiva);
export const useEditDietaNome = () => useEditDietaStore((s) => s.dietaEditada?.nome ?? '');

export const useEditRefeicoesDoDia = (dia: DiaSemana) =>
  useEditDietaStore(
    useShallow((s) => {
      const semana = s.dietaEditada?.semanas.find((sem) => sem.numero === s.semanaAtiva);
      return semana?.dias.find((d) => d.nome === dia)?.refeicoes
        .slice().sort((a, b) => a.ordem - b.ordem) ?? [];
    })
  );

export const useEditRefeicao = (dia: DiaSemana, refeicaoId: string) =>
  useEditDietaStore(
    useShallow((s) => {
      const semana = s.dietaEditada?.semanas.find((sem) => sem.numero === s.semanaAtiva);
      const r = semana?.dias.find((d) => d.nome === dia)?.refeicoes.find((x) => x.id === refeicaoId);
      return r ? { nome: r.nome, alimentos: r.alimentos } : null;
    })
  );

export const useEditActions = () =>
  useEditDietaStore(
    useShallow((s) => ({
      iniciar: s.iniciar,
      setSemanaAtiva: s.setSemanaAtiva,
      setDiaAtivo: s.setDiaAtivo,
      descartar: s.descartar,
      salvar: s.salvar,
      addRefeicao: s.addRefeicao,
      removeRefeicao: s.removeRefeicao,
      renameRefeicao: s.renameRefeicao,
      reorderRefeicoes: s.reorderRefeicoes,
      addAlimentoNaRefeicao: s.addAlimentoNaRefeicao,
      updateQuantidade: s.updateQuantidade,
      removeAlimento: s.removeAlimento,
    }))
  );
