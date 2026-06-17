import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { UserProfile } from '@/types/userProfile';
import * as repo from '@/db/repositories/userProfileRepo';

/**
 * Store global do perfil do usuário.
 *
 * Lifecycle:
 *  - load(): chamado no boot do app (RootLayout). Lê do banco e popula state.
 *  - save(profile): grava no banco e atualiza state.
 *
 * Estado:
 *  - profile: null = perfil não existe ou está incompleto no banco.
 *             UserProfile = perfil válido e completo.
 *  - loaded: false até load() terminar a primeira vez. Permite UI saber
 *            se já carregou (ou ainda está em loading inicial).
 *
 * Se save falhar, propaga a exceção e mantém state intacto.
 */

interface UserProfileState {
  profile: UserProfile | null;
  loaded: boolean;

  load: () => Promise<void>;
  save: (profile: UserProfile) => Promise<void>;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profile: null,
  loaded: false,

  load: async () => {
    const profile = await repo.get();
    set({ profile, loaded: true });
  },

  save: async (profile) => {
    // 1) Grava no banco. Se falhar, propaga sem tocar no state.
    await repo.save(profile);
    // 2) Atualiza state com o que acabamos de gravar.
    set({ profile });
  },
}));

// ─── Hooks de conveniência ───────────────────────────────────

export const useUserProfile = () => useUserProfileStore((s) => s.profile);

export const useUserProfileLoaded = () =>
  useUserProfileStore((s) => s.loaded);

export const useUserProfileActions = () =>
  useUserProfileStore(
    useShallow((s) => ({
      load: s.load,
      save: s.save,
    }))
  );
