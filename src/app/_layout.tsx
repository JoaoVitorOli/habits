import {
  BarlowCondensed_300Light,
  BarlowCondensed_400Regular,
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  useFonts,
} from '@expo-google-fonts/barlow-condensed';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db } from '@/data/db';
import { purgeDeleted } from '@/data/maintenance';
import migrations from '@/data/migrations/migrations';
import { rescheduleReminders } from '@/data/notifications';
import { duration } from '@/ui/motion';
import { color } from '@/ui/theme';
import { useWidgetRefresh } from '@/widget/refresh';

SplashScreen.preventAutoHideAsync();

/* a splash nao corta: ela dissolve na home, no mesmo tempo que o resto do app se move */
SplashScreen.setOptions({ duration: duration.sheet, fade: true });

const tema = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: color.ground,
    card: color.surface,
    text: color.ink,
    border: color.line,
    primary: color.accent,
  },
};

export default function RootLayout() {
  const [fontesCarregadas, erroDeFonte] = useFonts({
    BarlowCondensed_300Light,
    BarlowCondensed_400Regular,
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });

  const { success: bancoPronto, error: erroDeMigracao } = useMigrations(db, migrations);

  const pronto = (fontesCarregadas || erroDeFonte) && (bancoPronto || erroDeMigracao);

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  /* o Android perde os alarmes agendados no boot: remontar na abertura e o conserto barato */
  useEffect(() => {
    if (bancoPronto) rescheduleReminders();
  }, [bancoPronto]);

  /* a linha apagada ha 90 dias ja entregou o recado; varrer na abertura basta, e nada espera */
  useEffect(() => {
    if (bancoPronto) purgeDeleted(new Date()).catch(() => {});
  }, [bancoPronto]);

  useWidgetRefresh(bancoPronto);

  if (!pronto) return null;

  if (erroDeMigracao) throw erroDeMigracao;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.ground }}>
      <SafeAreaProvider>
        <ThemeProvider value={tema}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.ground } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="habito/novo" options={{ presentation: 'modal' }} />
            <Stack.Screen name="habito/editar/[id]" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
