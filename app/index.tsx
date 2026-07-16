import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LogoMark } from '@/components/Logo';
import { Colors } from '@/constants/Colors';
import { useApp } from '@/store/AppContext';

/**
 * Entry gate. Routes to auth, onboarding or the main tabs depending on the
 * persisted session, after the store has hydrated.
 */
export default function Index() {
  const { isLoading, user, data } = useApp();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <LogoMark size={88} />
        <ActivityIndicator color={Colors.primary} style={styles.spinner} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/signin" />;
  if (!data?.hasOnboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 24,
  },
});
