import type { CategoriaId } from '@/constants/categorias';
import type { UnidadeMedida } from '@/types';

/**
 * Base oficial de alimentos do GuiGym Dieta.
 *
 * Convenções:
 *  - Macros (proteina/carbo/gordura) SEMPRE são do alimento preparado/pronto.
 *  - `fatorPreparo`: peso_preparado / peso_cru.
 *      pesoPreparado = pesoCru × fatorPreparo
 *      pesoCru       = pesoPreparado / fatorPreparo
 *  - `possuiFator: false` ⇒ `fatorPreparo` é null.
 *  - `possuiFator: true, fatorPreparo: 1.00` é "conversão neutra" (válido).
 *
 * Single source of truth do seed (DB novo) e da migration v4 (DB existente).
 */
export interface BaseAlimento {
  nome: string;
  categoria: CategoriaId;
  unidade: UnidadeMedida;
  proteina: number;
  carbo: number;
  gordura: number;
  possuiFator: boolean;
  fatorPreparo: number | null;
}

export const BASE_ALIMENTOS_V2: readonly BaseAlimento[] = [
  // ─── CARNES ─────────────────────────────────────────────
  { nome: 'Salmão air fryer',                  categoria: 'carnes',       unidade: 'g',  proteina: 25,   carbo: 0,    gordura: 14,   possuiFator: true,  fatorPreparo: 0.80 },
  { nome: 'Filé mignon frigideira sem óleo',   categoria: 'carnes',       unidade: 'g',  proteina: 31,   carbo: 0,    gordura: 10,   possuiFator: true,  fatorPreparo: 0.74 },
  { nome: 'Peito frango frigideira sem óleo',  categoria: 'carnes',       unidade: 'g',  proteina: 31,   carbo: 0,    gordura: 3.6,  possuiFator: true,  fatorPreparo: 0.78 },
  { nome: 'Peito frango air fryer',            categoria: 'carnes',       unidade: 'g',  proteina: 31,   carbo: 0,    gordura: 4,    possuiFator: true,  fatorPreparo: 0.74 },
  { nome: 'Patinho moído preparado',           categoria: 'carnes',       unidade: 'g',  proteina: 26,   carbo: 0,    gordura: 12,   possuiFator: true,  fatorPreparo: 0.77 },
  { nome: 'Acém moído preparado',              categoria: 'carnes',       unidade: 'g',  proteina: 25,   carbo: 0,    gordura: 17,   possuiFator: true,  fatorPreparo: 0.72 },
  { nome: 'Bacon frito própria gordura',       categoria: 'carnes',       unidade: 'g',  proteina: 37,   carbo: 1,    gordura: 42,   possuiFator: true,  fatorPreparo: 0.61 },
  { nome: 'Ovo frito com óleo',                categoria: 'carnes',       unidade: 'g',  proteina: 14,   carbo: 1,    gordura: 15,   possuiFator: true,  fatorPreparo: 0.93 },
  { nome: 'Ovo frito com azeite',              categoria: 'carnes',       unidade: 'g',  proteina: 14,   carbo: 1,    gordura: 16,   possuiFator: true,  fatorPreparo: 0.93 },
  { nome: 'Ovo frito sem óleo',                categoria: 'carnes',       unidade: 'g',  proteina: 13,   carbo: 1,    gordura: 10,   possuiFator: true,  fatorPreparo: 0.89 },
  { nome: 'Ovo cozido',                        categoria: 'carnes',       unidade: 'g',  proteina: 13,   carbo: 1,    gordura: 11,   possuiFator: true,  fatorPreparo: 0.94 },
  { nome: 'Ovo mexido',                        categoria: 'carnes',       unidade: 'g',  proteina: 10,   carbo: 2,    gordura: 11,   possuiFator: true,  fatorPreparo: 0.91 },

  // ─── CARBOIDRATOS ───────────────────────────────────────
  { nome: 'Macarrão spaghetti cozido',         categoria: 'carboidratos', unidade: 'g',  proteina: 5.8,  carbo: 31,   gordura: 1,    possuiFator: true,  fatorPreparo: 2.56 },
  { nome: 'Feijão carioca cozido',             categoria: 'carboidratos', unidade: 'g',  proteina: 4.8,  carbo: 14,   gordura: 0.5,  possuiFator: true,  fatorPreparo: 2.27 },
  { nome: 'Feijão preto cozido',               categoria: 'carboidratos', unidade: 'g',  proteina: 4.5,  carbo: 14,   gordura: 0.5,  possuiFator: true,  fatorPreparo: 2.27 },
  { nome: 'Batata marrom cozida',              categoria: 'carboidratos', unidade: 'g',  proteina: 2,    carbo: 20,   gordura: 0,    possuiFator: true,  fatorPreparo: 0.95 },
  { nome: 'Batata marrom air fryer',           categoria: 'carboidratos', unidade: 'g',  proteina: 2.5,  carbo: 24,   gordura: 2,    possuiFator: true,  fatorPreparo: 0.83 },
  { nome: 'Batata asterix air fryer',          categoria: 'carboidratos', unidade: 'g',  proteina: 2.5,  carbo: 28,   gordura: 2,    possuiFator: true,  fatorPreparo: 0.83 },
  { nome: 'Batata marrom frita óleo',          categoria: 'carboidratos', unidade: 'g',  proteina: 3.5,  carbo: 41,   gordura: 15,   possuiFator: true,  fatorPreparo: 0.59 },
  { nome: 'Batata asterix frita óleo',         categoria: 'carboidratos', unidade: 'g',  proteina: 4,    carbo: 42,   gordura: 17,   possuiFator: true,  fatorPreparo: 0.57 },
  { nome: 'Batata Bem Brasil air fryer',       categoria: 'carboidratos', unidade: 'g',  proteina: 3,    carbo: 33,   gordura: 4,    possuiFator: true,  fatorPreparo: 1.00 },

  // ─── FRUTAS ─────────────────────────────────────────────
  { nome: 'Banana',                            categoria: 'frutas',       unidade: 'g',  proteina: 1,    carbo: 23,   gordura: 0.3,  possuiFator: false, fatorPreparo: null },
  { nome: 'Maçã',                              categoria: 'frutas',       unidade: 'g',  proteina: 0.3,  carbo: 14,   gordura: 0.2,  possuiFator: false, fatorPreparo: null },
  { nome: 'Kiwi',                              categoria: 'frutas',       unidade: 'g',  proteina: 1,    carbo: 15,   gordura: 0.5,  possuiFator: false, fatorPreparo: null },
  { nome: 'Morango',                           categoria: 'frutas',       unidade: 'g',  proteina: 0.7,  carbo: 7.7,  gordura: 0.3,  possuiFator: false, fatorPreparo: null },
  { nome: 'Melancia',                          categoria: 'frutas',       unidade: 'g',  proteina: 0.6,  carbo: 7.5,  gordura: 0.2,  possuiFator: false, fatorPreparo: null },
  { nome: 'Manga',                             categoria: 'frutas',       unidade: 'g',  proteina: 0.8,  carbo: 15,   gordura: 0.4,  possuiFator: false, fatorPreparo: null },
  { nome: 'Maracujá',                          categoria: 'frutas',       unidade: 'g',  proteina: 2,    carbo: 13,   gordura: 2,    possuiFator: false, fatorPreparo: null },
  { nome: 'Goiaba',                            categoria: 'frutas',       unidade: 'g',  proteina: 2.6,  carbo: 14,   gordura: 1,    possuiFator: false, fatorPreparo: null },

  // ─── LATICÍNIOS ─────────────────────────────────────────
  { nome: 'Leite integral',                    categoria: 'laticinios',   unidade: 'ml', proteina: 3,    carbo: 5,    gordura: 3,    possuiFator: false, fatorPreparo: null },
  { nome: 'Manteiga',                          categoria: 'laticinios',   unidade: 'g',  proteina: 1,    carbo: 1,    gordura: 81,   possuiFator: false, fatorPreparo: null },
  { nome: 'Creme de leite',                    categoria: 'laticinios',   unidade: 'g',  proteina: 2,    carbo: 4,    gordura: 20,   possuiFator: false, fatorPreparo: null },

  // ─── MOLHOS ─────────────────────────────────────────────
  { nome: 'Molho de tomate',                   categoria: 'molhos',       unidade: 'g',  proteina: 1.5,  carbo: 7,    gordura: 0.5,  possuiFator: false, fatorPreparo: null },
  { nome: 'Ketchup',                           categoria: 'molhos',       unidade: 'g',  proteina: 1,    carbo: 27,   gordura: 0,    possuiFator: false, fatorPreparo: null },
  { nome: 'Mostarda',                          categoria: 'molhos',       unidade: 'g',  proteina: 4,    carbo: 6,    gordura: 4,    possuiFator: false, fatorPreparo: null },
  { nome: 'Maionese',                          categoria: 'molhos',       unidade: 'g',  proteina: 1,    carbo: 1,    gordura: 75,   possuiFator: false, fatorPreparo: null },
  { nome: 'Maionese light',                    categoria: 'molhos',       unidade: 'g',  proteina: 1,    carbo: 8,    gordura: 24,   possuiFator: false, fatorPreparo: null },
  { nome: 'Alho',                              categoria: 'molhos',       unidade: 'g',  proteina: 6,    carbo: 33,   gordura: 0.5,  possuiFator: true,  fatorPreparo: 0.87 },

  // ─── VEGETAIS ───────────────────────────────────────────
  { nome: 'Alface',                            categoria: 'vegetais',     unidade: 'g',  proteina: 1.4,  carbo: 2.9,  gordura: 0.2,  possuiFator: false, fatorPreparo: null },
  { nome: 'Tomate',                            categoria: 'vegetais',     unidade: 'g',  proteina: 0.9,  carbo: 3.9,  gordura: 0.2,  possuiFator: false, fatorPreparo: null },

  // ─── GORDURAS ───────────────────────────────────────────
  { nome: 'Azeite',                            categoria: 'gorduras',     unidade: 'ml', proteina: 0,    carbo: 0,    gordura: 100,  possuiFator: false, fatorPreparo: null },
  { nome: 'Óleo de soja',                      categoria: 'gorduras',     unidade: 'ml', proteina: 0,    carbo: 0,    gordura: 100,  possuiFator: false, fatorPreparo: null },
] as const;

/**
 * Nomes do seed v1 (obsoleto). Usado pela migration v4 pra apagar a base antiga
 * sem mexer em alimentos customizados criados pelo usuário.
 */
export const NOMES_SEED_V1_OBSOLETOS: readonly string[] = [
  'Peito de Frango',
  'Patinho Moído',
  'Arroz Branco Cozido',
  'Aveia',
  'Batata Doce Cozida',
  'Ovo Inteiro',
  'Banana',
  'Whey Protein',
] as const;