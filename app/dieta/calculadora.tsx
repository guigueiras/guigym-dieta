import { useEffect } from 'react';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { WizardContainer } from '@/features/tdee-wizard/components/WizardContainer';
import { useDieta } from '@/stores/useDietasStore';

export default function CalculadoraRoute() {
  const params = useLocalSearchParams<{ dietaId?: string }>();
  const dietaId = params.dietaId;
  const dieta = useDieta(dietaId);

  // Se chegou aqui sem dietaId, fecha — caller deveria sempre passar.
  useEffect(() => {
    if (!dietaId) {
      router.back();
    }
  }, [dietaId]);

  if (!dietaId) return null;

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <WizardContainer
        dietaId={dietaId}
        initialTargets={dieta?.targets}
        onDone={() => router.back()}
      />
    </>
  );
}