import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export async function shareTexto(titulo: string, texto: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: titulo, text: texto });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }
    await Clipboard.setStringAsync(texto);
    if (typeof window !== 'undefined') {
      window.alert('Lista copiada para a área de transferência');
    }
    return;
  }

  await Share.share({ title: titulo, message: texto });
}
