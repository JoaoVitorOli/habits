import { logicalDay, type Day } from '@/domain/calendar';

/** Ate a tela de ajustes existir (fatia 20 do PRD), a virada e a padrao. */
export const DEFAULT_DAY_START_HOUR = 4;

export function useToday(): Day {
  return logicalDay(new Date(), DEFAULT_DAY_START_HOUR);
}
