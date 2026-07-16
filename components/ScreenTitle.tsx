import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

/** iOS large-title navigation header. */
export function ScreenTitle({ title, subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.md,
  },
  text: { flex: 1 },
  title: {
    fontSize: Layout.font.xxl,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.37,
  },
  subtitle: {
    fontSize: Layout.font.sm,
    color: Colors.textMuted,
    marginTop: 3,
  },
});
