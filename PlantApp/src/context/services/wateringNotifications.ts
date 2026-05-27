import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { getUserPlants, type Plant } from './api';

export const WATERING_REMINDER_TASK_NAME = 'plantapp-watering-reminders';
export const WATERING_REMINDER_USER_UID_KEY = 'PLANTAPP_WATERING_REMINDER_USER_UID';
const WATERING_REMINDER_LAST_SENT_KEY = 'PLANTAPP_WATERING_REMINDER_LAST_SENT_DATE';
const WATERING_NOTIFICATION_CHANNEL_ID = 'watering-reminders';

let isNotificationRuntimeConfigured = false;
let isBackgroundTaskDefined = false;

type WateringReminderCheckOptions = {
  requestPermission?: boolean;
};

type DuePlant = {
  plant: Plant;
  nextWateringDate: Date;
};

function ensureNotificationRuntimeConfigured(): void {
  if (isNotificationRuntimeConfigured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  isNotificationRuntimeConfigured = true;
}

function ensureBackgroundTaskDefined(): boolean {
  if (isBackgroundTaskDefined || Platform.OS === 'web' || __DEV__) {
    return false;
  }

  try {
    // `isTaskDefined` avoids duplicate definitions during Fast Refresh.
    if (typeof TaskManager.isTaskDefined === 'function' && TaskManager.isTaskDefined(WATERING_REMINDER_TASK_NAME)) {
      isBackgroundTaskDefined = true;
      return true;
    }

    TaskManager.defineTask(WATERING_REMINDER_TASK_NAME, async () => {
      try {
        const result = await runWateringReminderCheck({ requestPermission: false });
        return result.dueCount > 0
          ? BackgroundFetch.BackgroundFetchResult.NewData
          : BackgroundFetch.BackgroundFetchResult.NoData;
      } catch (error) {
        console.warn('[WateringNotifications] background check failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    isBackgroundTaskDefined = true;
    return true;
  } catch (error) {
    console.warn('[WateringNotifications] could not define background task:', error);
    return false;
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function startOfToday(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function parseDate(rawValue: string | null | undefined): Date | null {
  if (!rawValue) return null;
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getNormalizedFrequency(plant: Plant): number | null {
  const frequency = plant.wateringFrequencyDays ?? plant.wateringIntervalDays ?? null;
  if (typeof frequency !== 'number' || !Number.isFinite(frequency) || frequency < 1) {
    return null;
  }
  return Math.trunc(frequency);
}

function calculateNextWateringDate(plant: Plant): Date | null {
  const frequency = getNormalizedFrequency(plant);
  const lastWatered = parseDate(plant.lastWatered);

  if (!frequency || !lastWatered) {
    return plant.nextWateringDate ? parseDate(plant.nextWateringDate) : null;
  }

  const nextWateringDate = new Date(lastWatered);
  nextWateringDate.setDate(nextWateringDate.getDate() + frequency);
  return nextWateringDate;
}

function getDuePlants(plants: Plant[]): DuePlant[] {
  const today = startOfToday();

  return plants
    .map((plant) => {
      const nextWateringDate = calculateNextWateringDate(plant);
      return nextWateringDate ? { plant, nextWateringDate } : null;
    })
    .filter((entry): entry is DuePlant => Boolean(entry))
    .filter((entry) => entry.nextWateringDate <= today)
    .sort((left, right) => left.nextWateringDate.getTime() - right.nextWateringDate.getTime());
}

function buildReminderMessage(duePlants: DuePlant[]): { title: string; body: string } {
  const plantNames = duePlants.map((entry) => entry.plant.name).filter(Boolean);
  const visibleNames = plantNames.slice(0, 3);
  const extraCount = Math.max(plantNames.length - visibleNames.length, 0);
  const suffix = extraCount > 0 ? ` y ${extraCount} más` : '';
  const plantWord = duePlants.length === 1 ? 'planta' : 'plantas';

  return {
    title: 'Riego pendiente',
    body: `Tienes ${duePlants.length} ${plantWord} con riego pendiente: ${visibleNames.join(', ')}${suffix}.`,
  };
}

async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(WATERING_NOTIFICATION_CHANNEL_ID, {
    name: 'Recordatorios de riego',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2D5A27',
  });
}

async function ensureNotificationPermissions(requestPermission: boolean): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  if (!requestPermission) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function storeWateringReminderUserId(userUid: string | null): Promise<void> {
  if (userUid) {
    await AsyncStorage.setItem(WATERING_REMINDER_USER_UID_KEY, userUid);
  } else {
    await AsyncStorage.removeItem(WATERING_REMINDER_USER_UID_KEY);
    await AsyncStorage.removeItem(WATERING_REMINDER_LAST_SENT_KEY);
  }
}

export async function registerWateringReminderTask(): Promise<void> {
  if (Platform.OS === 'web') return;

  ensureNotificationRuntimeConfigured();
  if (!ensureBackgroundTaskDefined()) return;

  let backgroundStatus: BackgroundFetch.BackgroundFetchStatus | null = null;
  try {
    backgroundStatus = await BackgroundFetch.getStatusAsync();
  } catch (error) {
    console.warn('[WateringNotifications] background fetch status unavailable:', error);
    return;
  }

  if (backgroundStatus === null || backgroundStatus === BackgroundFetch.BackgroundFetchStatus.Denied) {
    return;
  }

  let isRegistered = false;
  try {
    isRegistered = await TaskManager.isTaskRegisteredAsync(WATERING_REMINDER_TASK_NAME);
  } catch (error) {
    console.warn('[WateringNotifications] task registration state unavailable:', error);
    return;
  }

  if (isRegistered) return;

  try {
    await BackgroundFetch.registerTaskAsync(WATERING_REMINDER_TASK_NAME, {
      minimumInterval: 24 * 60 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    console.warn('[WateringNotifications] could not register background task:', error);
  }
}

export async function runWateringReminderCheck(
  options: WateringReminderCheckOptions = {},
): Promise<{ dueCount: number; notified: boolean }> {
  ensureNotificationRuntimeConfigured();

  const userUid = await AsyncStorage.getItem(WATERING_REMINDER_USER_UID_KEY);
  if (!userUid) {
    return { dueCount: 0, notified: false };
  }

  const plants = await getUserPlants(userUid);
  const duePlants = getDuePlants(plants);

  if (duePlants.length === 0) {
    return { dueCount: 0, notified: false };
  }

  const todayKey = toDateKey(new Date());
  const lastSentKey = await AsyncStorage.getItem(WATERING_REMINDER_LAST_SENT_KEY);
  if (lastSentKey === todayKey) {
    return { dueCount: duePlants.length, notified: false };
  }

  await ensureNotificationChannel();
  const hasPermission = await ensureNotificationPermissions(Boolean(options.requestPermission));
  if (!hasPermission) {
    return { dueCount: duePlants.length, notified: false };
  }

  const reminder = buildReminderMessage(duePlants);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.body,
      data: {
        type: 'watering-reminder',
        dueCount: duePlants.length,
      },
    },
    trigger: null,
  });

  await AsyncStorage.setItem(WATERING_REMINDER_LAST_SENT_KEY, todayKey);
  return { dueCount: duePlants.length, notified: true };
}