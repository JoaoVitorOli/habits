import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { color, typographyOf, type Variant } from '@/ui/theme';
import { useBreakpoint } from '@/ui/use-breakpoint';

type Tone = 'ink' | 'inkMuted' | 'inkFaint' | 'inkDisabled' | 'accent' | 'sucesso' | 'perigo';

type Props = TextProps & {
  variant?: Variant;
  tone?: Tone;
  /** numeros que vivem em coluna precisam de largura fixa por digito */
  tabular?: boolean;
};

export function Text({ variant = 'body', tone = 'ink', tabular = false, style, ...rest }: Props) {
  const breakpoint = useBreakpoint();
  return (
    <RNText
      {...rest}
      style={StyleSheet.compose(
        [
          typographyOf(variant, breakpoint),
          { color: color[tone] },
          tabular ? styles.tabular : null,
        ],
        style,
      )}
    />
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
});
