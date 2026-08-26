/**
 * O React Compiler transforma componente em funcao com cache de hooks, e esta biblioteca
 * chama estes componentes na mao para montar a arvore do RemoteViews — o cache vira
 * "Invalid Hook Call". O arquivo inteiro fica fora do compiler; nao ha o que memorizar aqui,
 * porque nada disso roda numa arvore React de verdade.
 */
'use no memo';

import {
  FlexWidget,
  SvgWidget,
  TextWidget,
  type ColorProp,
  type WidgetInfo,
} from 'react-native-android-widget';

import { weekColumns, type Day } from '@/domain/calendar';
import { paletteKeyOf } from '@/domain/palette';
import { SNAPSHOT_DAYS, isDone, type SnapshotHabit } from '@/domain/widget-snapshot';
import { streakLabel } from '@/features/streak-label';
import { iconKind, iconValue, type IconRef } from '@/ui/icon';
import { color, fontFamily, palette, radius, space, withOpacity } from '@/ui/theme';
import { lucidePaths } from '@/widget/lucide-paths';

/** Uma acao so, resolvida pelo task handler: marcar ou desmarcar hoje. */
export const TOGGLE_TODAY = 'MARCAR_HOJE';

/**
 * Um receiver so, tres desenhos. O tamanho vem medido do Android, entao o widget se adapta
 * a qualquer redimensionamento em vez de existir tres vezes no seletor.
 */
export type WidgetSize = 'pequeno' | 'medio' | 'grande';

export type WidgetBox = Pick<WidgetInfo, 'width' | 'height'>;

export function widgetSize({ width, height }: WidgetBox): WidgetSize {
  if (width < 180) return 'pequeno';
  return height < 180 ? 'medio' : 'grande';
}

const DAY_STRIP = 14;

/** O botao de marcar e o elemento mais alto do cabecalho, e ele tem alvo de 48dp. */
const HEADER = 48;

const MIN_CELL = 8;
const MAX_CELL = 16;
const MIN_WEEKS = 8;

/** O snapshot guarda 120 dias; pedir mais colunas do que isso desenharia vazio garantido. */
const MAX_WEEKS = Math.floor(SNAPSHOT_DAYS / 7);

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

/**
 * A grade sai da caixa medida, nao de constantes: com 14 semanas fixas sobrava quase metade
 * do widget vazia a direita. Quem manda na celula sao as sete linhas — a altura e o lado
 * apertado; a largura so decide quantas semanas cabem depois disso.
 */
function gridMetrics({ width, height }: WidgetBox): { cell: number; weeks: number } {
  const usableHeight = height - 2 * space.md - HEADER - space.md;
  const cell = clamp(Math.floor((usableHeight + space.xs) / 7) - space.xs, MIN_CELL, MAX_CELL);

  const usableWidth = width - 2 * space.md;
  const weeks = clamp(Math.floor((usableWidth + space.xs) / (cell + space.xs)), MIN_WEEKS, MAX_WEEKS);

  return { cell, weeks };
}

/**
 * O tipo de cor do widget e literal (`#rrggbb` ou `rgba(...)`), e a paleta e um `string`
 * comum. Os dois `as` deste arquivo moram aqui, onde a forma da string e conhecida.
 */
function tint(hex: string, alpha: number): ColorProp {
  return withOpacity(hex, alpha) as ColorProp;
}

function asColor(hex: string): ColorProp {
  return hex as ColorProp;
}

function svgOf(body: string, stroke: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/** O visto do botao de marcar. E o unico icone do widget que nao vem do habito. */
const CHECK = '<path d="M20 6 9 17l-5-5"/>';

type Props = {
  habit: SnapshotHabit | null;
  today: Day;
  /** vem do snapshot: o widget desenha a semana do mesmo jeito que o app */
  weekStartsOn: number;
  /** o tamanho vem medido do Android: o desenho e a grade saem dele */
  box: WidgetBox;
};

export function HabitWidget({ habit, today, weekStartsOn, box }: Props) {
  if (habit === null) return <EmptyWidget />;

  const size = widgetSize(box);
  const accent = asColor(palette[paletteKeyOf(habit.color)]);
  const padding = size === 'pequeno' ? space.sm : space.md;

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `habits://habito/${habit.id}` }}
      accessibilityLabel={`Abrir ${habit.name}`}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: color.surface,
        borderRadius: radius.xl,
        padding,
        // widget alto (4x4) tem mais altura do que conteudo: o bloco fica centrado, nao no topo
        justifyContent: 'center',
        flexGap: size === 'pequeno' ? space.sm : space.md,
      }}>
      <Header habit={habit} today={today} accent={accent} size={size} />
      {size === 'medio' ? (
        <DayStrip habit={habit} today={today} accent={accent} weekStartsOn={weekStartsOn} />
      ) : null}
      {size === 'grande' ? (
        <Grid habit={habit} today={today} accent={accent} weekStartsOn={weekStartsOn} {...gridMetrics(box)} />
      ) : null}
    </FlexWidget>
  );
}

