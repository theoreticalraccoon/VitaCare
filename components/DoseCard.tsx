import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { statusStyle } from '@/lib/adherence';
import { formatTime12 } from '@/lib/time';
import { DoseStatus, Medication } from '@/types';

interface Props {
  med: Medication;
  status: DoseStatus;
}

const ICONS: Record<DoseStatus, keyof typeof Ionicons.glyphMap> = {
  taken: 'checkmark-circle-outline',
  late: 'alert-circle-outline',
  due: 'time-outline',
  missed: 'close-circle-outline',
  pending: 'ellipse-outline',
};

/** iOS cell for a scheduled medication, color-coded by status. */
export function DoseCard({ med, status }: Props) {
  const s = statusStyle(status);

  return (
    <View style={styles.cell}>
      <View style={[styles.iconTile, { backgroundColor: med.color }]}>
        <Ionicons name="medical" size={18} color={Colors.white} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {med.name}
        </Text>
        <Text style={styles.meta}>
          {formatTime12(med.time)}
          {med.dosage ? ` · ${med.dosage}` : ''}
        </Text>
      </View>
      <View style={styles.status}>
        <Ionicons name={ICONS[status]} size={15} color={s.color} />
        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 12,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  middle: {
    flex: 1,
  },
  name: {
    fontSize: Layout.font.md,
    fontWeight: '600',
    color: Colors.text,
  },
  meta: {
    fontSize: Layout.font.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: Layout.font.xs,
    fontWeight: '600',
  },
});
