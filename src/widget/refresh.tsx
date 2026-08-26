import { requestWidgetUpdate } from 'react-native-android-widget';

import { readPreferences, usePreferences } from '@/data/settings';
import { saveWidgetSnapshot, widgetHabitId } from '@/data/widget';
import { logicalDay, type Day } from '@/domain/calendar';
import type { WidgetSnapshot } from '@/domain/widget-snapshot';
import { useToday } from '@/features/use-today';
import { asksForHabit, WIDGET_NAMES, widgetFor } from '@/widget/render';
import { useEffect } from 'react';
import { AppState } from 'react-native';

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
  const preferences = await readPreferences();
  const today = logicalDay(now, preferences.dayStartHour);
  const snapshot = await saveWidgetSnapshot(today, preferences, now);
  await drawWidgets(snapshot, today);
}

/**
 * Cada widget de habito na tela inicial mostra o seu; a lista compacta mostra os ativos.
 * O snapshot e um so para todos, e uma marcacao muda os tres de uma vez.
 */
export async function drawWidgets(snapshot: WidgetSnapshot | null, today: Day): Promise<void> {
  for (const widgetName of Object.values(WIDGET_NAMES)) {
    await requestWidgetUpdate({
      widgetName,
      renderWidget: async (info) =>
        widgetFor({
          info,
          snapshot,
          habitId: asksForHabit(widgetName) ? await widgetHabitId(info.widgetId) : null,
          today,
        }),
    });
  }
}

/**
 * O app pode ficar aberto atravessando a virada das 4h, e o widget continua na tela inicial
 * depois que o app sai de cena. Redesenhar ao ir para o background e o conserto barato.
 */
export function useWidgetRefresh(enabled: boolean): void {
  const today = useToday();
  // a virada e o inicio da semana viajam dentro do snapshot: mexer neles reescreve o arquivo
  const { dayStartHour, weekStartsOn } = usePreferences();

  useEffect(() => {
    // o snapshot sai de um SELECT: antes das migrations nao ha o que selecionar
    if (!enabled) return;

    refreshWidgets();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') refreshWidgets();
    });

    return () => subscription.remove();
  }, [enabled, today, dayStartHour, weekStartsOn]);
}
