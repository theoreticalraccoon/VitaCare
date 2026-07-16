import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { ScreenTitle } from '@/components/ScreenTitle';
import { TimelineItem } from '@/components/TimelineItem';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { adherenceRate } from '@/lib/adherence';
import { alertsThisWeek, buildTimeline } from '@/lib/records';
import { useApp } from '@/store/AppContext';

export default function HistoryScreen() {
  const { data } = useApp();
  const logs = data?.logs ?? {};

  const timeline = useMemo(() => buildTimeline(logs), [logs]);
  const alerts = useMemo(() => alertsThisWeek(logs), [logs]);
  const rate = useMemo(() => adherenceRate(Object.values(logs)), [logs]);
  const confirmedCount = useMemo(
    () =>
      Object.values(logs).filter(
        (l) => l.status === 'taken' || l.status === 'late'
      ).length,
    [logs]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle title="History" subtitle="Your adherence at a glance" />

        <View style={styles.stats}>
          <Stat icon="pulse" value={`${rate}%`} label="Adherence" color={Colors.primary} />
          <Stat icon="checkmark-done" value={`${confirmedCount}`} label="Confirmed" color={Colors.success} />
          <Stat
            icon="warning"
            value={`${alerts}`}
            label="Alerts 7d"
            color={alerts > 0 ? Colors.warning : Colors.textFaint}
          />
        </View>

        <Text style={styles.sectionHeader}>ACTIVITY</Text>
        {timeline.length === 0 ? (
          <Card style={styles.empty}>
            <Ionicons name="time-outline" size={30} color={Colors.textFaint} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptySub}>
              Confirm a dose from the Today tab and it appears here.
            </Text>
          </Card>
        ) : (
          <Card style={styles.timelineCard}>
            {timeline.map((entry, i) => (
              <TimelineItem
                key={entry.id}
                color={entry.color}
                icon={entry.icon}
                text={entry.text}
                last={i === timeline.length - 1}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  stats: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 7,
    paddingVertical: Layout.spacing.md,
  },
  statValue: {
    fontSize: 23,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: Layout.font.xs,
    color: Colors.textMuted,
  },
  sectionHeader: {
    fontSize: Layout.font.xs,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginLeft: Layout.spacing.md,
    marginTop: Layout.spacing.lg,
    marginBottom: 8,
  },
  timelineCard: {
    paddingBottom: 0,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    gap: 6,
  },
  emptyTitle: {
    fontSize: Layout.font.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  emptySub: {
    fontSize: Layout.font.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
