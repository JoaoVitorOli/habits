/**
 * Preferencias do aparelho: a virada do dia, o inicio da semana e o modo da home.
 * Elas entram em quase todo calculo de calendario, entao o que chega torto vira padrao aqui
 * e nao vira `NaN` la na frente. Local, nunca sincroniza.
 */
export type HomeView = 'grid' | 'compact';

export type Preferences = {
  /** hora local em que o dia logico vira; 4 = uma marcacao a 00:40 pertence a ontem */
  dayStartHour: number;
  /** 0 = domingo, 1 = segunda */
  weekStartsOn: number;
  homeView: HomeView;
};

export const DEFAULT_PREFERENCES: Preferences = {
  dayStartHour: 4,
  weekStartsOn: 0,
  homeView: 'grid',
};

/**
 * A linha pode nao existir ainda, ou ter vindo de uma versao que escrevia outra coisa — por isso
 * a entrada e frouxa: quem chama passa a linha crua do banco, sem prometer nada sobre ela.
 */
export type PreferencesInput = Partial<Record<keyof Preferences, unknown>>;

export function preferencesOf(row: PreferencesInput | null | undefined): Preferences {
  if (!row) return DEFAULT_PREFERENCES;

  return {
    dayStartHour: isHour(row.dayStartHour) ? row.dayStartHour : DEFAULT_PREFERENCES.dayStartHour,
    weekStartsOn:
      row.weekStartsOn === 0 || row.weekStartsOn === 1 ? row.weekStartsOn : DEFAULT_PREFERENCES.weekStartsOn,
    homeView: row.homeView === 'grid' || row.homeView === 'compact' ? row.homeView : DEFAULT_PREFERENCES.homeView,
  };
}

/** O passo da virada do dia da a volta: de 23h o proximo e 0h, e nao um limite surdo. */
export function wrapHour(hour: number): number {
  return ((hour % 24) + 24) % 24;
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function isHour(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23;
}
