import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { logicalDay, type Day } from '@/domain/calendar';

/** Ate a tela de ajustes existir (fatia 20 do PRD), a virada e o inicio da semana sao os padroes. */
export const DEFAULT_DAY_START_HOUR = 4;
export const DEFAULT_WEEK_STARTS_ON = 0;

/**
 * O app pode ficar aberto atravessando a virada das 4h. Sem reavaliar, marcar "hoje"
 * gravaria no dia de ontem. Setar o mesmo valor nao re-renderiza.
 */
export function useToday(): Day {
  const [today, setToday] = useState(() => logicalDay(new Date(), DEFAULT_DAY_START_HOUR));

  useEffect(() => {
    const refresh = () => setToday(logicalDay(new Date(), DEFAULT_DAY_START_HOUR));

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const timer = setInterval(refresh, 60_000);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);

  return today;
}
