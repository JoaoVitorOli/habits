/**
 * O React Compiler transforma componente em funcao com cache de hooks, e esta biblioteca
 * chama estes componentes na mao para montar a arvore do RemoteViews — o cache vira
 * "Invalid Hook Call". O arquivo inteiro fica fora do compiler; nao ha o que memorizar aqui,
 * porque nada disso roda numa arvore React de verdade.
 */
'use no memo';

import type { WidgetInfo } from 'react-native-android-widget';

import type { Day } from '@/domain/calendar';
import { DEFAULT_PREFERENCES } from '@/domain/preferences';
import { habitOf, type WidgetSnapshot } from '@/domain/widget-snapshot';
import { HabitWidget } from '@/widget/habit-widget';
import { ListWidget } from '@/widget/list-widget';

/** Precisa bater com o `name` de cada receiver em app.json. */
export const WIDGET_NAMES = {
  pequeno: 'HabitoPequeno',
  medio: 'HabitoMedio',
  lista: 'ListaCompacta',
} as const;

/**
 * As duas entradas de habito unico abrem a Activity de configuracao ao entrar na tela; a
 * lista compacta nao pergunta nada, entao nem receiver configuravel ela e.
 */
export function asksForHabit(widgetName: string): boolean {
  return widgetName !== WIDGET_NAMES.lista;
}

type RenderInput = {
  info: WidgetInfo;
  snapshot: WidgetSnapshot | null;
  /** o habito que este widget guardou na configuracao; a lista compacta nao tem um */
  habitId: string | null;
  today: Day;
};

/**
 * Tres receivers, tres desenhos, um lugar so que decide qual. Quem escolhe o layout e a
 * entrada que o usuario arrastou do seletor, nunca a medida da caixa.
 */
export function widgetFor({ info, snapshot, habitId, today }: RenderInput) {
  const weekStartsOn = snapshot?.weekStartsOn ?? DEFAULT_PREFERENCES.weekStartsOn;

  if (info.widgetName === WIDGET_NAMES.lista) {
    return <ListWidget snapshot={snapshot} today={today} weekStartsOn={weekStartsOn} box={info} />;
  }

  return (
    <HabitWidget
      habit={habitOf(snapshot, habitId)}
      today={today}
      weekStartsOn={weekStartsOn}
      size={info.widgetName === WIDGET_NAMES.medio ? 'medio' : 'pequeno'}
      box={info}
    />
  );
}
