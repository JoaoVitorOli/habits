/**
 * O React Compiler transforma componente em funcao com cache de hooks, e esta biblioteca
 * chama estes componentes na mao para montar a arvore do RemoteViews — o cache vira
 * "Invalid Hook Call". O arquivo inteiro fica fora do compiler; nao ha o que memorizar aqui,
 * porque nada disso roda numa arvore React de verdade.
 */
'use no memo';

import { FlexWidget, TextWidget, type ColorProp } from 'react-native-android-widget';

import { weekColumns, type Day } from '@/domain/calendar';
import { paletteKeyOf } from '@/domain/palette';
import { SNAPSHOT_DAYS, type SnapshotHabit } from '@/domain/widget-snapshot';
import { streakLabel } from '@/features/streak-label';
import { color, fontFamily, palette, space } from '@/ui/theme';
import {
  asColor,
  clamp,
  DayCell,
  EmptyWidget,
  IconSquare,
  lastDays,
  MARK_TARGET,
  MarkButton,
  MAX_CELL,
  MIN_CELL,
  stripMetrics,
  Surface,
  type WidgetBox,
} from '@/widget/parts';

/**
 * Duas entradas no seletor, um hábito cada. O tamanho nao e adivinhado pela medida: quem
 * escolhe e o receiver que o usuario arrastou para a tela.
 */
export type HabitWidgetSize = 'pequeno' | 'medio';

/** No pequeno o cabecalho e so o quadrado do icone com o nome ao lado. */
const SMALL_ICON = 32;
const MEDIUM_ICON = 44;

/** O snapshot guarda 120 dias; pedir mais colunas do que isso desenharia vazio garantido. */
const MAX_WEEKS = Math.floor(SNAPSHOT_DAYS / 7);

/** Sete linhas de celula minima mais os vaos: abaixo disso a semana nao cabe em pe. */
const GRID_FLOOR = 7 * MIN_CELL + 6 * space.xs;

type Props = {
  habit: SnapshotHabit | null;
  today: Day;
  /** vem do snapshot: o widget desenha a semana do mesmo jeito que o app */
  weekStartsOn: number;
  size: HabitWidgetSize;
  /** o tamanho vem medido do Android: a area de dias sai dele */
  box: WidgetBox;
};

export function HabitWidget({ habit, today, weekStartsOn, size, box }: Props) {
  if (habit === null) return <EmptyWidget message="Escolha um hábito" />;

  const accent = asColor(palette[paletteKeyOf(habit.color)]);
  const small = size === 'pequeno';
  const padding = small ? space.sm : space.md;
  const gap = small ? space.sm : space.md;
  const header = small ? SMALL_ICON : MARK_TARGET;

  return (
    <Surface
      padding={padding}
      gap={gap}
      clickAction="OPEN_URI"
      clickActionData={{ uri: `habits://habito/${habit.id}` }}
      accessibilityLabel={`Abrir ${habit.name}`}>
      {small ? (
        <SmallHeader habit={habit} accent={accent} />
      ) : (
        <MediumHeader habit={habit} today={today} accent={accent} />
      )}
      <Days
        habit={habit}
        today={today}
        accent={accent}
        weekStartsOn={weekStartsOn}
        available={box.height - 2 * padding - header - gap}
        usableWidth={box.width - 2 * padding}
      />
    </Surface>
  );
}

function SmallHeader({ habit, accent }: { habit: SnapshotHabit; accent: ColorProp }) {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        flexGap: space.sm,
      }}>
      <IconSquare icon={habit.icon} accent={accent} square={SMALL_ICON} />
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={habit.name}
          maxLines={1}
          truncate="END"
          style={{ fontFamily: fontFamily.semibold, fontSize: 16, color: color.ink }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

function MediumHeader({
  habit,
  today,
  accent,
}: {
  habit: SnapshotHabit;
  today: Day;
  accent: ColorProp;
}) {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        flexGap: space.md,
      }}>
      <IconSquare icon={habit.icon} accent={accent} square={MEDIUM_ICON} />
      <FlexWidget style={{ flex: 1, flexGap: space.xs }}>
        <TextWidget
          text={habit.name}
          maxLines={1}
          truncate="END"
          style={{ fontFamily: fontFamily.semibold, fontSize: 20, color: color.ink }}
        />
        <TextWidget
          // quem nao escreveu descricao nao fica com uma linha vazia: a sequencia ocupa o lugar
          text={habit.description ?? streakLabel(habit.currentStreak, habit.streakUnit)}
          maxLines={1}
          truncate="END"
          style={{ fontFamily: fontFamily.regular, fontSize: 12, color: color.inkMuted }}
        />
      </FlexWidget>
      <MarkButton habit={habit} today={today} accent={accent} />
    </FlexWidget>
  );
}

/**
 * A area de dias sai da caixa medida, nao de constantes: com 14 semanas fixas sobrava quase
 * metade do widget vazia a direita. Onde as sete linhas da semana cabem em pe, a grade e a
 * matriz de sempre; onde nao cabem — 4x1, por exemplo — ela deita numa faixa de dias.
 */
function Days({
  habit,
  today,
  accent,
  weekStartsOn,
  available,
  usableWidth,
}: {
  habit: SnapshotHabit;
  today: Day;
  accent: ColorProp;
  weekStartsOn: number;
  available: number;
  usableWidth: number;
}) {
  if (available < MIN_CELL) return null;

  if (available < GRID_FLOOR) {
    const { cell, days } = stripMetrics(usableWidth, clamp(available, MIN_CELL, MAX_CELL));

    return (
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'center', flexGap: space.xs }}>
        {lastDays(today, days, weekStartsOn).map((day) => (
          <DayCell key={day} habit={habit} day={day} today={today} accent={accent} size={cell} />
        ))}
      </FlexWidget>
    );
  }

  // quem manda na celula sao as sete linhas: a altura e o lado apertado da grade em pe
  const cell = clamp(Math.floor((available + space.xs) / 7) - space.xs, MIN_CELL, MAX_CELL);
  const weeks = clamp(Math.floor((usableWidth + space.xs) / (cell + space.xs)), 1, MAX_WEEKS);

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        justifyContent: 'center',
        flexGap: space.xs,
      }}>
      {weekColumns(today, weeks, weekStartsOn).map((week) => (
        <FlexWidget key={week[0]} style={{ flexGap: space.xs }}>
          {week.map((day) => (
            <DayCell key={day} habit={habit} day={day} today={today} accent={accent} size={cell} />
          ))}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
