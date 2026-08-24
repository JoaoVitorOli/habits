import type { WidgetTaskHandler } from 'react-native-android-widget';

import { toggleCompletion } from '@/data/completions';
import { habitByIdQuery } from '@/data/habits';
import { forgetWidgetHabit, readWidgetSnapshot, saveWidgetSnapshot, widgetHabitId } from '@/data/widget';
import { logicalDay } from '@/domain/calendar';
import { habitOf, toggleDay } from '@/domain/widget-snapshot';
import { DEFAULT_DAY_START_HOUR, DEFAULT_WEEK_STARTS_ON } from '@/features/use-today';
import { HabitWidget, TOGGLE_TODAY } from '@/widget/habit-widget';

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
  const today = logicalDay(now, DEFAULT_DAY_START_HOUR);
  const habitId = await widgetHabitId(widgetInfo.widgetId);
  const habit = habitOf(await readWidgetSnapshot(), habitId);

  if (widgetAction === 'WIDGET_CLICK' && clickAction === TOGGLE_TODAY && habit !== null) {
    // otimista: o dedo nao espera a gravacao, e a regra do toggle e a mesma dos dois lados
    renderWidget(<HabitWidget habit={toggleDay(habit, today)} today={today} box={widgetInfo} />);

    const [row] = await habitByIdQuery(habit.id);
    if (!row) return;

    await toggleCompletion(row, today, now);
    const snapshot = await saveWidgetSnapshot(today, DEFAULT_WEEK_STARTS_ON, now);
    renderWidget(<HabitWidget habit={habitOf(snapshot, habitId)} today={today} box={widgetInfo} />);
    return;
  }

  renderWidget(<HabitWidget habit={habit} today={today} box={widgetInfo} />);
};
