export * from './categorias';

export const DIAS_SEMANA = [
  { key: 'segunda', label: 'Segunda' },
  { key: 'terca',   label: 'Terça'   },
  { key: 'quarta',  label: 'Quarta'  },
  { key: 'quinta',  label: 'Quinta'  },
  { key: 'sexta',   label: 'Sexta'   },
  { key: 'sabado',  label: 'Sábado'  },
  { key: 'domingo', label: 'Domingo' },
] as const;

export const REFEICOES_PADRAO = [
  'Café da manhã',
  'Almoço',
  'Café da tarde',
  'Jantar',
] as const;
