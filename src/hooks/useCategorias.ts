import { CATEGORIAS, type Categoria } from '@/constants/categorias';

export function useCategorias(): readonly Categoria[] {
  return CATEGORIAS;
}
