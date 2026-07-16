import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * iOS-aligned spacing, radius and type tokens. Font sizes follow Apple's text
 * styles (Large Title 34, Title 28, Title3 20, Headline/Body 17, Subhead 15,
 * Footnote 13, Caption 12). The system font is used on each platform.
 */
export const Layout = {
  window: { width, height },
  isSmallDevice: width < 375,
  /** System font family — San Francisco on iOS, system default elsewhere. */
  fontFamily: Platform.select({ ios: 'System', default: undefined }),
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 44,
  },
  radius: {
    sm: 8,
    md: 12, // standard iOS card
    lg: 16,
    pill: 999,
  },
  font: {
    xs: 13, // footnote
    sm: 15, // subhead
    md: 17, // body / headline
    lg: 20, // title3
    xl: 28, // title1
    xxl: 34, // large title
  },
  /** Hairline separator height. */
  hairline: 0.5,
  touchTarget: 50,
} as const;
