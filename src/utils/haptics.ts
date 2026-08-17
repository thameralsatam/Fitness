import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection' = 'light') => {
  try {
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'selection':
        await Haptics.selectionChanged();
        break;
      default:
        await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch {
    // Fallback on web/browsers without vibrating capability or permissions
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'heavy' || type === 'success') {
        navigator.vibrate([30, 40, 50]);
      } else {
        navigator.vibrate(15);
      }
    }
  }
};
