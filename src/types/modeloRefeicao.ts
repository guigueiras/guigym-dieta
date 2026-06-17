/** Alimento dentro de um modelo de refeição. Sem quantidade — definida na hora de usar. */
export interface ModeloAlimento {
  id: string;
  alimentoId: string;
  ordem: number;
}

/**
 * Modelo de refeição global reutilizável.
 * Armazena quais alimentos compõem a refeição, sem quantidades.
 */
export interface ModeloRefeicao {
  id: string;
  nome: string;
  alimentos: ModeloAlimento[];
  criadaEm: number;
  atualizadaEm: number;
}
