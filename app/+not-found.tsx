import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.lg,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: Layout.font.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  link: {
    marginTop: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: Layout.font.md,
  },
});
