export interface AlimentoNaRefeicao {
  id: string;
  alimentoId: string;
  quantidade: number;
}

export interface Refeicao {
  id: string;
  nome: string;
  ordem: number;
  alimentos: AlimentoNaRefeicao[];
}
