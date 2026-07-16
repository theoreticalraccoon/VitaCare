import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface Props {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  /** Hide the connecting line on the last item. */
  last?: boolean;
}

/** One entry in the Records alert timeline, with a connecting rail. */
export function TimelineItem({ color, icon, text, last }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: color }]}>
          <Ionicons name={icon} size={14} color={Colors.white} />
        </View>
        {!last && <View style={styles.line} />}
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rail: {
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  text: {
    flex: 1,
    fontSize: Layout.font.sm,
    lineHeight: 22,
    color: Colors.text,
    paddingBottom: Layout.spacing.lg,
  },
});
