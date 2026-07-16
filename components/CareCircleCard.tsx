import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { ListRow, ListSection } from './List';
import { Colors } from '@/constants/Colors';
import { useApp } from '@/store/AppContext';

/** Always-visible care circle (iOS grouped). Tap a member to email them. */
export function CareCircleCard() {
  const router = useRouter();
  const { data, user } = useApp();
  const c = data?.caregivers;

  const email = (address: string) => {
    const subject = encodeURIComponent(`VitaCare — about ${user?.name ?? 'me'}`);
    Linking.openURL(`mailto:${address}?subject=${subject}`).catch(() => {});
  };

  const hasPrimary = !!c?.primaryEmail;
  const hasSecondary = !!c?.secondaryEmail;

  if (!hasPrimary && !hasSecondary) {
    return (
      <ListSection header="Care circle">
        <ListRow
          icon="add"
          iconBg={Colors.primary}
          title="Add your care circle"
          subtitle="Loved ones are alerted if you miss a dose"
          chevron
          onPress={() => router.push('/(tabs)/settings')}
        />
      </ListSection>
    );
  }

  return (
    <ListSection header="Care circle">
      {hasPrimary ? (
        <ListRow
          icon="shield-checkmark"
          iconBg={Colors.primary}
          title={c!.primaryName || 'Primary caregiver'}
          subtitle="Primary caregiver"
          detail="Email"
          onPress={() => email(c!.primaryEmail)}
        />
      ) : null}
      {hasSecondary ? (
        <ListRow
          icon="people"
          iconBg={Colors.accent}
          title={c!.secondaryName || 'Secondary contact'}
          subtitle="Secondary contact"
          detail="Email"
          onPress={() => email(c!.secondaryEmail)}
        />
      ) : null}
    </ListSection>
  );
}
