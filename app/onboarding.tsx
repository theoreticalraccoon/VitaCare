import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CaregiversEditor } from '@/components/CaregiversEditor';
import { ChannelsEditor } from '@/components/ChannelsEditor';
import { MedicationEditor } from '@/components/MedicationEditor';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { requestNotificationPermission } from '@/lib/notifications';
import { useApp } from '@/store/AppContext';

const STEPS = ['Medications', 'Care circle'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, data, completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const count = data?.medications.length ?? 0;

  const next = () => {
    if (step === 0 && count === 0) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const finish = async () => {
    if (data?.channels.notification) await requestNotificationPermission();
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.progress}>
        {step > 0 ? (
          <Pressable hitSlop={10} onPress={() => setStep((s) => s - 1)}>
            <Ionicons name="chevron-back" size={26} color={Colors.info} />
          </Pressable>
        ) : (
          <View style={{ width: 26 }} />
        )}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 ? (
          <>
            <Text style={styles.title}>
              Hi {user?.name?.split(' ')[0] || 'there'} 👋
            </Text>
            <Text style={styles.sub}>
              Add the medications you take and when. You can change these anytime.
            </Text>
            <MedicationEditor />
          </>
        ) : (
          <>
            <Text style={styles.title}>Your care circle</Text>
            <Text style={styles.sub}>
              Loved ones get alerted if you miss a dose, and we&apos;ll remind
              you on time.
            </Text>
            <CaregiversEditor />
            <ChannelsEditor header="How you're reminded" />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < STEPS.length - 1 ? (
          <PrimaryButton
            label="Continue"
            icon="arrow-forward"
            onPress={next}
            disabled={step === 0 && count === 0}
          />
        ) : (
          <>
            <PrimaryButton label="Finish setup" icon="checkmark" onPress={finish} />
            <PrimaryButton
              label="Skip for now"
              variant="plain"
              onPress={finish}
              style={styles.skip}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  dot: {
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.primary },
  content: {
    padding: Layout.spacing.md,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.font.xl,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 4,
  },
  sub: {
    fontSize: Layout.font.sm,
    color: Colors.textMuted,
    marginTop: 6,
    marginBottom: Layout.spacing.lg,
    marginLeft: 4,
    lineHeight: 20,
  },
  footer: {
    padding: Layout.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  skip: {
    marginTop: 4,
  },
});
