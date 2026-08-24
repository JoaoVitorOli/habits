import { and, isNotNull, isNull } from 'drizzle-orm';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { db } from '@/data/db';
import { habits } from '@/data/schema';
import { remindersFor } from '@/domain/reminder';
import { scheduleOf } from '@/domain/schedule';

const CHANNEL = 'lembretes';

/** O canal precisa existir antes de pedir permissao, senao o Android 13+ nem pergunta. */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Lembretes',
    // sem `sound`: 'default' seria tratado como nome de arquivo de som custom
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  await ensureChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Serviço unico de reagendamento: joga fora tudo e remonta a partir do banco. Reconciliar
 * lembrete por lembrete daria estados intermediarios errados a cada edicao.
 */
export async function rescheduleReminders(): Promise<void> {
  const granted = (await Notifications.getPermissionsAsync()).granted;

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!granted) return;

  await ensureChannel();

  const rows = await db
    .select()
    .from(habits)
    .where(and(isNull(habits.deletedAt), isNull(habits.archivedAt), isNotNull(habits.reminderTime)));

  for (const row of rows) {
    for (const trigger of remindersFor(scheduleOf(row), row.reminderTime)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: row.name,
          body: 'Hora de marcar esse hábito.',
          data: { habitId: row.id },
        },
        trigger:
          trigger.kind === 'daily'
            ? {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                channelId: CHANNEL,
                hour: trigger.hour,
                minute: trigger.minute,
              }
            : {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                channelId: CHANNEL,
                // o dominio conta domingo como 0; a plataforma conta domingo como 1
                weekday: trigger.weekday + 1,
                hour: trigger.hour,
                minute: trigger.minute,
              },
      });
    }
  }
}
