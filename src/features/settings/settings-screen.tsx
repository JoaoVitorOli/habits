import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import Archive from 'lucide-react-native/icons/archive';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import DatabaseBackup from 'lucide-react-native/icons/database-backup';
import Sunrise from 'lucide-react-native/icons/sunrise';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';

/**
 * Indice: um assunto por linha, cada um na sua pagina. A tela unica ja tinha cinco blocos
 * empilhados, e o proximo assunto so piorava a pilha.
 */
const pages = [
  {
    href: '/ajustes/habitos' as Href,
    icon: Archive,
    title: 'Hábitos',
    hint: 'Ordem na home e arquivados',
  },
  {
    href: '/ajustes/dia' as Href,
    icon: Sunrise,
    title: 'Dia e semana',
    hint: 'Virada do dia e primeiro dia da semana',
  },
  {
    href: '/ajustes/backup' as Href,
    icon: DatabaseBackup,
    title: 'Backup',
    hint: 'Exportar e importar o arquivo JSON',
  },
];

export function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={styles.action}>
          <ChevronLeft size={28} color={color.inkMuted} />
        </PressableScale>
        <Text variant="heading">Ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {pages.map(({ href, icon: Glyph, title, hint }) => (
            <PressableScale
              key={title}
              accessibilityRole="button"
              accessibilityLabel={title}
              onPress={() => router.push(href)}
              style={styles.row}>
              <Glyph size={22} color={color.inkMuted} />
              <View style={styles.identity}>
                <Text variant="body">{title}</Text>
                <Text variant="caption" tone="inkFaint" numberOfLines={1}>
                  {hint}
                </Text>
              </View>
              <ChevronRight size={20} color={color.inkFaint} />
            </PressableScale>
          ))}
        </View>

        <Text variant="caption" tone="inkFaint">
          Versão {Constants.expoConfig?.version ?? '—'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space['3xl'] },
  list: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingHorizontal: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderTopWidth: 1,
    borderTopColor: color.edge,
  },
  identity: { flex: 1, gap: space.xs },
  action: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
