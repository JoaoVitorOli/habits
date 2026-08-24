import { Easing } from 'react-native-reanimated';

export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
export const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);

export const duration = {
  /** feedback de toque */
  press: 120,
  /** toggle, chip, selecao */
  toggle: 180,
  /** sheet e modal */
  sheet: 300,
} as const;
