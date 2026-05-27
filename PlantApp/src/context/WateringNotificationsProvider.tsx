import React from 'react';
import { Platform } from 'react-native';

import { useAuth } from './AuthContext';
import { usePlants } from './PlantContext';
import {
  registerWateringReminderTask,
  runWateringReminderCheck,
  storeWateringReminderUserId,
} from './services/wateringNotifications';

export function WateringNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { plants } = usePlants();
  const notificationsEnabled =
    Platform.OS !== 'web' && process.env.EXPO_PUBLIC_DISABLE_WATERING_NOTIFICATIONS !== 'true';

  if (!notificationsEnabled) {
    return <>{children}</>;
  }

  React.useEffect(() => {
    const timerId = setTimeout(() => {
      void registerWateringReminderTask().catch((error) => {
        console.warn('[WateringNotifications] could not register background task:', error);
      });
    }, 0);

    return () => clearTimeout(timerId);
  }, []);

  React.useEffect(() => {
    void storeWateringReminderUserId(currentUser?.uid ?? null).catch((error) => {
      console.warn('[WateringNotifications] could not store user id:', error);
    });
  }, [currentUser?.uid]);

  React.useEffect(() => {
    if (!currentUser) return;

    const timerId = setTimeout(() => {
      void runWateringReminderCheck({ requestPermission: true }).catch((error) => {
        console.warn('[WateringNotifications] immediate reminder check failed:', error);
      });
    }, 0);

    return () => clearTimeout(timerId);
  }, [currentUser?.uid, plants]);

  return <>{children}</>;
}