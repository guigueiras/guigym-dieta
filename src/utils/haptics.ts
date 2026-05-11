import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const hap = {
  tap:    () => !isWeb && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  add:    () => !isWeb && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  remove: () => !isWeb && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  error:  () => !isWeb && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warn:   () => !isWeb && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  select: () => !isWeb && Haptics.selectionAsync(),
};
