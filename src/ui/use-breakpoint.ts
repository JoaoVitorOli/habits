import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'compact' | 'medium' | 'expanded';

export function breakpointOf(width: number): Breakpoint {
  if (width >= 900) return 'expanded';
  if (width >= 600) return 'medium';
  return 'compact';
}

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return breakpointOf(width);
}
