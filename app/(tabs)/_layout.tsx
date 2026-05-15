import { Tabs } from 'expo-router';
import { Home, ListChecks } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Altura visual do "conteúdo" da tab bar (ícone + label). 52pt mantém
  // proximidade com o padrão iOS moderno (Instagram/TikTok ~50–52pt).
  // O safe area inferior é SOMADO à altura total, e o mesmo valor é aplicado
  // como paddingBottom — isso faz o conteúdo (ícones/labels) ficar acima
  // do home indicator em vez de colado nele.
  const TAB_CONTENT_HEIGHT = 52;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          height: TAB_CONTENT_HEIGHT + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        tabBarItemStyle: {
          paddingTop: 4,
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dietas',
          tabBarIcon: ({ color, focused }) => (
            <Home size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="alimentos"
        options={{
          title: 'Alimentos',
          tabBarIcon: ({ color, focused }) => (
            <ListChecks size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
