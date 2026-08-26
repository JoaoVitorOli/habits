/**
 * O React Compiler transforma componente em funcao com cache de hooks, e esta biblioteca
 * chama estes componentes na mao para montar a arvore do RemoteViews — o cache vira
 * "Invalid Hook Call". O arquivo inteiro fica fora do compiler; nao ha o que memorizar aqui,
 * porque nada disso roda numa arvore React de verdade.
 */
'use no memo';

import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { weekdayOf, type Day } from '@/domain/calendar';
import { paletteKeyOf } from '@/domain/palette';
import { habitsOf, type SnapshotHabit, type WidgetSnapshot } from '@/domain/widget-snapshot';
import { color, fontFamily, palette, space } from '@/ui/theme';
import {
  asColor,
  DayCell,
  EmptyWidget,
  IconSquare,
  lastDays,
  stripMetrics,
  Surface,
  type WidgetBox,
} from '@/widget/parts';

/**
 * Uma letra so por coluna. `S` e `Q` repetem — e o preco de caber numa coluna de 16dp, e a
 * posicao no bloco de sete resolve a ambiguidade tao bem quanto o app faz no heatmap.
 */
const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Altura de uma linha: o quadrado do icone e o elemento mais alto dela. */
const ROW = 24;
const LABELS = 12;

type Props = {
  snapshot: WidgetSnapshot | null;
  today: Day;
  /** vem do snapshot: o widget desenha a semana do mesmo jeito que o app */
  weekStartsOn: number;
  /** o tamanho vem medido do Android: quantos habitos e quantos dias saem dele */
  box: WidgetBox;
};

/**
 * A unica entrada do seletor que nao pergunta nada: mostra os habitos ativos na ordem do app,
 * cortando no que couber na altura, e cada linha marca o seu proprio hoje.
 */
export function ListWidget({ snapshot, today, weekStartsOn, box }: Props) {
  const padding = space.sm;
  const gap = space.sm;

  const available = box.height - 2 * padding - LABELS - gap;
  // encolhido ao minimo o widget corta a ultima linha, mas mostrar zero habito seria mentir
  const rows = Math.max(1, Math.floor((available + gap) / (ROW + gap)));
  const habits = habitsOf(snapshot, rows);

  if (habits.length === 0) return <EmptyWidget message="Crie um hábito no app" />;

  const { cell, days } = stripMetrics(box.width - 2 * padding - ROW - gap, ROW - space.sm);
  const columns = lastDays(today, days, weekStartsOn);

  return (
    <Surface padding={padding} gap={gap} clickAction="OPEN_APP">
      <Labels days={columns} cell={cell} />
      {habits.map((habit) => (
        <Row key={habit.id} habit={habit} days={columns} today={today} cell={cell} />
      ))}
    </Surface>
  );
}

/** Os dias da semana no topo, uma letra por coluna, alinhados pelo mesmo vao das bolinhas. */
function Labels({ days, cell }: { days: Day[]; cell: number }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', flexGap: space.sm }}>
      <FlexWidget style={{ width: ROW, height: LABELS }} />
      <FlexWidget style={{ flexDirection: 'row', flexGap: space.xs }}>
        {days.map((day) => (
          <TextWidget
            key={day}
            text={WEEKDAY_LETTERS[weekdayOf(day)]}
            style={{
              width: cell,
              fontFamily: fontFamily.medium,
              fontSize: 10,
              color: color.inkFaint,
              textAlign: 'center',
            }}
          />
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}

function Row({
  habit,
  days,
  today,
  cell,
}: {
  habit: SnapshotHabit;
  days: Day[];
  today: Day;
  cell: number;
}) {
  const accent = asColor(palette[paletteKeyOf(habit.color)]);

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `habits://habito/${habit.id}` }}
      accessibilityLabel={`Abrir ${habit.name}`}
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        flexGap: space.sm,
      }}>
      <IconSquare icon={habit.icon} accent={accent} square={ROW} />
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flexGap: space.xs }}>
        {days.map((day) => (
          <DayCell key={day} habit={habit} day={day} today={today} accent={accent} size={cell} />
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
