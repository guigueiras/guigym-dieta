import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Alimento } from '@/types';
import { matchTermo } from '@/utils/text';
import * as repo from '@/db/repositories/alimentosRepo';

interface AlimentosState {
  byId: Record<string, Alimento>;
  ids: string[];
  loaded: boolean;
  ultimoCriadoId: string | null;

  loadAll: () => Promise<void>;
  criar: (input: Omit<Alimento, 'id'>) => Promise<string>;
  atualizar: (id: string, input: Omit<Alimento, 'id'>) => Promise<void>;
  excluir: (id: string) => Promise<void>;
  contarUsos: (id: string) => Promise<{ refeicoes: number; dietas: number }>;
  clearUltimoCriado: () => void;
}

function sortIds(ids: string[], byId: Record<string, Alimento>): string[] {
  return [...ids].sort((a, b) => {
    const na = byId[a]?.nome ?? '';
    const nb = byId[b]?.nome ?? '';
    return na.localeCompare(nb, 'pt-BR', { sensitivity: 'base' });
  });
}

export const useAlimentosStore = create<AlimentosState>((set, get) => ({
  byId: {},
  ids: [],
  loaded: false,
  ultimoCriadoId: null,

  loadAll: async () => {
    const lista = await repo.listAll();
    const byId: Record<string, Alimento> = {};
    const ids: string[] = [];
    for (const a of lista) { byId[a.id] = a; ids.push(a.id); }
    set({ byId, ids, loaded: true });
  },

  criar: async (input) => {
    const a = await repo.criar(input);
    set((s) => {
      const byId = { ...s.byId, [a.id]: a };
      return {
        byId,
        ids: sortIds([...s.ids, a.id], byId),
        ultimoCriadoId: a.id,
      };
    });
    return a.id;
  },

  atualizar: async (id, input) => {
    const a = await repo.atualizar(id, input);
    set((s) => {
      const byId = { ...s.byId, [id]: a };
      return { byId, ids: sortIds(s.ids, byId) };
    });
  },

  excluir: async (id) => {
    await repo.excluir(id);
    set((s) => {
      const { [id]: _, ...rest } = s.byId;
      return {
        byId: rest,
        ids: s.ids.filter((x) => x !== id),
        ultimoCriadoId: s.ultimoCriadoId === id ? null : s.ultimoCriadoId,
      };
    });
  },

  contarUsos: async (id) => repo.contarUsos(id),

  clearUltimoCriado: () => set({ ultimoCriadoId: null }),
}));

export const useAlimentosLoaded = () => useAlimentosStore((s) => s.loaded);

export const useAlimento = (id: string | undefined) =>
  useAlimentosStore((s) => (id ? s.byId[id] : undefined));

export const useAlimentosFiltrados = (termo: string) =>
  useAlimentosStore(
    useShallow((s) => {
      if (!termo.trim()) return s.ids;
      return s.ids.filter((id) => {
        const a = s.byId[id];
        if (!a) return false;
        return matchTermo(a.nome, termo);
      });
    })
  );

export const useUltimoCriadoId = () => useAlimentosStore((s) => s.ultimoCriadoId);

export const useAlimentosActions = () =>
  useAlimentosStore(
    useShallow((s) => ({
      criar: s.criar,
      atualizar: s.atualizar,
      excluir: s.excluir,
      contarUsos: s.contarUsos,
      clearUltimoCriado: s.clearUltimoCriado,
    }))
  );