function Header({
  habit,
  today,
  accent,
  size,
}: {
  habit: SnapshotHabit;
  today: Day;
  accent: ColorProp;
  size: WidgetSize;
}) {
  const square = size === 'pequeno' ? 36 : 44;

  const identity = (
    <FlexWidget style={{ flex: 1, flexGap: space.xs }}>
      <TextWidget
        text={habit.name}
        maxLines={1}
        truncate="END"
        style={{ fontFamily: fontFamily.semibold, fontSize: 20, color: color.ink }}
      />
      <TextWidget
        text={streakLabel(habit.currentStreak, habit.streakUnit)}
        maxLines={1}
        style={{ fontFamily: fontFamily.regular, fontSize: 12, color: color.inkMuted }}
      />
    </FlexWidget>
  );

  const art = <IconSquare icon={habit.icon} accent={accent} square={square} />;
  const mark = <MarkButton habit={habit} today={today} accent={accent} />;

  /* no 2x2 nao cabe icone, nome e botao na mesma linha: o nome desce */
  if (size === 'pequeno') {
    return (
      <FlexWidget style={{ width: 'match_parent', flexGap: space.sm }}>
        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {art}
          {mark}
        </FlexWidget>
        {identity}
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', flexGap: space.md }}>
      {art}
      {identity}
      {mark}
    </FlexWidget>
  );
}

function IconSquare({ icon, accent, square }: { icon: IconRef; accent: ColorProp; square: number }) {
  const glyph = Math.round(square * 0.55);

  return (
    <FlexWidget
      style={{
        width: square,
        height: square,
        borderRadius: radius.md,
        backgroundColor: tint(accent, 0.16),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Glyph icon={icon} accent={accent} size={glyph} />
    </FlexWidget>
  );
}

function Glyph({ icon, accent, size }: { icon: IconRef; accent: ColorProp; size: number }) {
  if (iconKind(icon) === 'emoji') {
    return <TextWidget text={iconValue(icon)} style={{ fontSize: size }} />;
  }

  const body = lucidePaths[iconValue(icon)];
  if (!body) return <FlexWidget style={{ width: size, height: size }} />;

  return <SvgWidget svg={svgOf(body, accent)} style={{ width: size, height: size }} />;
}

/** Alvo de 48dp: o toque acontece com o widget na tela inicial, sem chance de mira fina. */
function MarkButton({ habit, today, accent }: { habit: SnapshotHabit; today: Day; accent: ColorProp }) {
  const done = isDone(habit, today);
  const count = habit.days[today] ?? 0;
  // sem o numero, uma meta de tres desenharia 1/3 igual a 0/3 na tela inicial
  const partial = !done && habit.targetPerDay > 1;

  return (
    <FlexWidget
      clickAction={TOGGLE_TODAY}
      clickActionData={{ habitId: habit.id }}
      accessibilityLabel={done ? `Desmarcar ${habit.name} hoje` : `Marcar ${habit.name} hoje`}
      style={{
        width: 48,
        height: 48,
        borderRadius: radius.pill,
        borderWidth: 2,
        borderColor: tint(accent, 0.4),
        backgroundColor: done ? accent : tint(accent, 0),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {partial ? (
        <TextWidget
          text={`${count}/${habit.targetPerDay}`}
          style={{ fontFamily: fontFamily.medium, fontSize: 13, color: accent }}
        />
      ) : (
        <SvgWidget svg={svgOf(CHECK, done ? color.ink : accent)} style={{ width: 24, height: 24 }} />
      )}
    </FlexWidget>
  );
}

/** 4x2 nao tem altura para as sete linhas da matriz: a semana vira uma faixa. */
function DayStrip({
  habit,
  today,
  accent,
  weekStartsOn,
}: {
  habit: SnapshotHabit;
  today: Day;
  accent: ColorProp;
  weekStartsOn: number;
}) {
  const week = weekColumns(today, 1, weekStartsOn)[0];

  return (
    <FlexWidget style={{ flexDirection: 'row', flexGap: space.xs }}>
      {week.map((day) => (
        <Cell key={day} habit={habit} day={day} today={today} accent={accent} size={DAY_STRIP} />
      ))}
    </FlexWidget>
  );
}

function Grid({
  habit,
  today,
  accent,
  weekStartsOn,
  weeks,
  cell,
}: {
  habit: SnapshotHabit;
  today: Day;
  accent: ColorProp;
  weekStartsOn: number;
  weeks: number;
  cell: number;
}) {
  return (
    <FlexWidget
      style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'center', flexGap: space.xs }}>
      {weekColumns(today, weeks, weekStartsOn).map((week) => (
        <FlexWidget key={week[0]} style={{ flexGap: space.xs }}>
          {week.map((day) => (
            <Cell key={day} habit={habit} day={day} today={today} accent={accent} size={cell} />
          ))}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}

function Cell({
  habit,
  day,
  today,
  accent,
  size,
}: {
  habit: SnapshotHabit;
  day: Day;
  today: Day;
  accent: ColorProp;
  size: number;
}) {
  const done = isDone(habit, day);

  return (
    <FlexWidget
      style={{
        width: size,
        height: size,
        borderRadius: radius.sm / 2,
        backgroundColor: done ? accent : day > today ? color.surfaceRaised : color.surfaceOverlay,
        ...(day === today && !done ? { borderWidth: 1, borderColor: tint(accent, 0.6) } : {}),
      }}
    />
  );
}

/** O habito pode ter sido arquivado ou excluido depois que o widget foi para a tela. */
function EmptyWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: color.surface,
        borderRadius: radius.xl,
        padding: space.md,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <TextWidget
        text="Escolha um hábito"
        style={{ fontFamily: fontFamily.medium, fontSize: 16, color: color.inkMuted, textAlign: 'center' }}
      />
    </FlexWidget>
  );
}
