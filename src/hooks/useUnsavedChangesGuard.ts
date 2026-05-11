import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation } from 'expo-router';

interface Opts {
  isDirty: boolean;
  onConfirmExit: () => void;
}

export function useUnsavedChangesGuard({ isDirty, onConfirmExit }: Opts) {
  const navigation = useNavigation();

  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty) return;
      e.preventDefault();

      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja descartá-las?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              onConfirmExit();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });
    return sub;
  }, [navigation, isDirty, onConfirmExit]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
