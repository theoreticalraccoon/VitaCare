import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaregiversEditor } from '@/components/CaregiversEditor';
import { ChannelsEditor } from '@/components/ChannelsEditor';
import { ConnectionPill } from '@/components/ConnectionPill';
import { ListRow, ListSection } from '@/components/List';
import { MedicationEditor } from '@/components/MedicationEditor';
import { ScreenTitle } from '@/components/ScreenTitle';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useApp } from '@/store/AppContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useApp();
  const [deleting, setDeleting] = useState(false);

  const onSignOut = () => {
    Alert.alert('Sign out', 'Sign out of VitaCare?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/signin');
        },
      },
    ]);
  };

  const onDeleteAccount = () => {
    // Two-step confirmation — this is permanent.
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, medications, and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Are you sure?', 'This is your last chance — your data will be gone for good.', [
              { text: 'Keep my account', style: 'cancel' },
              {
                text: 'Delete forever',
                style: 'destructive',
                onPress: async () => {
                  setDeleting(true);
                  const res = await deleteAccount();
                  setDeleting(false);
                  if (res.ok) {
                    router.replace('/(auth)/signin');
                  } else {
                    Alert.alert('Could not delete account', res.error ?? 'Please try again.');
                  }
                },
              },
            ]),
        },
      ]
    );
  };

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenTitle title="Settings" right={<ConnectionPill />} />

        {/* Profile header */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>@{user?.username}</Text>
        </View>

        <MedicationEditor header="Medication schedule" />

        <CaregiversEditor />

        <ChannelsEditor header="Reminders" />

        <ListSection>
          <ListRow
            title="Sign Out"
            center
            destructive
            onPress={onSignOut}
          />
        </ListSection>

        <ListSection footer="Permanently deletes your account, medications, and history. This cannot be undone.">
          <ListRow
            title={deleting ? 'Deleting…' : 'Delete Account'}
            center
            destructive
            onPress={deleting ? undefined : onDeleteAccount}
          />
        </ListSection>

        <Text style={styles.version}>VitaCare · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  profile: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.sm,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Layout.font.xl,
    fontWeight: '700',
  },
  profileName: {
    fontSize: Layout.font.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  profileEmail: {
    fontSize: Layout.font.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  groupHeader: {
    fontSize: Layout.font.xs,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginLeft: Layout.spacing.md,
    marginBottom: 7,
  },
  version: {
    textAlign: 'center',
    fontSize: Layout.font.xs,
    color: Colors.textFaint,
    marginTop: Layout.spacing.lg,
  },
});
