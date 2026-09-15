// Design system "Architectural Luxury" — CN Personal (Cassiano Neto)
// Extraído do pacote Stitch (DESIGN.md) enviado em 14/09/2026.
// Qualquer ajuste de marca deve ser feito aqui — as telas consomem estes tokens.

export const colors = {
  background: '#131313',
  surface: '#131313',
  surfaceDim: '#131313',
  surfaceBright: '#393939',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerLow: '#1b1b1b',
  surfaceContainer: '#1f1f1f',
  surfaceContainerHigh: '#2a2a2a',
  surfaceContainerHighest: '#353535',

  onSurface: '#e2e2e2',
  onSurfaceVariant: '#d0c5af',
  outline: '#99907c',
  outlineVariant: '#4d4635',

  primary: '#f2ca50',
  onPrimary: '#3c2f00',
  primaryContainer: '#d4af37',
  onPrimaryContainer: '#554300',

  secondary: '#eac249',
  onSecondary: '#3d2f00',

  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  white: '#ffffff',
  black: '#000000',
} as const;

export const fonts = {
  heading: 'PlusJakartaSans_700Bold',
  headingSemiBold: 'PlusJakartaSans_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export const typography = {
  displayLg: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 40 },
  headlineMd: { fontFamily: fonts.headingSemiBold, fontSize: 24, lineHeight: 32 },
  headlineSm: { fontFamily: fonts.headingSemiBold, fontSize: 20, lineHeight: 28 },
  bodyLg: { fontFamily: fonts.body, fontSize: 18, lineHeight: 28 },
  bodyMd: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  labelMd: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  labelSm: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
};

export const radii = {
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Estilos compartilhados usados em várias telas (cards, inputs, botões)
export const shared = {
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
  },
  input: {
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.onSurface,
  },
  inputLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    ...typography.labelMd,
    color: colors.onPrimary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  secondaryButtonText: {
    ...typography.labelMd,
    color: colors.primary,
  },
};
