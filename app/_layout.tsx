import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, Pressable, Text, View } from 'react-native';

import { getDatabase } from '@/db/database';
import { useDietasStore } from '@/stores/useDietasStore';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { useModelosRefeicaoStore } from '@/stores/useModelosRefeicaoStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const boot = useCallback(async () => {
    setBootError(null);
    setReady(false);
    try {
      await getDatabase();
      await Promise.all([
        useDietasStore.getState().loadAll(),
        useAlimentosStore.getState().loadAll(),
        useUserProfileStore.getState().load(),
        useModelosRefeicaoStore.getState().loadAll(),
      ]);
      setReady(true);
    } catch (e) {
      console.error('[boot] erro ao inicializar', e);
      setBootError(e instanceof Error ? e.message : String(e));
    } finally {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  if (bootError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A2E' }}>
          Não foi possível iniciar o app
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
          {bootError}
        </Text>
        <Pressable
          onPress={boot}
          style={({ pressed }) => ({
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: '#2563EB',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>
            Tentar novamente
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' },
              animation: Platform.OS === 'web' ? 'none' : 'default',
            }}
          />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
