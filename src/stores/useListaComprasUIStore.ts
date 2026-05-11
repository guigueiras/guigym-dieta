import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface ListaComprasUIState {
  marcados: Record<string, Set<string>>;

  isMarcado: (dietaId: string, alimentoId: string) => boolean;
  toggleMarcado: (dietaId: string, alimentoId: string) => void;
  marcarTodos: (dietaId: string, alimentoIds: string[]) => void;
  desmarcarTodos: (dietaId: string) => void;
  contarMarcados: (dietaId: string) => number;
}

const EMPTY_SET = new Set<string>();

export const useListaComprasUIStore = create<ListaComprasUIState>((set, get) => ({
  marcados: {},

  isMarcado: (dietaId, alimentoId) =>
    !!get().marcados[dietaId]?.has(alimentoId),

  toggleMarcado: (dietaId, alimentoId) =>
    set((s) => {
      const setAtual = s.marcados[dietaId] ?? new Set<string>();
      const next = new Set(setAtual);
      if (next.has(alimentoId)) next.delete(alimentoId);
      else next.add(alimentoId);
      return { marcados: { ...s.marcados, [dietaId]: next } };
    }),

  marcarTodos: (dietaId, alimentoIds) =>
    set((s) => ({
      marcados: { ...s.marcados, [dietaId]: new Set(alimentoIds) },
    })),

  desmarcarTodos: (dietaId) =>
    set((s) => {
      if (!s.marcados[dietaId] || s.marcados[dietaId].size === 0) return s;
      return {
        marcados: { ...s.marcados, [dietaId]: new Set<string>() },
      };
    }),

  contarMarcados: (dietaId) => get().marcados[dietaId]?.size ?? 0,
}));

export const useMarcadosDaDieta = (dietaId: string) =>
  useListaComprasUIStore(
    useShallow((s) => s.marcados[dietaId] ?? EMPTY_SET)
  );

export const useIsItemMarcado = (dietaId: string, alimentoId: string) =>
  useListaComprasUIStore((s) => !!s.marcados[dietaId]?.has(alimentoId));

export const useListaActions = () =>
  useListaComprasUIStore(
    useShallow((s) => ({
      toggleMarcado: s.toggleMarcado,
      marcarTodos: s.marcarTodos,
      desmarcarTodos: s.desmarcarTodos,
    }))
  );
