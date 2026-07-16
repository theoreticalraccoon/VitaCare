import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  /** Optional accent stripe down the left edge (color-coded items). */
  accent?: string;
}

/** iOS grouped card — white, rounded, hairline-bordered, minimal shadow. */
export function Card({ children, style, onPress, accent }: Props) {
  const content = (
    <>
      {accent && <View style={[styles.accent, { backgroundColor: accent }]} />}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: Colors.divider }}
        style={({ pressed }) => [
          styles.card,
          accent && styles.withAccent,
          pressed && styles.pressed,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, accent && styles.withAccent, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    overflow: 'hidden',
  },
  withAccent: {
    paddingLeft: Layout.spacing.md + 5,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  pressed: {
    opacity: 0.7,
  },
});
