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
import { isDone, SNAPSHOT_DAYS, type SnapshotHabit } from '@/domain/widget-snapshot';
import { iconKind, iconValue, type IconRef } from '@/ui/icon';
import { color, fontFamily, radius, space, withOpacity } from '@/ui/theme';
import { lucidePaths } from '@/widget/lucide-paths';

/** Uma acao so, resolvida pelo task handler: marcar ou desmarcar hoje. */
export const TOGGLE_TODAY = 'MARCAR_HOJE';

/** Os tres layouts saem da caixa que o Android mediu, nunca de constantes de tela. */
export type WidgetBox = Pick<WidgetInfo, 'width' | 'height'>;

/** O botao de marcar e o elemento mais alto do cabecalho, e ele tem alvo de 48dp. */
export const MARK_TARGET = 48;

export const MIN_CELL = 8;
export const MAX_CELL = 16;

export function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

/**
 * O tipo de cor do widget e literal (`#rrggbb` ou `rgba(...)`), e a paleta e um `string`
 * comum. Os dois `as` do widget moram aqui, onde a forma da string e conhecida.
 */
export function tint(hex: string, alpha: number): ColorProp {
  return withOpacity(hex, alpha) as ColorProp;
}

export function asColor(hex: string): ColorProp {
  return hex as ColorProp;
}

function svgOf(body: string, stroke: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/** O visto do botao de marcar. E o unico icone do widget que nao vem do habito. */
const CHECK = '<path d="M20 6 9 17l-5-5"/>';

/**
 * Uma linha corrida com os dias mais recentes, terminando no fim da semana de hoje — a mesma
 * ultima coluna da grade, deitada. O snapshot guarda 120 dias: pedir mais desenharia vazio.
 */
export function lastDays(today: Day, count: number, weekStartsOn: number): Day[] {
  const days = Math.min(count, SNAPSHOT_DAYS);
  return weekColumns(today, Math.ceil(days / 7), weekStartsOn).flat().slice(-days);
}

/**
 * Uma faixa de dias nunca mostra menos de uma semana. Quando a largura nao comporta sete
 * celulas do tamanho pedido, quem cede e a celula — no widget de 2x1 a altura sobrava e a
 * largura e que era o lado apertado.
 */
export function stripMetrics(usableWidth: number, maxCell: number): { cell: number; days: number } {
  const weekCell = clamp(Math.floor((usableWidth + space.xs) / 7) - space.xs, MIN_CELL, MAX_CELL);
  const cell = Math.min(maxCell, weekCell);

  return { cell, days: Math.max(7, Math.floor((usableWidth + space.xs) / (cell + space.xs))) };
}

/** A moldura de todo widget: mesma superficie, mesmo raio, mesmo respiro. */
export function Surface({
  padding,
  gap,
  clickAction,
  clickActionData,
  accessibilityLabel,
  children,
}: {
  padding: number;
  gap: number;
  clickAction: string;
  clickActionData?: Record<string, unknown>;
  accessibilityLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <FlexWidget
      clickAction={clickAction}
      clickActionData={clickActionData}
      accessibilityLabel={accessibilityLabel}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: color.surface,
        borderRadius: radius.xl,
        padding,
        // widget redimensionado para mais alto tem sobra: o bloco fica centrado, nao no topo
        justifyContent: 'center',
        flexGap: gap,
      }}>
      {children}
    </FlexWidget>
  );
}

export function IconSquare({
  icon,
  accent,
  square,
}: {
  icon: IconRef;
  accent: ColorProp;
  square: number;
}) {
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
      <Glyph icon={icon} accent={accent} size={Math.round(square * 0.55)} />
    </FlexWidget>
  );
}

export function Glyph({ icon, accent, size }: { icon: IconRef; accent: ColorProp; size: number }) {
  if (iconKind(icon) === 'emoji') {
    return <TextWidget text={iconValue(icon)} style={{ fontSize: size }} />;
  }

  const body = lucidePaths[iconValue(icon)];
  if (!body) return <FlexWidget style={{ width: size, height: size }} />;

  return <SvgWidget svg={svgOf(body, accent)} style={{ width: size, height: size }} />;
}

export function markLabel(habit: SnapshotHabit, day: Day): string {
  return isDone(habit, day) ? `Desmarcar ${habit.name} hoje` : `Marcar ${habit.name} hoje`;
}

/** Alvo de 48dp: o toque acontece com o widget na tela inicial, sem chance de mira fina. */
export function MarkButton({
  habit,
  today,
  accent,
}: {
  habit: SnapshotHabit;
  today: Day;
  accent: ColorProp;
}) {
  const done = isDone(habit, today);
  const count = habit.days[today] ?? 0;
  // sem o numero, uma meta de tres desenharia 1/3 igual a 0/3 na tela inicial
  const partial = !done && habit.targetPerDay > 1;

  return (
    <FlexWidget
      clickAction={TOGGLE_TODAY}
      clickActionData={{ habitId: habit.id }}
      accessibilityLabel={markLabel(habit, today)}
      style={{
        width: MARK_TARGET,
        height: MARK_TARGET,
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

/**
 * A bolinha de hoje marca e desmarca em qualquer layout: no medio ela repete o botao, e na
 * lista compacta ela e o unico jeito de marcar aquela linha.
 */
export function DayCell({
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
  const isToday = day === today;

  return (
    <FlexWidget
      clickAction={isToday ? TOGGLE_TODAY : undefined}
      clickActionData={isToday ? { habitId: habit.id } : undefined}
      accessibilityLabel={isToday ? markLabel(habit, today) : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: radius.sm / 2,
        backgroundColor: done ? accent : day > today ? color.surfaceRaised : color.surfaceOverlay,
        ...(isToday && !done ? { borderWidth: 1, borderColor: tint(accent, 0.6) } : {}),
      }}
    />
  );
}

/** O habito pode ter sido arquivado ou excluido depois que o widget foi para a tela. */
export function EmptyWidget({ message }: { message: string }) {
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
        text={message}
        maxLines={2}
        style={{
          fontFamily: fontFamily.medium,
          fontSize: 16,
          color: color.inkMuted,
          textAlign: 'center',
        }}
      />
    </FlexWidget>
  );
}
