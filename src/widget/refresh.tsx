import { requestWidgetUpdate } from 'react-native-android-widget';

import { saveWidgetSnapshot, widgetHabitId } from '@/data/widget';
import { logicalDay, type Day } from '@/domain/calendar';
import { habitOf, type WidgetSnapshot } from '@/domain/widget-snapshot';
import { DEFAULT_DAY_START_HOUR, DEFAULT_WEEK_STARTS_ON, useToday } from '@/features/use-today';
import { HabitWidget } from '@/widget/habit-widget';
import { useEffect } from 'react';
import { AppState } from 'react-native';

/** Precisa bater com o `name` do plugin em app.json. */
export const WIDGET_NAME = 'Habito';

let pending: ReturnType<typeof setTimeout> | null = null;

/**
 * Uma edicao de habito dispara varias gravacoes seguidas (linha, lembrete, posicao). O
 * widget so precisa da ultima, entao o snapshot espera 300 ms de silencio.
 */
export function refreshWidgets(): void {
  if (pending !== null) clearTimeout(pending);

  pending = setTimeout(() => {
    pending = null;
    // um widget que falha nao pode derrubar a gravacao que o usuario acabou de fazer
    redrawWidgets(new Date()).catch(() => {});
  }, 300);
}

export async function redrawWidgets(now: Date): Promise<void> {
  const today = logicalDay(now, DEFAULT_DAY_START_HOUR);
  const snapshot = await saveWidgetSnapshot(today, DEFAULT_WEEK_STARTS_ON, now);
  await drawWidgets(snapshot, today);
}

/** Cada widget na tela inicial mostra o seu habito; o snapshot e um so para todos. */
export async function drawWidgets(snapshot: WidgetSnapshot | null, today: Day): Promise<void> {
  await requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: async (info) => (
      <HabitWidget habit={habitOf(snapshot, await widgetHabitId(info.widgetId))} today={today} box={info} />
    ),
  });
}

/**
 * O app pode ficar aberto atravessando a virada das 4h, e o widget continua na tela inicial
 * depois que o app sai de cena. Redesenhar ao ir para o background e o conserto barato.
 */
export function useWidgetRefresh(enabled: boolean): void {
  const today = useToday();

  useEffect(() => {
    // o snapshot sai de um SELECT: antes das migrations nao ha o que selecionar
    if (!enabled) return;

    refreshWidgets();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') refreshWidgets();
    });

    return () => subscription.remove();
  }, [enabled, today]);
}
