import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { CareCircleCard } from '@/components/CareCircleCard';
import { ConnectionPill } from '@/components/ConnectionPill';
import { DoseCard } from '@/components/DoseCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressRing } from '@/components/ProgressRing';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { adherenceStreak, isConfirmable, resolveStatus } from '@/lib/adherence';
import { formatTime12, formatTimestamp12, timeToMinutes } from '@/lib/time';
import { useApp } from '@/store/AppContext';
import { Medication } from '@/types';

export default function DashboardScreen() {
  const { user, data, todaysLog, confirmDoseFor } = useApp();
  const meds = data?.medications ?? [];
  const logs = data?.logs ?? {};

  const doses = useMemo(
    () =>
      meds
        .map((med) => ({ med, status: resolveStatus(med, todaysLog(med.id)) }))
        .sort((a, b) => timeToMinutes(a.med.time) - timeToMinutes(b.med.time)),
    [meds, todaysLog]
  );

  const takenCount = doses.filter(
    (d) => d.status === 'taken' || d.status === 'late'
  ).length;
  const total = doses.length;
  const progress = total === 0 ? 0 : takenCount / total;
  const streak = adherenceStreak(meds, logs);
  const nextDue = doses.find((d) => isConfirmable(d.status))?.med;
  const allDone = total > 0 && takenCount === total;

  const onConfirm = (med: Medication) => {
    confirmDoseFor(med);
    const now = new Date();
    const lateBy = Math.max(
      0,
      now.getHours() * 60 + now.getMinutes() - timeToMinutes(med.time)
    );
    if (lateBy > 15) {
      Alert.alert(
        'Dose confirmed',
        `${med.name} taken at ${formatTimestamp12(now.toISOString())} — ${lateBy} min late. ${
          lateBy > 120
            ? 'Primary caregiver and secondary contact notified.'
            : 'Primary caregiver notified.'
        }`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Large title header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>{user?.name?.split(' ')[0]}</Text>
          </View>
          <ConnectionPill />
        </View>

        {/* Summary card */}
        <Card style={styles.summary}>
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>TODAY</Text>
            <Text style={styles.summaryValue}>
              {takenCount} of {total}
            </Text>
            <Text style={styles.summaryUnit}>doses confirmed</Text>
            <View style={styles.streak}>
              <Ionicons name="flame" size={13} color={Colors.accent} />
              <Text style={styles.streakText}>
                {streak} day{streak === 1 ? '' : 's'} streak
              </Text>
            </View>
          </View>
          <ProgressRing
            progress={progress}
            size={104}
            strokeWidth={10}
            color={Colors.primary}
            label={`${Math.round(progress * 100)}%`}
          />
        </Card>

        {/* Core-loop CTA */}
        {nextDue && (
          <Card style={styles.cta}>
            <View style={styles.ctaHead}>
              <Ionicons name="time" size={16} color={Colors.warning} />
              <Text style={styles.ctaTime}>
                DUE NOW · {formatTime12(nextDue.time)}
              </Text>
            </View>
            <Text style={styles.ctaText}>
              Time to take <Text style={styles.ctaMed}>{nextDue.name}</Text>
              {nextDue.dosage ? ` (${nextDue.dosage})` : ''}.
            </Text>
            <PrimaryButton
              label="Confirm Dose"
              icon="checkmark-circle"
              onPress={() => onConfirm(nextDue)}
              style={styles.ctaBtn}
            />
          </Card>
        )}

        {allDone && (
          <Card style={styles.doneCard}>
            <Ionicons name="checkmark-circle" size={26} color={Colors.success} />
            <Text style={styles.doneText}>
              All caught up — nice work keeping your streak going.
            </Text>
          </Card>
        )}

        <CareCircleCard />

        {/* Schedule */}
        <Text style={styles.sectionHeader}>TODAY&apos;S SCHEDULE</Text>
        {total === 0 ? (
          <Card style={styles.empty}>
            <Ionicons name="medkit-outline" size={30} color={Colors.textFaint} />
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptySub}>
              Add them in the Settings tab to start tracking.
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {doses.map(({ med, status }) => {
              const confirmable = isConfirmable(status);
              return (
                <Pressable
                  key={med.id}
                  disabled={!confirmable}
                  onPress={() => onConfirm(med)}
                  style={({ pressed }) => pressed && confirmable && styles.pressed}
                >
                  <DoseCard med={med} status={status} />
                </Pressable>
              );
            })}
            <Text style={styles.tapHint}>Tap a due dose to confirm it.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  greeting: {
    fontSize: Layout.font.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  name: {
    fontSize: Layout.font.xxl,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.37,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.lg,
  },
  summaryText: {
    flexShrink: 1,
  },
  summaryLabel: {
    fontSize: Layout.font.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: Layout.font.xl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  summaryUnit: {
    fontSize: Layout.font.sm,
    color: Colors.textMuted,
    marginTop: 1,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Layout.spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Layout.radius.pill,
  },
  streakText: {
    fontSize: Layout.font.xs,
    fontWeight: '600',
    color: Colors.accent,
  },
  cta: {
    marginBottom: Layout.spacing.md,
    backgroundColor: Colors.warningSoft,
  },
  ctaHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  ctaTime: {
    fontSize: Layout.font.xs,
    fontWeight: '700',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  ctaText: {
    fontSize: Layout.font.md,
    color: Colors.text,
    lineHeight: 22,
  },
  ctaMed: { fontWeight: '700' },
  ctaBtn: { marginTop: Layout.spacing.md },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    backgroundColor: Colors.successSoft,
  },
  doneText: {
    flex: 1,
    fontSize: Layout.font.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: Layout.font.xs,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginLeft: Layout.spacing.md,
    marginBottom: 8,
    marginTop: 4,
  },
  list: {
    gap: 8,
  },
  pressed: { opacity: 0.6 },
  tapHint: {
    fontSize: Layout.font.xs,
    color: Colors.textMuted,
    marginTop: 6,
    marginLeft: Layout.spacing.md,
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
