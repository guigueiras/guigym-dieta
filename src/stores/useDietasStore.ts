import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Dieta, DietTargets, DuracaoConfig } from '@/types';
import { matchTermo } from '@/utils/text';
import * as repo from '@/db/repositories/dietasRepo';

interface DietasState {
  byId: Record<string, Dieta>;
  ids: string[];
  loaded: boolean;

  loadAll: () => Promise<void>;
  /**
   * Cria nova dieta com nome obrigatório e targets opcionais.
   * Se targets for fornecido, o tipo é derivado do goal automaticamente.
   */
  criar: (nome: string, duracao?: DuracaoConfig, targets?: DietTargets) => Promise<string>;
  /**
   * Renomeia uma dieta. Não toca em tipo ou targets — pra editar a meta,
   * usar setTargets separadamente.
   */
  renomear: (id: string, nome: string) => Promise<void>;
  excluir: (id: string) => Promise<void>;
  /**
   * Define ou remove os targets nutricionais de uma dieta.
   *  - `targets: DietTargets` → grava no banco e atualiza store.
   *  - `targets: null` → limpa no banco e remove o campo no store.
   *
   * Atualiza `atualizadaEm` automaticamente. Em caso de erro do repo,
   * propaga a exceção e mantém o store intacto.
   */
  setTargets: (id: string, targets: DietTargets | null) => Promise<void>;
  upsertLocal: (dieta: Dieta) => void;
}

export const useDietasStore = create<DietasState>((set, get) => ({
  byId: {},
  ids: [],
  loaded: false,

  loadAll: async () => {
    const lista = await repo.listAll();
    const byId: Record<string, Dieta> = {};
    const ids: string[] = [];
    for (const d of lista) { byId[d.id] = d; ids.push(d.id); }
    set({ byId, ids, loaded: true });
  },

  criar: async (nome, duracao, targets) => {
    const dieta = await repo.criar(nome, duracao, targets);
    set((s) => ({ byId: { ...s.byId, [dieta.id]: dieta }, ids: [dieta.id, ...s.ids] }));
    return dieta.id;
  },

  renomear: async (id, nome) => {
    const atualizada = await repo.renomear(id, nome);
    set((s) => ({ byId: { ...s.byId, [id]: atualizada } }));
  },

  excluir: async (id) => {
    await repo.excluir(id);
    set((s) => {
      const { [id]: _, ...rest } = s.byId;
      return { byId: rest, ids: s.ids.filter((x) => x !== id) };
    });
  },

  setTargets: async (id, targets) => {
    // 1) Grava no banco. Se falhar, propaga sem tocar no store.
    await repo.atualizarTargets(id, targets);

    // 2) Patch in-place na dieta correspondente.
    // Quando `targets` é null, remove o campo do objeto (não deixa `targets: undefined`).
    set((s) => {
      const atual = s.byId[id];
      if (!atual) return s; // dieta sumiu entre chamadas — no-op seguro
      const now = Date.now();
      const { targets: _omit, ...semTargets } = atual;
      const proxima: Dieta = targets === null
        ? { ...semTargets, atualizadaEm: now }
        : { ...semTargets, targets, atualizadaEm: now };
      return { byId: { ...s.byId, [id]: proxima } };
    });
  },

  upsertLocal: (dieta) =>
    set((s) => ({
      byId: { ...s.byId, [dieta.id]: dieta },
      ids: s.ids.includes(dieta.id) ? s.ids : [dieta.id, ...s.ids],
    })),
}));

export const useDietasLoaded = () => useDietasStore((s) => s.loaded);

export const useDietasIds = () => useDietasStore((s) => s.ids);

export const useDieta = (id: string | undefined) =>
  useDietasStore((s) => (id ? s.byId[id] : undefined));

export const useDietasFiltradas = (termo: string) =>
  useDietasStore(
    useShallow((s) => {
      if (!termo.trim()) return s.ids;
      return s.ids.filter((id) => {
        const d = s.byId[id];
        if (!d) return false;
        return matchTermo(d.nome, termo) || matchTermo(d.tipo ?? '', termo);
      });
    })
  );

export const useDietasActions = () =>
  useDietasStore(
    useShallow((s) => ({
      criar: s.criar,
      renomear: s.renomear,
      excluir: s.excluir,
      setTargets: s.setTargets,
    }))
  );