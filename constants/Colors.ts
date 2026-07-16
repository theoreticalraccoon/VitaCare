/**
 * VitaCare design system — built from the brand palette:
 *   #1A3A2E (deep green) · #215944 (green) · #E8735A (coral) · #000 · #FFF
 *
 * Greens carry the brand (headers, buttons, gradients); coral is the accent.
 * Amber/red are kept ONLY for the dose status traffic-light (taken/late/missed),
 * which is an accessibility feature. Always reference these tokens, not raw hex.
 */

export const Colors = {
  // Brand greens
  primary: '#215944',
  primaryDark: '#1A3A2E',
  primaryDeep: '#12281F', // gradient end / logo detail
  primarySoft: '#E3EDE8', // tinted chips / ring track
  primarySofter: '#F0F5F2',

  // Coral accent
  accent: '#E8735A',
  accentSoft: '#FBE7E2',

  // Neutrals
  background: '#F2F6F4', // soft near-white, green-tinted
  surface: '#FFFFFF',
  surfaceAlt: '#FAFBFA',
  white: '#FFFFFF',

  // Text (near-black with a faint green undertone for cohesion)
  text: '#0E1A15',
  textMuted: '#5A6B64',
  textFaint: '#92A09A',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.78)',

  // Secondary action / neutral interactive (brand green, not blue)
  info: '#215944',

  // Status — dose traffic-light + destructive actions
  success: '#215944', // taken on time (brand green)
  successSoft: '#E3EDE8',
  warning: '#E0A100', // late / due
  warningSoft: '#FBF0D2',
  danger: '#D9534F', // missed / destructive
  dangerSoft: '#FBE3E2',

  border: '#E3EAE7',
  divider: '#ECF1EE',
} as const;

/** Gradient stops for hero/header surfaces, derived from the brand greens. */
export const Gradients = {
  brand: ['#2C6E54', '#215944', '#173A2C'] as const,
  brandSoft: ['#2C6E54', '#215944'] as const,
};

export type ColorName = keyof typeof Colors;
