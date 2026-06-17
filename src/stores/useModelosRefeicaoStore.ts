import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { ModeloRefeicao } from '@/types/modeloRefeicao';
import * as repo from '@/db/repositories/modelosRefeicaoRepo';

interface ModelosState {
  byId: Record<string, ModeloRefeicao>;
  ids: string[];
  loaded: boolean;

  loadAll: () => Promise<void>;
  criar: (nome: string) => Promise<string>;
  renomear: (id: string, nome: string) => Promise<void>;
  excluir: (id: string) => Promise<void>;
  adicionarAlimento: (modeloId: string, alimentoId: string) => Promise<void>;
  removerAlimento: (modeloAlimentoId: string, modeloId: string) => Promise<void>;
}

function sortIds(ids: string[], byId: Record<string, ModeloRefeicao>): string[] {
  return [...ids].sort((a, b) =>
    (byId[a]?.nome ?? '').localeCompare(byId[b]?.nome ?? '', 'pt-BR', { sensitivity: 'base' })
  );
}

export const useModelosRefeicaoStore = create<ModelosState>((set) => ({
  byId: {},
  ids: [],
  loaded: false,

  loadAll: async () => {
    const lista = await repo.listAll();
    const byId: Record<string, ModeloRefeicao> = {};
    for (const m of lista) byId[m.id] = m;
    set({ byId, ids: lista.map((m) => m.id), loaded: true });
  },

  criar: async (nome) => {
    const m = await repo.criar(nome);
    set((s) => {
      const byId = { ...s.byId, [m.id]: m };
      return { byId, ids: sortIds([...s.ids, m.id], byId) };
    });
    return m.id;
  },

  renomear: async (id, nome) => {
    await repo.renomear(id, nome);
    set((s) => {
      const modelo = s.byId[id];
      if (!modelo) return {};
      const byId = { ...s.byId, [id]: { ...modelo, nome, atualizadaEm: Date.now() } };
      return { byId, ids: sortIds(s.ids, byId) };
    });
  },

  excluir: async (id) => {
    await repo.excluir(id);
    set((s) => {
      const { [id]: _, ...rest } = s.byId;
      return { byId: rest, ids: s.ids.filter((x) => x !== id) };
    });
  },

  adicionarAlimento: async (modeloId, alimentoId) => {
    const modeloAlimento = await repo.adicionarAlimento(modeloId, alimentoId);
    set((s) => {
      const modelo = s.byId[modeloId];
      if (!modelo) return {};
      return {
        byId: {
          ...s.byId,
          [modeloId]: {
            ...modelo,
            alimentos: [...modelo.alimentos, modeloAlimento],
            atualizadaEm: Date.now(),
          },
        },
      };
    });
  },

  removerAlimento: async (modeloAlimentoId, modeloId) => {
    await repo.removerAlimento(modeloAlimentoId, modeloId);
    set((s) => {
      const modelo = s.byId[modeloId];
      if (!modelo) return {};
      return {
        byId: {
          ...s.byId,
          [modeloId]: {
            ...modelo,
            alimentos: modelo.alimentos.filter((a) => a.id !== modeloAlimentoId),
            atualizadaEm: Date.now(),
          },
        },
      };
    });
  },
}));

// ─── Selectors ────────────────────────────────────────────

export const useModelosLoaded = () => useModelosRefeicaoStore((s) => s.loaded);

export const useModelo = (id: string | undefined) =>
  useModelosRefeicaoStore((s) => (id ? s.byId[id] : undefined));

export const useModelosIds = () =>
  useModelosRefeicaoStore(useShallow((s) => s.ids));

export const useModelosActions = () =>
  useModelosRefeicaoStore(
    useShallow((s) => ({
      criar: s.criar,
      renomear: s.renomear,
      excluir: s.excluir,
      adicionarAlimento: s.adicionarAlimento,
      removerAlimento: s.removerAlimento,
    }))
  );
