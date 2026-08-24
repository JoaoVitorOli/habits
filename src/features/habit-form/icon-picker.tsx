import * as Haptics from 'expo-haptics';
import X from 'lucide-react-native/icons/x';
import { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PaletteKey } from '@/domain/palette';
import { emojis } from '@/features/habit-form/emojis';
import { Icon, type IconRef } from '@/ui/icon';
import { lucideIconNames } from '@/ui/icons';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, fontFamily, palette, radius, space, withOpacity } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

const columns: Record<Breakpoint, number> = { compact: 5, medium: 8, expanded: 10 };

type Props = {
  value: IconRef;
  accent: PaletteKey;
  onChange: (icon: IconRef) => void;
};

export function IconPicker({ value, accent, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'lucide' | 'emoji'>('lucide');
  const [search, setSearch] = useState('');
  const breakpoint = useBreakpoint();

  const found = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? lucideIconNames.filter((name) => name.includes(term)) : lucideIconNames;
  }, [search]);

  const tint = palette[accent];

  const choose = (icon: IconRef) => {
    Haptics.selectionAsync();
    onChange(icon);
    setOpen(false);
  };

  return (
    <View style={styles.group}>
      <Text variant="label" tone="inkFaint">
        Ícone
      </Text>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Escolher ícone"
        onPress={() => setOpen(true)}
        style={styles.trigger}>
        <View style={[styles.square, { backgroundColor: withOpacity(tint, 0.16) }]}>
          <Icon icon={value} size={24} color={tint} />
        </View>
        <Text variant="body" tone="inkMuted">
          Trocar ícone
        </Text>
      </PressableScale>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text variant="heading">Escolher ícone</Text>
            <PressableScale accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setOpen(false)}>
              <X size={24} color={color.inkMuted} />
            </PressableScale>
          </View>

          <View style={styles.tabs}>
            <Tab label="Ícones" selected={tab === 'lucide'} onPress={() => setTab('lucide')} />
            <Tab label="Emoji" selected={tab === 'emoji'} onPress={() => setTab('emoji')} />
          </View>

          {tab === 'lucide' ? (
            <>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar (em inglês): run, book, water…"
                placeholderTextColor={color.inkFaint}
                style={styles.search}
              />
              <FlatList
                key={`lucide-${columns[breakpoint]}`}
                data={found}
                numColumns={columns[breakpoint]}
                keyExtractor={(name) => name}
                contentContainerStyle={styles.grid}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const icon = `lucide:${item}`;
                  const selected = icon === value;
                  return (
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityLabel={item}
                      onPress={() => choose(icon)}
                      style={[styles.cell, selected ? { backgroundColor: withOpacity(tint, 0.16) } : null]}>
                      <Icon icon={icon} size={24} color={selected ? tint : color.inkMuted} />
                    </PressableScale>
                  );
                }}
              />
            </>
          ) : (
            <FlatList
              key={`emoji-${columns[breakpoint]}`}
              data={emojis}
              numColumns={columns[breakpoint]}
              keyExtractor={(emoji) => emoji}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => {
                const icon = `emoji:${item}`;
                const selected = icon === value;
                return (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={item}
                    onPress={() => choose(icon)}
                    style={[styles.cell, selected ? { backgroundColor: withOpacity(tint, 0.16) } : null]}>
                    <Icon icon={icon} size={24} color={color.ink} />
                  </PressableScale>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function Tab({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tab, selected ? styles.tabOn : null]}>
      <Text variant="label" tone={selected ? 'ink' : 'inkMuted'}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.sm,
  },
  square: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  sheet: { flex: 1, backgroundColor: color.surface },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: space.xs,
    marginHorizontal: space.lg,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.pill,
    padding: space.xs,
  },
  tab: { flex: 1, minHeight: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: color.accent },
  search: {
    margin: space.lg,
    marginBottom: space.sm,
    minHeight: 48,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.md,
    color: color.ink,
    fontFamily: fontFamily.regular,
    fontSize: 18,
  },
  grid: { padding: space.md, gap: space.sm },
  cell: {
    flex: 1,
    height: 56,
    margin: space.xs,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceRaised,
  },
});
