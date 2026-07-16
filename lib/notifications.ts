import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication, ReminderChannels } from '@/types';
import { isExpoGo } from './env';
import { formatTime12 } from './time';

/**
 * Local-notification reminders for medication times. Scheduled notifications are
 * not supported in Expo Go (SDK 53+), so every entry point below no-ops there to
 * keep the Expo Go experience clean and warning-free. The full implementation
 * runs unchanged in a development or store build.
 */

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/** Re-schedules a daily reminder for every medication, respecting channels. */
export async function syncReminders(
  medications: Medication[],
  channels: ReminderChannels
): Promise<void> {
  if (isExpoGo) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!channels.notification) return;

    const granted = await requestNotificationPermission();
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Medication reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    for (const med of medications) {
      const [hour, minute] = med.time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time for your medication',
          body: `Please take ${med.name} (${formatTime12(med.time)}) and confirm in VitaCare.`,
          sound: channels.phoneAlarm,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'reminders',
        },
      });
    }
  } catch {
    // Notifications are best-effort; never block the UI on them.
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (isExpoGo) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
