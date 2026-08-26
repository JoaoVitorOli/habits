import type { WidgetTaskHandler } from 'react-native-android-widget';

import { toggleCompletion } from '@/data/completions';
import { habitByIdQuery } from '@/data/habits';
import { forgetWidgetHabit, readWidgetSnapshot, saveWidgetSnapshot, widgetHabitId } from '@/data/widget';
import { logicalDay } from '@/domain/calendar';
import { DEFAULT_PREFERENCES, preferencesOf } from '@/domain/preferences';
import { toggleHabit, type WidgetSnapshot } from '@/domain/widget-snapshot';
import { TOGGLE_TODAY } from '@/widget/parts';
import { drawWidgets } from '@/widget/refresh';
import { asksForHabit, widgetFor } from '@/widget/render';

/**
 * Roda no contexto headless, sem app aberto. Desenhar le so o snapshot — o SQLite pode nao
 * estar disponivel aqui. Marcar grava no banco, porque essa e a unica coisa que o snapshot
 * nao sabe fazer sozinho.
 */
export const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetInfo,
  widgetAction,
  clickAction,
  clickActionData,
  renderWidget,
}) => {
  if (widgetAction === 'WIDGET_DELETED') {
    await forgetWidgetHabit(widgetInfo.widgetId);
    return;
  }

  const now = new Date();
  // as preferencias viajam no snapshot: aqui nao ha banco para perguntar a que horas vira o dia
  const stored = await readWidgetSnapshot();
  const preferences = stored === null ? DEFAULT_PREFERENCES : preferencesOf(stored);
  const today = logicalDay(now, preferences.dayStartHour);
  const habitId = asksForHabit(widgetInfo.widgetName)
    ? await widgetHabitId(widgetInfo.widgetId)
    : null;

  const draw = (snapshot: WidgetSnapshot | null) =>
    renderWidget(widgetFor({ info: widgetInfo, snapshot, habitId, today }));

  // quem foi tocado vem no clique: na lista compacta nao e o habito do widget, e o da linha
  const marked = typeof clickActionData?.habitId === 'string' ? clickActionData.habitId : null;

  if (widgetAction === 'WIDGET_CLICK' && clickAction === TOGGLE_TODAY && marked !== null) {
    // otimista: o dedo nao espera a gravacao, e a regra do toggle e a mesma dos dois lados
    draw(toggleHabit(stored, marked, today));

    const [row] = await habitByIdQuery(marked);
    if (!row) return;

    await toggleCompletion(row, today, now);
    const snapshot = await saveWidgetSnapshot(today, preferences, now);
    // o mesmo habito pode estar em varios widgets: marcar num deles desatualiza os outros
    await drawWidgets(snapshot, today);
    return;
  }

  draw(stored);
};
