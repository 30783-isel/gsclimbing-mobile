import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Cores do projeto GSClimbing
export const colors = {
  // Primary colors (do projeto original)
  primary: '#670B25',
  primaryLight: '#99042E',
  primaryDark: '#50091D',
  
  // Secondary colors
  secondary: '#f7f7f7',
  secondaryDark: '#e0e0e0',
  
  // Status colors
  error: '#d32f2f',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
  
  // Background colors
  background: '#ffffff',
  surface: '#f7f7f7',
  surfaceVariant: '#e8e8e8',
  
  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textLight: '#999999',
  textDisabled: '#cccccc',
  
  // Border colors
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  
  // Other colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  
  // Card colors
  cardBackground: '#ffffff',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

// Light Theme (padrão)
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryDark,
    error: colors.error,
    errorContainer: '#ffebee',
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    outline: colors.border,
    onPrimary: colors.white,
    onSecondary: colors.text,
    onBackground: colors.text,
    onSurface: colors.text,
    onError: colors.white,
  },
  roundness: 8,
  animation: {
    scale: 1.0,
  },
};

// Dark Theme (opcional, para modo noturno)
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primaryLight,
    primaryContainer: colors.primary,
    secondary: '#1e1e1e',
    background: '#121212',
    surface: '#1e1e1e',
    error: colors.error,
  },
  roundness: 8,
};

// Espaçamentos consistentes
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Tamanhos de fonte
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

// Font weights
export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Sombras (shadows)
export const shadows = {
  none: {
    shadowColor: colors.transparent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xlarge: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

// Border radius
export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Icon sizes
export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Layout dimensions
export const layout = {
  headerHeight: 56,
  tabBarHeight: 60,
  bottomSheetHeaderHeight: 50,
  buttonHeight: 48,
  inputHeight: 56,
  listItemHeight: 72,
};

// Animation durations (em ms)
export const duration = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Z-index values
export const zIndex = {
  modal: 1000,
  overlay: 999,
  dropdown: 100,
  header: 50,
  fab: 25,
  base: 1,
};

// Opacities
export const opacity = {
  disabled: 0.38,
  placeholder: 0.54,
  secondary: 0.6,
  hint: 0.7,
  active: 1,
};

// Export tudo junto
export default {
  colors,
  theme,
  darkTheme,
  spacing,
  fontSize,
  fontWeight,
  shadows,
  borderRadius,
  iconSize,
  layout,
  duration,
  zIndex,
  opacity,
};