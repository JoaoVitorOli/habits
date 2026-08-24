import type { TextStyle } from 'react-native';

import type { PaletteKey } from '@/domain/palette';
import type { Breakpoint } from '@/ui/use-breakpoint';

export const color = {
  ground: '#0A0710',
  surface: '#14101C',
  surfaceRaised: '#1B1826',
  surfaceOverlay: '#221E30',
  line: 'rgba(255,255,255,0.09)',
  edge: 'rgba(255,255,255,0.04)',
  ink: '#F3F1F8',
  inkMuted: '#9A93AD',
  inkFaint: '#5D5670',
  inkDisabled: '#3A3547',
  accent: '#6C4BF6',
  /** sombra preta so sob o que flutua de verdade: sheet, menu, FAB */
  shadow: '#000000',
  /** brilho do toque: no escuro a profundidade se faz com luz, nao com preto sobre preto */
  pressTint: 'rgba(243,241,248,0.12)',
  sucesso: '#34B978',
  perigo: '#EE5757',
} as const;

export const palette: Record<PaletteKey, string> = {
  violeta: '#6C4BF6',
  indigo: '#4C6BF5',
  azul: '#2E90E8',
  ciano: '#17B6BE',
  verde: '#34B978',
  lima: '#92C13D',
  ambar: '#DFA22C',
  laranja: '#EE7B42',
  vermelho: '#EE5757',
  rosa: '#E94C93',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const fontFamily = {
  light: 'BarlowCondensed_300Light',
  regular: 'BarlowCondensed_400Regular',
  medium: 'BarlowCondensed_500Medium',
  semibold: 'BarlowCondensed_600SemiBold',
  bold: 'BarlowCondensed_700Bold',
} as const;

export type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

type VariantSpec = {
  size: number;
  lineHeight: number;
  family: (typeof fontFamily)[keyof typeof fontFamily];
  /** tracking em `em`; convertido para px sobre o tamanho ja escalado */
  tracking: number;
  uppercase: boolean;
  /** degraus fixos de tamanho: compact, medium, expanded */
  steps: readonly [number, number, number];
};

const variants: Record<Variant, VariantSpec> = {
  display: { size: 92, lineHeight: 0.85, family: fontFamily.bold, tracking: 0, uppercase: false, steps: [0, 8, 16] },
  title: { size: 28, lineHeight: 1.1, family: fontFamily.semibold, tracking: 0.06, uppercase: true, steps: [0, 2, 4] },
  heading: { size: 20, lineHeight: 1.2, family: fontFamily.semibold, tracking: 0, uppercase: false, steps: [0, 1, 2] },
  body: { size: 16, lineHeight: 1.4, family: fontFamily.regular, tracking: 0, uppercase: false, steps: [0, 1, 2] },
  label: { size: 13, lineHeight: 1.2, family: fontFamily.medium, tracking: 0.16, uppercase: true, steps: [0, 0, 1] },
  caption: { size: 12, lineHeight: 1.3, family: fontFamily.regular, tracking: 0, uppercase: false, steps: [0, 0, 1] },
};

const stepIndex: Record<Breakpoint, 0 | 1 | 2> = { compact: 0, medium: 1, expanded: 2 };

export function typographyOf(variant: Variant, breakpoint: Breakpoint): TextStyle {
  const spec = variants[variant];
  const fontSize = spec.size + spec.steps[stepIndex[breakpoint]];
  return {
    fontFamily: spec.family,
    fontSize,
    lineHeight: Math.round(fontSize * spec.lineHeight),
    letterSpacing: fontSize * spec.tracking,
    textTransform: spec.uppercase ? 'uppercase' : 'none',
  };
}

/** Tinge a cor do habito. So o quadrado do icone, as bolinhas, os chips e o glow usam isso. */
export function withOpacity(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
