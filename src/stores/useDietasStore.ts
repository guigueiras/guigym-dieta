import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Dieta, TipoDieta } from '@/types';
import { matchTermo } from '@/utils/text';
import * as repo from '@/db/repositories/dietasRepo';

interface DietasState {
  byId: Record<string, Dieta>;
  ids: string[];
  loaded: boolean;

  loadAll: () => Promise<void>;
  criar: (nome: string, tipo: TipoDieta) => Promise<string>;
  renomear: (id: string, nome: string, tipo: TipoDieta) => Promise<void>;
  excluir: (id: string) => Promise<void>;
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

  criar: async (nome, tipo) => {
    const dieta = await repo.criar(nome, tipo);
    set((s) => ({ byId: { ...s.byId, [dieta.id]: dieta }, ids: [dieta.id, ...s.ids] }));
    return dieta.id;
  },

  renomear: async (id, nome, tipo) => {
    const atualizada = await repo.renomear(id, nome, tipo);
    set((s) => ({ byId: { ...s.byId, [id]: atualizada } }));
  },

  excluir: async (id) => {
    await repo.excluir(id);
    set((s) => {
      const { [id]: _, ...rest } = s.byId;
      return { byId: rest, ids: s.ids.filter((x) => x !== id) };
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
        return matchTermo(d.nome, termo) || matchTermo(d.tipo, termo);
      });
    })
  );

export const useDietasActions = () =>
  useDietasStore(
    useShallow((s) => ({
      criar: s.criar,
      renomear: s.renomear,
      excluir: s.excluir,
    }))
  );
