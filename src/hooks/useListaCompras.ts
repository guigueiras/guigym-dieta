import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDieta } from '@/stores/useDietasStore';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { gerarListaCompras } from '@/utils/listaCompras';

export function useListaCompras(dietaId: string) {
  const dieta = useDieta(dietaId);
  const alimentosBase = useAlimentosStore(useShallow((s) => s.byId));

  return useMemo(() => {
    if (!dieta) return [];
    return gerarListaCompras(dieta, alimentosBase);
  }, [dieta, alimentosBase]);
}
