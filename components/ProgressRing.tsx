import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

interface Props {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  /** Big centered value, e.g. "1/3". */
  label?: string;
  /** Small caption under the value. */
  caption?: string;
  onDark?: boolean;
}

/** Circular progress indicator used for daily dose completion. */
export function ProgressRing({
  progress,
  size = 132,
  strokeWidth = 12,
  color = Colors.primary,
  trackColor,
  label,
  caption,
  onDark = false,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const track =
    trackColor ?? (onDark ? 'rgba(255,255,255,0.22)' : Colors.primarySoft);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        {/* Constrain the label to the ring's clear inner area so it never
            overlaps the stroke, and shrink to fit on small rings. */}
        <View style={{ width: size - strokeWidth * 2 - 8, alignItems: 'center' }}>
          {label && (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              style={[
                styles.value,
                { color: onDark ? Colors.textOnDark : Colors.text },
              ]}
            >
              {label}
            </Text>
          )}
          {caption && (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.caption,
                { color: onDark ? Colors.textOnDarkMuted : Colors.textMuted },
              ]}
            >
              {caption}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
});
