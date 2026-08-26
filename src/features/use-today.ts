import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { usePreferences } from '@/data/settings';
import { logicalDay, type Day } from '@/domain/calendar';

/**
 * O app pode ficar aberto atravessando a virada das 4h. Sem reavaliar, marcar "hoje"
 * gravaria no dia de ontem. Setar o mesmo valor nao re-renderiza.
 */
export function useToday(): Day {
  const { dayStartHour } = usePreferences();
  const [today, setToday] = useState(() => logicalDay(new Date(), dayStartHour));

  useEffect(() => {
    const refresh = () => setToday(logicalDay(new Date(), dayStartHour));

    // mudar a virada no ajustes muda o dia logico agora, nao no proximo minuto
    refresh();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const timer = setInterval(refresh, 60_000);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [dayStartHour]);

  return today;
}
