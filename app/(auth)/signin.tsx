import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useApp } from '@/store/AppContext';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(undefined);
    if (username.trim().length === 0 || password.length === 0) {
      setError('Enter your username and password.');
      return;
    }
    setSubmitting(true);
    const result = await signIn({ username, password });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Route off the freshly returned session, not stale context state.
    router.replace(result.session?.data.hasOnboarded ? '/(tabs)' : '/onboarding');
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.logo}>
          <Logo size={48} />
        </View>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to continue to VitaCare.</Text>

        <View style={styles.form}>
          <TextField
            label="Username"
            icon="at-outline"
            placeholder="Your username"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
          <TextField
            label="Password"
            icon="lock-closed-outline"
            placeholder="Your password"
            toggleSecure
            value={password}
            onChangeText={setPassword}
            error={error}
          />

          <PrimaryButton
            label="Sign In"
            icon="log-in-outline"
            onPress={onSubmit}
            loading={submitting}
            style={styles.button}
          />
        </View>

        <Pressable
          style={styles.footer}
          onPress={() => router.replace('/(auth)/signup')}
        >
          <Text style={styles.footerText}>
            New here? <Text style={styles.linkStrong}>Create an account</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    flexGrow: 1,
  },
  logo: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  heading: {
    fontSize: Layout.font.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: Layout.font.md,
    color: Colors.textMuted,
    marginTop: 6,
    marginBottom: Layout.spacing.lg,
  },
  form: {},
  button: {
    marginTop: Layout.spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
  },
  footerText: {
    fontSize: Layout.font.md,
    color: Colors.textMuted,
  },
  linkStrong: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
