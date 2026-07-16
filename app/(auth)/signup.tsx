import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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
import { FieldErrors, hasErrors, validateSignUp } from '@/lib/auth';
import { useApp } from '@/store/AppContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useApp();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const found = validateSignUp({ name, username, password, confirm });
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    const result = await signUp({ name, username, password });
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ username: result.error });
      return;
    }
    if (result.needsVerification) {
      Alert.alert(
        'Almost there',
        'Email confirmation is enabled on the backend. For username login, disable "Confirm email" in Supabase, then sign in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/signin') }]
      );
      return;
    }
    router.replace('/onboarding');
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.logo}>
          <Logo size={40} />
        </View>

        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.sub}>
          Track your medication and never miss a dose.
        </Text>

        <View style={styles.form}>
          <TextField
            label="Full name"
            icon="person-outline"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <TextField
            label="Username"
            icon="at-outline"
            placeholder="e.g. alex_morgan"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            error={errors.username}
          />
          <TextField
            label="Password"
            icon="lock-closed-outline"
            placeholder="At least 6 characters"
            toggleSecure
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <TextField
            label="Confirm password"
            icon="lock-closed-outline"
            placeholder="Re-enter password"
            toggleSecure
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
          />

          <PrimaryButton
            label="Create Account"
            icon="arrow-forward"
            onPress={onSubmit}
            loading={submitting}
            style={styles.button}
          />
        </View>

        <Pressable
          style={styles.footer}
          onPress={() => router.replace('/(auth)/signin')}
        >
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.linkStrong}>Sign in</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Layout.spacing.xl,
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
