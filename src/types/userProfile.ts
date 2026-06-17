import type { Sex, ActivityLevel } from '@/utils/tdee';

/**
 * Perfil do usuário, persistido no banco.
 *
 * Domínio: representa um perfil COMPLETO e válido. Se o banco tiver
 * qualquer campo null (perfil parcial), o repository retorna null —
 * "perfil inexistente" do ponto de vista do app.
 *
 * Origem dos valores:
 *  - Wizard TDEE → ao "Aplicar meta", os dados do draft são salvos aqui
 *  - Reabrir wizard → busca esse perfil pra pré-preencher
 *
 * Atualizado ao "Aplicar meta" (sucesso). Descartar (X) não altera.
 */
export interface UserProfile {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
}
