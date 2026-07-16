import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

type Variant = 'solid' | 'tinted' | 'plain' | 'outline';

interface Props {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: ViewStyle;
}

/**
 * iOS button. `solid` = filled tint, `tinted` = light fill + tinted label,
 * `plain` = borderless tinted text, `outline` = bordered.
 */
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'solid',
  icon,
  color = Colors.primary,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const solid = variant === 'solid';
  const contentColor = solid ? Colors.white : color;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'plain' && styles.plain,
        solid && { backgroundColor: color },
        variant === 'tinted' && { backgroundColor: tint(color) },
        variant === 'outline' && {
          borderWidth: 1,
          borderColor: color,
          backgroundColor: 'transparent',
        },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={19}
              color={contentColor}
              style={styles.icon}
            />
          )}
          <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Light translucent fill derived from a tint color. */
function tint(color: string): string {
  if (color === Colors.danger) return Colors.dangerSoft;
  if (color === Colors.accent) return Colors.accentSoft;
  return Colors.primarySoft;
}

const styles = StyleSheet.create({
  base: {
    minHeight: Layout.touchTarget,
    borderRadius: Layout.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  plain: {
    minHeight: 44,
    backgroundColor: 'transparent',
  },
  icon: {
    marginRight: 7,
  },
  label: {
    fontSize: Layout.font.md,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
